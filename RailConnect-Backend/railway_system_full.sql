-- =============================================================
-- RAILWAY RESERVATION SYSTEM - FULL SCHEMA, TRIGGERS, QUERIES
-- =============================================================
-- Run this file on an empty database (InnoDB) to create schema,
-- triggers, stored procedure and some sample data.
-- =============================================================

CREATE DATABASE RAILWAY;
DROP DATABASE RAILWAY;
USE RAILWAY;

-- DROP in dependency order (safe reset)
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS passenger;
DROP TABLE IF EXISTS train;
DROP TABLE IF EXISTS users;

-- ===================================================================
-- TRAIN TABLE: basic train info (single seat type - chair car)
-- ===================================================================
CREATE TABLE train (
    train_no INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_station VARCHAR(50) NOT NULL,
    end_station VARCHAR(50) NOT NULL,
    journey_days INT NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats > 0)
) ENGINE=InnoDB;

-- ===================================================================
-- AVAILABILITY: track remaining seats per train (global, no dates)
-- ===================================================================
CREATE TABLE availability (
    train_no INT PRIMARY KEY,
    available_seats INT NOT NULL CHECK (available_seats >= 0),
    FOREIGN KEY (train_no) REFERENCES train(train_no) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===================================================================
-- PASSENGER: individual passenger records
-- ===================================================================
CREATE TABLE passenger (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE
) ENGINE=InnoDB;

-- ===================================================================
-- BOOKING: PNR, status, passenger + train relation
-- ===================================================================
CREATE TABLE booking (
    pnr BIGINT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT NOT NULL,
    train_no INT NOT NULL,
    status ENUM('CONFIRMED','WAITLIST','CANCELLED') NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (train_no) REFERENCES train(train_no) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===================================================================
-- USERS: for login/register (admin or normal user)
-- password stored hashed
-- ===================================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SHOW TABLES;

-- ===================================================================
-- TRIGGERS: maintain availability and auto-promote waitlist
-- Note: triggers assume booking inserts/updates done normally (or via proc)
-- ===================================================================

DELIMITER $$

-- reduce seat when a CONFIRMED booking is inserted
CREATE TRIGGER trg_reduce_seat
AFTER INSERT ON booking
FOR EACH ROW
BEGIN
    IF NEW.status = 'CONFIRMED' THEN
        UPDATE availability
        SET available_seats = available_seats - 1
        WHERE train_no = NEW.train_no;
    END IF;
END$$

DELIMITER ;

DROP TRIGGER IF EXISTS trg_promote_waitlist;
DROP TRIGGER IF EXISTS trg_return_seat;

-- ===================================================================
-- STORED PROCEDURE: atomic booking using FOR UPDATE lock
-- book_ticket(passenger_id, train_no)
-- Ensures no overbooking under concurrency
-- Inserts CONFIRMED if seat available, otherwise WAITLIST
-- ===================================================================
DELIMITER $$

CREATE PROCEDURE book_ticket (
    IN p_passenger_id INT,
    IN p_train_no INT
)
BEGIN
    DECLARE seats INT;

    START TRANSACTION;

    SELECT available_seats INTO seats
    FROM availability
    WHERE train_no = p_train_no
    FOR UPDATE;

    IF seats IS NULL THEN
        -- train not found or availability missing
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Train or availability not found';
    ELSEIF seats > 0 THEN
        INSERT INTO booking (passenger_id, train_no, status)
        VALUES (p_passenger_id, p_train_no, 'CONFIRMED');
    ELSE
        INSERT INTO booking (passenger_id, train_no, status)
        VALUES (p_passenger_id, p_train_no, 'WAITLIST');
    END IF;

    COMMIT;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS cancel_and_promote;

DELIMITER $$

CREATE PROCEDURE cancel_and_promote(IN p_pnr BIGINT)
BEGIN
    DECLARE v_train_no INT;
    DECLARE v_waitlist_pnr BIGINT;

    START TRANSACTION;

    -- 1. Get train number of the booking being cancelled
    SELECT train_no INTO v_train_no
    FROM booking
    WHERE pnr = p_pnr
    FOR UPDATE;

    -- 2. Cancel the booking
    UPDATE booking
    SET status = 'CANCELLED'
    WHERE pnr = p_pnr;

    -- 3. Check if waitlisted passenger exists
    SELECT pnr INTO v_waitlist_pnr
    FROM booking
    WHERE train_no = v_train_no
      AND status = 'WAITLIST'
    ORDER BY booking_time ASC
    LIMIT 1
    FOR UPDATE;

    -- 4. If no waitlist exists -> return seat
    IF v_waitlist_pnr IS NULL THEN

        UPDATE availability
        SET available_seats = available_seats + 1
        WHERE train_no = v_train_no;

    ELSE
        -- 5. Promote the earliest waitlisted ticket
        UPDATE booking
        SET status = 'CONFIRMED'
        WHERE pnr = v_waitlist_pnr;

        -- NOTE: seat is transferred automatically
        -- so DO NOT increment availability
    END IF;

    COMMIT;
END$$

DELIMITER ;

-- ===================================================================
-- SAMPLE DATA
-- ===================================================================
INSERT INTO train (train_no, name, start_station, end_station, journey_days, total_seats) VALUES
(101, 'Intercity Express', 'Delhi', 'Kanpur', 1, 100),
(102, 'Rajdhani Express', 'Mumbai', 'Delhi', 2, 120),
(103, 'Shatabdi Express', 'Bangalore', 'Chennai', 1, 80);

INSERT INTO availability (train_no, available_seats) VALUES
(101, 100), (102, 120), (103, 80);

INSERT INTO passenger (name, phone) VALUES
('Amit Kumar', '9876543210'),
('Riya Sharma', '9123456780'),
('Rahul Verma', '9988776655');

-- create a sample user (password to be hashed by app in practice)
-- You may INSERT via app's register to hash properly.
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', 'CHANGE_ME', 'admin');

-- ===================================================================
-- CRUD + ADVANCED QUERIES (copy/paste as needed)
-- ===================================================================

-- 1) TRAIN CRUD
-- Create (insert new train & initialize availability)
INSERT INTO train (train_no, name, start_station, end_station, journey_days, total_seats)
VALUES (104, 'Superfast', 'Kolkata', 'Patna', 1, 150);

INSERT INTO train (train_no, name, start_station, end_station, journey_days, total_seats)
VALUES (110, 'Sampoorna Kranti Express', 'New Delhi', 'Rajendra Nagar Terminal', 1, 2);

INSERT INTO availability (train_no, available_seats) VALUES (104, 150);
INSERT INTO availability (train_no, available_seats) VALUES (110, 2);

-- Read all trains
SELECT * FROM train;

-- Read by train_no
SELECT * FROM train WHERE train_no = 101;

-- Update train (and if total_seats changed update availability accordingly)
UPDATE train SET name='Intercity Superfast', total_seats=118 WHERE train_no = 101;

-- (after updating total_seats run this to resync availability)
UPDATE availability a
JOIN (
  SELECT t.train_no, (t.total_seats - COALESCE(confirmed.confirmed_count,0)) AS new_available
  FROM train t
  LEFT JOIN (
    SELECT train_no, COUNT(*) AS confirmed_count FROM booking WHERE status='CONFIRMED' GROUP BY train_no
  ) confirmed ON confirmed.train_no = t.train_no
) AS calc ON calc.train_no = a.train_no
SET a.available_seats = GREATEST(0, calc.new_available);

-- Delete train (availability and bookings cascade if FKs set)
DELETE FROM train WHERE train_no = 110;

-- 2) AVAILABILITY CRUD
SELECT * FROM availability;
SELECT * FROM availability WHERE train_no = 101;
UPDATE availability SET available_seats = 90 WHERE train_no = 101;

