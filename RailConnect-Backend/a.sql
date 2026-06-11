-- =============================================================
-- RAILWAY RESERVATION SYSTEM - CORRECTED SCHEMA
-- =============================================================

DROP DATABASE IF EXISTS RAILWAY;
CREATE DATABASE RAILWAY;
USE RAILWAY;

-- DROP existing objects in safe order
DROP PROCEDURE IF EXISTS book_ticket;
DROP PROCEDURE IF EXISTS cancel_and_promote;
DROP PROCEDURE IF EXISTS create_passenger_and_book;
DROP TRIGGER IF EXISTS trg_reduce_seat;
DROP TRIGGER IF EXISTS trg_return_seat;
DROP TRIGGER IF EXISTS trg_promote_waitlist;

DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS passenger;
DROP TABLE IF EXISTS train;
DROP TABLE IF EXISTS users;

-- =============================================================
-- USERS: login accounts (passengers have role 'user', admins 'admin')
-- =============================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================
-- PASSENGER: 1:1 mapping to users (user_id optional for admins)
-- =============================================================
CREATE TABLE passenger (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    phone VARCHAR(20) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TRAIN
-- =============================================================
CREATE TABLE train (
    train_no INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_station VARCHAR(50) NOT NULL,
    end_station VARCHAR(50) NOT NULL,
    journey_days INT NOT NULL,
    total_seats INT NOT NULL
) ENGINE=InnoDB;

-- =============================================================
-- AVAILABILITY: current seats available for each train
-- =============================================================
CREATE TABLE availability (
    train_no INT PRIMARY KEY,
    available_seats INT NOT NULL,
    FOREIGN KEY (train_no) REFERENCES train(train_no) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- BOOKING
-- =============================================================
CREATE TABLE booking (
    pnr BIGINT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT NOT NULL,
    train_no INT NOT NULL,
    status ENUM('CONFIRMED','WAITLIST','CANCELLED') NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (train_no) REFERENCES train(train_no) ON DELETE CASCADE
) ENGINE=InnoDB;

DELIMITER $$

-- =============================================================
-- STORED TRIGGERS
-- =============================================================

CREATE TRIGGER trg_create_availability_after_train_insert
AFTER INSERT ON train
FOR EACH ROW
BEGIN
    INSERT INTO availability (train_no, available_seats)
    VALUES (NEW.train_no, NEW.total_seats);
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_adjust_seats_after_train_update
AFTER UPDATE ON train
FOR EACH ROW
BEGIN
    IF NEW.total_seats <> OLD.total_seats THEN
        CALL adjust_train_seats(NEW.train_no);
    END IF;
END$$

DELIMITER ;

-- =============================================================
-- STORED PROCEDURES (atomic operations)
-- =============================================================

DELIMITER $$

CREATE PROCEDURE register_user (
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_phone VARCHAR(20)
)
BEGIN
    DECLARE v_email_count INT DEFAULT 0;
    DECLARE v_phone_count INT DEFAULT 0;
    DECLARE v_user_id INT;

    START TRANSACTION;

    -- Check email exists
    SELECT COUNT(*) INTO v_email_count
    FROM users
    WHERE email = p_email;

    IF v_email_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email already registered';
    END IF;

    -- Check phone exists
    SELECT COUNT(*) INTO v_phone_count
    FROM passenger
    WHERE phone = p_phone;

    IF v_phone_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phone number already registered';
    END IF;

    -- Insert into users table
    INSERT INTO users (name, email, password)
    VALUES (p_name, p_email, p_password);

    SET v_user_id = LAST_INSERT_ID();

    -- Insert into passenger table
    INSERT INTO passenger (user_id, phone)
    VALUES (v_user_id, p_phone);

    COMMIT;

END $$

DELIMITER ;

DELIMITER $$

/* book_ticket:
   - Locks availability row with FOR UPDATE
   - If seats > 0: decrement seat and insert CONFIRMED
   - Else: insert WAITLIST
*/
CREATE PROCEDURE IF NOT EXISTS book_ticket (
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
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Train or availability not found';
    ELSEIF seats > 0 THEN
        -- decrement seat and confirm
        UPDATE availability
        SET available_seats = available_seats - 1
        WHERE train_no = p_train_no;

        INSERT INTO booking (passenger_id, train_no, status)
        VALUES (p_passenger_id, p_train_no, 'CONFIRMED');
    ELSE
        -- no seats: add to waitlist
        INSERT INTO booking (passenger_id, train_no, status)
        VALUES (p_passenger_id, p_train_no, 'WAITLIST');
    END IF;

    COMMIT;
END$$


/* cancel_and_promote:
   - Cancels given PNR
   - If waitlist exists -> promote earliest WL to CONFIRMED (seat transferred)
   - Else -> increment availability (+1)
   All done in one transaction to preserve consistency.
*/

CREATE PROCEDURE cancel_and_promote(IN p_pnr BIGINT)
done: BEGIN
    DECLARE v_train_no INT;
    DECLARE v_status VARCHAR(20);
    DECLARE v_waitlist_pnr BIGINT;

    START TRANSACTION;

    -- Lock the booking row and fetch status + train_no
    SELECT train_no, status INTO v_train_no, v_status
    FROM booking
    WHERE pnr = p_pnr
    FOR UPDATE;

    IF v_train_no IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PNR not found';
    END IF;

    -- Mark this PNR cancelled
    UPDATE booking
    SET status = 'CANCELLED'
    WHERE pnr = p_pnr;

    -- -------------------------
    -- CASE 1: Was WAITLIST
    -- -------------------------
    IF v_status = 'WAITLIST' THEN
        COMMIT;
        LEAVE done;   -- now valid
    END IF;

    -- -------------------------
    -- CASE 1.1: Was CANCELLED
    -- -------------------------
    IF v_status = 'CANCELLED' THEN
        COMMIT;
        LEAVE done;   -- now valid
    END IF;

    -- -------------------------
    -- CASE 2: Was CONFIRMED
    -- -------------------------

    -- find earliest waitlist entry for same train (lock it)
    SELECT pnr INTO v_waitlist_pnr
    FROM booking
    WHERE train_no = v_train_no
      AND status = 'WAITLIST'
    ORDER BY booking_time ASC
    LIMIT 1
    FOR UPDATE;

    IF v_waitlist_pnr IS NULL THEN
        -- no waitlist -> return seat
        UPDATE availability
        SET available_seats = available_seats + 1
        WHERE train_no = v_train_no;
    ELSE
        -- promote waitlist entry to confirmed (seat transferred)
        UPDATE booking
        SET status = 'CONFIRMED'
        WHERE pnr = v_waitlist_pnr;
    END IF;

    COMMIT;

END done$$

/* create_passenger_and_book:
   - If user_id exists and passenger row for that user doesn't exist, create it with provided phone
   - Then call book_ticket(passenger_id, train_no)
*/
CREATE PROCEDURE create_passenger_and_book(
    IN p_user_id INT,
    IN p_phone VARCHAR(20),
    IN p_train_no INT
)
BEGIN
    DECLARE v_passenger_id INT;
    DECLARE v_exists INT;

    -- check user exists
    SELECT COUNT(*) INTO v_exists FROM users WHERE user_id = p_user_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;

    -- try to find passenger linked to this user
    SELECT passenger_id INTO v_passenger_id
    FROM passenger
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_passenger_id IS NULL THEN
        -- create passenger linked to user
        INSERT INTO passenger (user_id, phone)
        VALUES (p_user_id, p_phone);
        SET v_passenger_id = LAST_INSERT_ID();
    END IF;

    -- call existing booking procedure
    CALL book_ticket(v_passenger_id, p_train_no);

END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE adjust_train_seats(IN p_train_no INT)
BEGIN
    DECLARE new_total INT;
    DECLARE old_available INT;
    DECLARE confirmed_count INT;
    DECLARE diff INT;
    DECLARE free_seats INT;
    DECLARE wl_pnr BIGINT;
    DECLARE cf_pnr BIGINT;
    DECLARE excess_confirmed INT;

    -- Fetch new total seats
    SELECT total_seats INTO new_total
    FROM train
    WHERE train_no = p_train_no;

    -- Current availability
    SELECT available_seats INTO old_available
    FROM availability
    WHERE train_no = p_train_no;

    -- Current confirmed count
    SELECT COUNT(*) INTO confirmed_count
    FROM booking
    WHERE train_no = p_train_no AND status = 'CONFIRMED';

    -- Difference in total seats
    SET diff = new_total - (confirmed_count + old_available);

    -- ========================================
    -- CASE A: SEAT INCREASE (diff > 0)
    -- ========================================
    IF diff > 0 THEN
        -- Increase availability directly
        UPDATE availability
        SET available_seats = old_available + diff
        WHERE train_no = p_train_no;

        promote_loop: LOOP
            SELECT available_seats INTO free_seats
            FROM availability
            WHERE train_no = p_train_no;

            IF free_seats <= 0 THEN
                LEAVE promote_loop;
            END IF;

            -- Oldest waitlist passenger
            SELECT pnr INTO wl_pnr
            FROM booking
            WHERE train_no = p_train_no AND status = 'WAITLIST'
            ORDER BY booking_time ASC
            LIMIT 1;

            IF wl_pnr IS NULL THEN
                LEAVE promote_loop;
            END IF;

            -- Promote
            UPDATE booking
            SET status = 'CONFIRMED'
            WHERE pnr = wl_pnr;

            -- Reduce available seat
            UPDATE availability
            SET available_seats = available_seats - 1
            WHERE train_no = p_train_no;
        END LOOP promote_loop;

        -- Final availability = new_total − updated_confirmed
        SELECT COUNT(*) INTO confirmed_count
        FROM booking
        WHERE train_no = p_train_no AND status='CONFIRMED';

        SET free_seats = new_total - confirmed_count;
        IF free_seats < 0 THEN SET free_seats = 0; END IF;

        UPDATE availability
        SET available_seats = free_seats
        WHERE train_no = p_train_no;

    -- ========================================
    -- CASE B: SEAT DECREASE (diff < 0)
    -- ========================================
    ELSEIF diff < 0 THEN
        -- New total seats might be < confirmed_count, compute excess
        SET excess_confirmed = confirmed_count - new_total;

        IF excess_confirmed > 0 THEN
            demote_loop: LOOP
                IF excess_confirmed <= 0 THEN LEAVE demote_loop; END IF;

                -- Pick latest confirmed passenger (LIFO)
                SELECT pnr INTO cf_pnr
                FROM booking
                WHERE train_no = p_train_no AND status='CONFIRMED'
                ORDER BY booking_time DESC
                LIMIT 1;

                IF cf_pnr IS NULL THEN
                    LEAVE demote_loop;
                END IF;

                -- Demote
                UPDATE booking
                SET status = 'WAITLIST'
                WHERE pnr = cf_pnr;

                SET excess_confirmed = excess_confirmed - 1;
            END LOOP demote_loop;
        END IF;

        -- Recompute remaining confirmed
        SELECT COUNT(*) INTO confirmed_count
        FROM booking
        WHERE train_no = p_train_no AND status='CONFIRMED';

        -- Set correct availability
        SET free_seats = new_total - confirmed_count;
        IF free_seats < 0 THEN SET free_seats = 0; END IF;

        UPDATE availability
        SET available_seats = free_seats
        WHERE train_no = p_train_no;

    -- ========================================
    -- CASE C: diff = 0 (nothing to change)
    -- ========================================
    ELSE
        -- Safety: recompute availability
        SET free_seats = new_total - confirmed_count;
        IF free_seats < 0 THEN SET free_seats = 0; END IF;

        UPDATE availability
        SET available_seats = free_seats
        WHERE train_no = p_train_no;
    END IF;

END$$

DELIMITER ;

-- =============================================================
-- (No triggers that modify booking from booking trigger)
-- We intentionally avoid triggers that update booking from booking triggers
-- to prevent MySQL 1442 recursion problems. Procedures handle seat/wl logic.
-- =============================================================

-- =============================================================
-- SAMPLE DATA (users, passengers, trains, availability)
-- =============================================================

-- Users (passwords must be hashed by app; these are placeholders)
INSERT INTO users (name, email, password, role)
VALUES
('Admin', 'admin@example.com', 'CHANGE_ME', 'admin'),
('Amit Kumar', 'amit@example.com', 'CHANGE_ME', 'user'),
('Riya Sharma', 'riya@example.com', 'CHANGE_ME', 'user'),
('Rahul Verma', 'rahul@example.com', 'CHANGE_ME', 'user');

-- Create passenger rows linked to users (user_id 2..4)
INSERT INTO passenger (user_id, phone) VALUES
(2, '9876543210'),
(3, '9123456780'),
(4, '9988776655');

-- Trains
INSERT INTO train (train_no, name, start_station, end_station, journey_days, total_seats) VALUES
(101, 'Intercity Express', 'Delhi', 'Kanpur', 1, 100),
(102, 'Rajdhani Express', 'Mumbai', 'Delhi', 2, 120),
(103, 'Shatabdi Express', 'Bangalore', 'Chennai', 1, 80);

-- Availability (must match total_seats initially)
# INSERT INTO availability (train_no, available_seats) VALUES
# (101, 100),
# (102, 120),
# (103, 80);

-- =============================================================
-- HELPFUL CRUD & ADVANCED QUERIES (examples)
-- =============================================================

-- TRAIN CRUD
-- Insert train + availability
INSERT INTO train (train_no, name, start_station, end_station, journey_days, total_seats)
VALUES (104, 'Superfast', 'Kolkata', 'Patna', 1, 150);
INSERT INTO train (train_no, name, start_station, end_station, journey_days, total_seats)
VALUES (104, 'Superfast', 'Kolkata', 'Patna', 1, 150);

INSERT INTO availability (train_no, available_seats) VALUES (104, 150);

INSERT INTO train (train_no, name, start_station, end_station, journey_days, total_seats)
VALUES (110, 'Sampoorna Kranti Express', 'New Delhi', 'Rajendra Nagar Terminal', 1, 3);

-- Read
SELECT * FROM train;
SELECT * FROM train WHERE train_no = 101;

-- Update (admin)
UPDATE train SET name = 'Intercity Superfast', total_seats = 118 WHERE train_no = 101;

-- Availability read/update
SELECT * FROM availability;
UPDATE availability SET available_seats = 90 WHERE train_no = 101;

-- PASSENGER CRUD
SELECT * FROM users;
INSERT INTO passenger (user_id, phone) VALUES (NULL, '9012345678'); -- unlinked passenger (rare)
SELECT * FROM passenger;
UPDATE passenger SET phone = '9123456789' WHERE passenger_id = 1;
DELETE FROM passenger WHERE passenger_id = 5;

-- BOOKING CRUD (use procedures)
-- Book (preferred)
CALL book_ticket(1, 101); -- passenger_id 1 books train 101
-- Or create passenger for a user and book in single call:
CALL create_passenger_and_book(3, '9123456780', 101);
CALL create_passenger_and_book(3, '1234567890', 101);

SELECT * FROM booking ORDER BY booking_time DESC;
SELECT * FROM booking WHERE pnr = 1;

-- Cancel and auto-promote if possible
CALL cancel_and_promote(1); -- cancel PNR 1

SELECT * FROM availability;
CALL book_ticket(1, 110);
CALL book_ticket(1, 110);
CALL book_ticket(1, 110);
CALL book_ticket(2, 110);
CALL book_ticket(3, 110);
CALL book_ticket(2, 110);
CALL cancel_and_promote(4);
CALL cancel_and_promote(3);
CALL cancel_and_promote(1);
CALL cancel_and_promote(2);
UPDATE train SET journey_days = 2 WHERE train_no = 110;
UPDATE train SET total_seats = 1 WHERE train_no = 110;
UPDATE train SET total_seats = 3 WHERE train_no = 110;
UPDATE train SET total_seats = 4 WHERE train_no = 110;
CALL book_ticket(2, 110);
CALL book_ticket(3, 110);
CALL book_ticket(3, 110);
CALL book_ticket(2, 110);
UPDATE train SET total_seats = 5 WHERE train_no = 110;

-- ANALYTICAL QUERIES
-- Seat occupancy %
SELECT t.train_no, t.name, a.available_seats, t.total_seats,
       ROUND((a.available_seats / t.total_seats) * 100, 2) AS percent_left
FROM train t JOIN availability a ON t.train_no = a.train_no
ORDER BY percent_left ASC;

-- Bookings summary per train
SELECT train_no,
       COUNT(*) AS total_bookings,
       SUM(status = 'CONFIRMED') AS confirmed_count,
       SUM(status = 'WAITLIST') AS waitlist_count,
       SUM(status = 'CANCELLED') AS cancelled_count
FROM booking
GROUP BY train_no;

-- Waitlist queue for a train
SELECT b.pnr, b.passenger_id, p.phone, b.booking_time
FROM booking b JOIN passenger p ON b.passenger_id = p.passenger_id
WHERE b.train_no = 110 AND b.status = 'WAITLIST'
ORDER BY b.booking_time ASC;

-- =============================================================
-- END OF FILE
-- =============================================================

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

show tables;

-- Queries demonstration
INSERT INTO users (name, email, password, role)
VALUES ('John Doe', 'john@example.com', 'PASS', 'user');

UPDATE users SET name = 'Johnny' WHERE user_id = 10;
SELECT * FROM users WHERE user_id = 10;
DELETE FROM users WHERE user_id = 10;

