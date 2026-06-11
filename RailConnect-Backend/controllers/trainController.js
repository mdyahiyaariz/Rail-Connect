import { pool } from "../db.js";
import { catchAsync } from "../utils/catchAsync.js";

/* Public: All trains with seat availability */
export const getTrains = catchAsync(async (req, res) => {
    const [rows] = await pool.query(
        `
        SELECT 
            t.train_no,
            t.name,
            t.start_station,
            t.end_station,
            t.journey_days,
            t.total_seats,
            a.available_seats
        FROM train t
        LEFT JOIN availability a ON a.train_no = t.train_no
        ORDER BY t.train_no;
        `
    );

    res.json(rows);
});

/* Public: Single train with availability */
export const getTrain = catchAsync(async (req, res) => {
    const [[train]] = await pool.query(
        `
        SELECT 
            t.train_no,
            t.name,
            t.start_station,
            t.end_station,
            t.journey_days,
            t.total_seats,
            a.available_seats
        FROM train t
        LEFT JOIN availability a ON a.train_no = t.train_no
        WHERE t.train_no = ?
        `,
        [req.params.id]
    );

    res.json(train || null);
});

/* Public: Waitlist queue for a specific train */
export const getTrainWaitlist = catchAsync(async (req, res) => {
    const train_no = req.params.id;

    const [waitlist] = await pool.query(
        `
        SELECT 
            b.pnr,
            b.passenger_id,
            b.booking_time,
            p.phone
        FROM booking b
        JOIN passenger p ON p.passenger_id = b.passenger_id
        WHERE b.train_no = ? AND b.status = 'WAITLIST'
        ORDER BY b.booking_time ASC
        `,
        [train_no]
    );

    // Add position to each waitlist entry
    const waitlistWithPosition = waitlist.map((entry, index) => ({
        position: index + 1,
        ...entry,
    }));

    res.json({
        success: true,
        train_no: parseInt(train_no),
        total_waitlist: waitlist.length,
        waitlist: waitlistWithPosition,
    });
});
