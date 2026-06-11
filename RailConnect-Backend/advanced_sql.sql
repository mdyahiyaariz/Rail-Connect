USE RAILWAY;

SELECT * FROM users;
SELECT * FROM passenger;
SELECT * FROM train;
SELECT * FROM availability;
SELECT * FROM booking ORDER BY booking_time DESC;

DESC users;
DESC passenger;
DESC train;
DESC availability;
DESC booking;

-- Get trains with availability
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

-- Get single train with availability
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
WHERE t.train_no = 110;

-- Get user profile with passenger details
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
WHERE u.user_id = 2;

-- Check booking ownership
SELECT b.pnr, b.status
FROM booking b
JOIN passenger p ON p.passenger_id = b.passenger_id
WHERE b.pnr = 27 AND p.user_id = 8;

-- Get user bookings
SELECT b.*, t.name AS train_name
FROM booking b
JOIN passenger p ON p.passenger_id = b.passenger_id
JOIN train t ON t.train_no = b.train_no
WHERE p.user_id = 1;
-- Optional: AND b.status = ?

-- Get train waitlist
SELECT
    b.pnr,
    b.passenger_id,
    b.booking_time,
    p.phone
FROM booking b
JOIN passenger p ON p.passenger_id = b.passenger_id
WHERE b.train_no = 110 AND b.status = 'WAITLIST'
ORDER BY b.booking_time ASC;

-- Get passengers for specific train
SELECT
    b.pnr,
    b.status,
    b.booking_time,
    p.passenger_id,
    p.phone,
    u.user_id,
    u.name AS user_name,
    u.email
FROM booking b
JOIN passenger p ON p.passenger_id = b.passenger_id
LEFT JOIN users u ON u.user_id = p.user_id
WHERE b.train_no = 110 AND b.status != 'CANCELLED'
ORDER BY b.booking_time ASC;

-- Get booking summary for user
SELECT
    COUNT(*) AS total,
    SUM(status='CONFIRMED') AS confirmed,
    SUM(status='WAITLIST') AS waitlist,
    SUM(status='CANCELLED') AS cancelled
FROM booking b
JOIN passenger p ON p.passenger_id = b.passenger_id
WHERE p.user_id = 1;

-- Get waitlist position
SELECT COUNT(*) + 1 AS position
FROM booking
WHERE train_no = (SELECT train_no FROM booking WHERE pnr = 27)
AND status = 'WAITLIST'
AND booking_time < (SELECT booking_time FROM booking WHERE pnr = 27);

-- Get booking details for waitlist
SELECT b.pnr, b.status, b.train_no, b.booking_time
FROM booking b
JOIN passenger p ON p.passenger_id = b.passenger_id
WHERE b.pnr = 27 AND p.user_id = 8;

-- Get statistics for all trains
SELECT
    t.train_no,
    t.name,
    t.total_seats,
    COALESCE(a.available_seats, 0) AS available_seats,
    COUNT(b.pnr) AS total_bookings,
    SUM(b.status='CONFIRMED') AS confirmed,
    SUM(b.status='WAITLIST') AS waitlist,
    SUM(b.status='CANCELLED') AS cancelled,
    ROUND(((t.total_seats - COALESCE(a.available_seats, 0)) / NULLIF(t.total_seats, 0)) * 100, 2) AS occupancy_percentage
FROM train t
LEFT JOIN availability a USING(train_no)
LEFT JOIN booking b USING(train_no)
GROUP BY t.train_no
ORDER BY t.train_no;

-- Get statistics for specific train
SELECT
    t.train_no,
    t.name,
    t.total_seats,
    COALESCE(a.available_seats, 0) AS available_seats,
    COUNT(b.pnr) AS total_bookings,
    SUM(b.status='CONFIRMED') AS confirmed,
    SUM(b.status='WAITLIST') AS waitlist,
    SUM(b.status='CANCELLED') AS cancelled,
    ROUND(((t.total_seats - COALESCE(a.available_seats, 0)) / NULLIF(t.total_seats, 0)) * 100, 2) AS occupancy_percentage
FROM train t
LEFT JOIN availability a USING(train_no)
LEFT JOIN booking b USING(train_no)
WHERE t.train_no = 110
GROUP BY t.train_no;