import { pool } from "../db.js";
import bcrypt from "bcrypt";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

/* Create passenger profile (only once) */
export const createPassenger = catchAsync(async (req, res) => {
    const user_id = req.user.user_id;
    const { phone } = req.body;

    const [p] = await pool.query(
        "SELECT passenger_id FROM passenger WHERE user_id = ?",
        [user_id]
    );

    if (p.length) throw new AppError("Passenger already exists", 400);

    await pool.query("INSERT INTO passenger (user_id, phone) VALUES (?, ?)", [
        user_id,
        phone,
    ]);

    res.json({ success: true, message: "Passenger Created" });
});

/* Get user profile (user + passenger combined) */
export const getUserProfile = catchAsync(async (req, res) => {
    const user_id = req.user.user_id;

    const [[profile]] = await pool.query(
        `
        SELECT 
            u.user_id,
            u.name,
            u.email,
            u.role,
            u.created_at,
            p.passenger_id,
            p.phone
        FROM users u
        LEFT JOIN passenger p ON p.user_id = u.user_id
        WHERE u.user_id = ?
        `,
        [user_id]
    );

    if (!profile) throw new AppError("User not found", 404);

    res.json({ success: true, profile });
});

/* Update user + passenger profile */
export const updateProfile = catchAsync(async (req, res) => {
    const user_id = req.user.user_id;
    const { name, email, password, phone } = req.body;

    if (!name && !email && !password && !phone)
        throw new AppError("Nothing to update", 400);

    const userUpdate = [];
    const userValues = [];

    if (name) {
        userUpdate.push("name = ?");
        userValues.push(name);
    }
    if (email) {
        userUpdate.push("email = ?");
        userValues.push(email);
    }
    if (password) {
        const hashed = await bcrypt.hash(password, 10);
        userUpdate.push("password = ?");
        userValues.push(hashed);
    }

    if (userUpdate.length > 0) {
        userValues.push(user_id);
        await pool.query(
            `UPDATE users SET ${userUpdate.join(", ")} WHERE user_id = ?`,
            userValues
        );
    }

    if (phone) {
        await pool.query("UPDATE passenger SET phone = ? WHERE user_id = ?", [
            phone,
            user_id,
        ]);
    }

    res.json({ success: true, message: "Profile Updated" });
});

/* Change password */
export const changePassword = catchAsync(async (req, res) => {
    const user_id = req.user.user_id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new AppError("Both old and new passwords are required", 400);
    }

    // Get current password hash
    const [[user]] = await pool.query(
        "SELECT password FROM users WHERE user_id = ?",
        [user_id]
    );

    if (!user) throw new AppError("User not found", 404);

    // Compare old password
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) throw new AppError("Old password is incorrect", 401);

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update DB
    await pool.query("UPDATE users SET password = ? WHERE user_id = ?", [
        hashed,
        user_id,
    ]);

    res.json({ success: true, message: "Password changed successfully." });
});

/* Book ticket */
export const bookTicketForUser = catchAsync(async (req, res) => {
    const user_id = req.user.user_id;
    const { train_no, phone } = req.body;

    const [[p]] = await pool.query(
        "SELECT passenger_id FROM passenger WHERE user_id = ?",
        [user_id]
    );

    if (p) {
        await pool.query("CALL book_ticket(?, ?)", [p.passenger_id, train_no]);
    } else {
        await pool.query("CALL create_passenger_and_book(?, ?, ?)", [
            user_id,
            phone,
            train_no,
        ]);
    }

    res.json({ success: true, message: "Booking done" });
});

/* Cancel booking (must belong to user) */
export const cancelTicketForUser = catchAsync(async (req, res) => {
    const { pnr } = req.body;
    const user_id = req.user.user_id;

    // Check ownership + fetch status
    const [rows] = await pool.query(
        `SELECT b.pnr, b.status
         FROM booking b
         JOIN passenger p ON p.passenger_id = b.passenger_id
         WHERE b.pnr = ? AND p.user_id = ?`,
        [pnr, user_id]
    );

    if (!rows.length) {
        throw new AppError("Not your booking", 403);
    }

    const status = rows[0].status;

    // If already canceled → prevent stored procedure call
    if (status === "CANCELLED") {
        throw new AppError("PNR already cancelled", 400);
    }

    // Now safe to cancel
    await pool.query("CALL cancel_and_promote(?)", [pnr]);

    res.json({ success: true, message: "Booking cancelled successfully" });
});

/* User booking list */
export const getMyBookings = catchAsync(async (req, res) => {
    const user_id = req.user.user_id;
    const status = req.query.status;

    const params = [user_id];
    let query = `
    SELECT b.*, t.name AS train_name 
    FROM booking b
    JOIN passenger p ON p.passenger_id = b.passenger_id
    JOIN train t ON t.train_no = b.train_no
    WHERE p.user_id = ?
  `;

    if (status) {
        query += " AND b.status = ?";
        params.push(status);
    }

    const [rows] = await pool.query(query, params);

    res.json(rows);
});

/* Booking summary */
export const getBookingSummary = catchAsync(async (req, res) => {
    const user_id = req.user.user_id;

    const [[summary]] = await pool.query(
        `
    SELECT
      COUNT(*) AS total,
      SUM(status='CONFIRMED') AS confirmed,
      SUM(status='WAITLIST') AS waitlist,
      SUM(status='CANCELLED') AS cancelled
    FROM booking b
    JOIN passenger p ON p.passenger_id = b.passenger_id
    WHERE p.user_id = ?
  `,
        [user_id]
    );

    res.json({ success: true, summary });
});

/* Get waitlist position for a booking */
export const getWaitlistPosition = catchAsync(async (req, res) => {
    const { pnr } = req.params;
    const user_id = req.user.user_id;

    // Verify ownership and get booking details
    const [[booking]] = await pool.query(
        `SELECT b.pnr, b.status, b.train_no, b.booking_time
         FROM booking b
         JOIN passenger p ON p.passenger_id = b.passenger_id
         WHERE b.pnr = ? AND p.user_id = ?`,
        [pnr, user_id]
    );

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "WAITLIST") {
        throw new AppError("This booking is not on the waitlist", 400);
    }

    // Calculate waitlist position
    const [[result]] = await pool.query(
        `SELECT COUNT(*) + 1 AS position
         FROM booking
         WHERE train_no = ? 
         AND status = 'WAITLIST'
         AND booking_time < ?`,
        [booking.train_no, booking.booking_time]
    );

    res.json({
        success: true,
        pnr: booking.pnr,
        train_no: booking.train_no,
        status: booking.status,
        waitlist_position: result.position,
    });
});
