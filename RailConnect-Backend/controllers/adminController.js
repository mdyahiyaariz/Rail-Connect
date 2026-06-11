import { pool } from "../db.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

/* ADMIN: Add Train */
export const createTrain = catchAsync(async (req, res) => {
    const {
        train_no,
        name,
        start_station,
        end_station,
        journey_days,
        total_seats,
    } = req.body;

    await pool.query(
        `INSERT INTO train (train_no, name, start_station, end_station, journey_days, total_seats)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [train_no, name, start_station, end_station, journey_days, total_seats]
    );

    res.json({ message: "Train Added" });
});

/* ADMIN: Update train */
export const updateTrain = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;

    const allowed = [
        "name",
        "start_station",
        "end_station",
        "journey_days",
        "total_seats",
    ];
    const sets = [];
    const vals = [];

    allowed.forEach((k) => {
        if (payload[k] !== undefined) {
            sets.push(`${k} = ?`);
            vals.push(payload[k]);
        }
    });

    if (!sets.length) throw new AppError("Nothing to update", 400);
    vals.push(id);

    await pool.query(
        `UPDATE train SET ${sets.join(", ")} WHERE train_no = ?`,
        vals
    );

    res.json({ message: "Train Updated" });
});

/* ADMIN: Delete train */
export const deleteTrain = catchAsync(async (req, res) => {
    await pool.query("DELETE FROM train WHERE train_no = ?", [req.params.id]);
    res.json({ message: "Train Deleted" });
});

/* ADMIN: Train Details */
export const getTrainDetails = catchAsync(async (req, res) => {
    const [[train]] = await pool.query(
        "SELECT * FROM train t LEFT JOIN availability a USING(train_no) WHERE t.train_no = ?",
        [req.params.id]
    );

    if (!train) throw new AppError("Train not found", 404);

    res.json(train);
});

/* ADMIN: Statistics */
export const getStatistics = catchAsync(async (req, res) => {
    const { train_no } = req.query;

    // If train_no is provided return detailed stats + passenger list for that train
    if (train_no) {
        const [[stat]] = await pool.query(
            `
            SELECT t.train_no, t.name, t.total_seats, 
                         COALESCE(a.available_seats, 0) AS available_seats,
                         COUNT(b.pnr) AS total_bookings,
                         SUM(b.status='CONFIRMED') AS confirmed,
                         SUM(b.status='WAITLIST') AS waitlist,
                         SUM(b.status='CANCELLED') AS cancelled,
                         ROUND(((t.total_seats - COALESCE(a.available_seats, 0)) / NULLIF(t.total_seats,0)) * 100, 2) AS occupancy_percentage
            FROM train t
            LEFT JOIN availability a USING(train_no)
            LEFT JOIN booking b USING(train_no)
            WHERE t.train_no = ?
            GROUP BY t.train_no
        `,
            [train_no]
        );

        // Fetch passengers with active bookings (CONFIRMED + WAITLIST) for the train
        const [passengers] = await pool.query(
            `
            SELECT b.pnr, b.status, b.booking_time, p.passenger_id, p.phone, u.user_id, u.name AS user_name, u.email
            FROM booking b
            JOIN passenger p ON p.passenger_id = b.passenger_id
            LEFT JOIN users u ON u.user_id = p.user_id
            WHERE b.train_no = ? AND b.status != 'CANCELLED'
            ORDER BY b.booking_time ASC
        `,
            [train_no]
        );

        return res.json({ success: true, stat: stat || null, passengers });
    }

    // Default: return summary statistics for all trains (includes occupancy)
    const [stats] = await pool.query(`
        SELECT t.train_no, t.name, t.total_seats, COALESCE(a.available_seats,0) AS available_seats,
                     COUNT(b.pnr) AS total_bookings,
                     SUM(b.status='CONFIRMED') AS confirmed,
                     SUM(b.status='WAITLIST') AS waitlist,
                     SUM(b.status='CANCELLED') AS cancelled,
                     ROUND(((t.total_seats - COALESCE(a.available_seats,0)) / NULLIF(t.total_seats,0)) * 100, 2) AS occupancy_percentage
        FROM train t
        LEFT JOIN availability a USING(train_no)
        LEFT JOIN booking b USING(train_no)
        GROUP BY t.train_no
        ORDER BY t.train_no
    `);

    res.json(stats);
});