-- 3) PASSENGER CRUD
INSERT INTO passenger (name, phone) VALUES ('Sandeep', '9012345678');
SELECT * FROM passenger;
SELECT * FROM passenger WHERE passenger_id = 1;
UPDATE passenger SET phone='9123456789' WHERE passenger_id = 1;
DELETE FROM passenger WHERE passenger_id = 5;

-- 4) BOOKING CRUD
-- Book via stored procedure (preferred)
CALL book_ticket(1, 101);
CALL book_ticket(2, 101);
-- Book 4 tickets in train no 110
CALL book_ticket(1, 110);
CALL book_ticket(2, 110);
CALL book_ticket(3, 110);
CALL book_ticket(4, 110);

-- Or insert manually (not recommended unless you manage availability yourself)
INSERT INTO booking (passenger_id, train_no, status) VALUES (1, 101, 'CONFIRMED');

SELECT * FROM booking ORDER BY booking_time DESC;
SELECT * FROM booking WHERE pnr = 1;
SELECT * FROM booking;

-- Cancel booking (triggers will return seat and promote waitlist)
# UPDATE booking SET status = 'CANCELLED' WHERE pnr = 1;
CALL cancel_and_promote(8);   -- cancels PNR 8 of train no 110
CALL cancel_and_promote(9);   -- cancels PNR 9 of train no 110
CALL cancel_and_promote(10);   -- cancels PNR 10 of train no 110

-- 5) USERS CRUD (use application register to hash)
SELECT user_id, name, email, role, created_at FROM users;
SELECT * FROM users WHERE user_id = 1;
UPDATE users SET name='Supreme' WHERE user_id = 1;
DELETE FROM users WHERE user_id = 10;

-- 6) ADVANCED ANALYTICAL QUERIES

-- 6.1 Trains with seat percentage
SELECT t.train_no, t.name, a.available_seats, t.total_seats,
       ROUND((a.available_seats / t.total_seats) * 100, 2) AS percent_left
FROM train t JOIN availability a ON t.train_no = a.train_no
ORDER BY percent_left ASC;

-- 6.2 Total bookings per train with counts
SELECT train_no,
       COUNT(*) AS total_bookings,
       SUM(status = 'CONFIRMED') AS confirmed_count,
       SUM(status = 'WAITLIST') AS waitlist_count,
       SUM(status = 'CANCELLED') AS cancelled_count
FROM booking
GROUP BY train_no;

-- 6.3 Waitlist queue per train (earliest first)
SELECT b.pnr, b.passenger_id, p.name, b.booking_time
FROM booking b JOIN passenger p ON b.passenger_id = p.passenger_id
WHERE b.train_no = 110 AND b.status = 'WAITLIST'
ORDER BY b.booking_time ASC;

-- 6.4 Find fully booked trains
SELECT t.train_no, t.name FROM train t JOIN availability a ON t.train_no = a.train_no
WHERE a.available_seats = 0;

-- 6.5 Frequent travellers (confirmed bookings > 1)
SELECT p.passenger_id, p.name, COUNT(*) AS trips
FROM booking b JOIN passenger p ON b.passenger_id = p.passenger_id
WHERE b.status = 'CONFIRMED'
GROUP BY p.passenger_id
HAVING trips > 1;

-- 6.6 Search trains by route
SELECT * FROM train WHERE start_station = 'Delhi' AND end_station = 'Kanpur';

-- 7) DEBUG / VIEW
SELECT * FROM train;
SELECT * FROM availability;
SELECT * FROM passenger;
SELECT * FROM booking ORDER BY booking_time;

-- ===================================================================
-- END OF SQL FILE
-- ===================================================================
