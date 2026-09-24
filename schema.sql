-- =====================================================================
-- CINEMAMAX DATABASE SCHEMA
-- Cinema Ticket Booking System (Sri Lanka)
-- Engine: MySQL 8.x / MariaDB 10.x
-- =====================================================================

DROP DATABASE IF EXISTS cinemamax;
CREATE DATABASE cinemamax CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinemamax;

-- ---------------------------------------------------------------------
-- 1. USERS (customers)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100)        NOT NULL,
    email           VARCHAR(150)        NOT NULL UNIQUE,
    phone           VARCHAR(20)         NULL,
    password_hash   VARCHAR(255)        NOT NULL,
    language_pref   ENUM('en','si','ta') NOT NULL DEFAULT 'en',
    status          ENUM('active','suspended') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. ADMINS (staff / cinema admins)
-- ---------------------------------------------------------------------
CREATE TABLE admins (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)         NOT NULL UNIQUE,
    password_hash   VARCHAR(255)        NOT NULL,
    role            ENUM('super_admin','manager','staff') NOT NULL DEFAULT 'staff',
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. CINEMAS (branches)
-- ---------------------------------------------------------------------
CREATE TABLE cinemas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)        NOT NULL,
    city            VARCHAR(100)        NOT NULL,
    address         VARCHAR(255)        NULL,
    contact_number  VARCHAR(20)         NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. HALLS (screens within a cinema)
-- ---------------------------------------------------------------------
CREATE TABLE halls (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    cinema_id       INT                 NOT NULL,
    name            VARCHAR(50)         NOT NULL,      -- e.g. "Hall 1", "IMAX"
    total_rows      INT                 NOT NULL DEFAULT 8,
    seats_per_row   INT                 NOT NULL DEFAULT 10,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. SEATS (physical seat map per hall)
-- ---------------------------------------------------------------------
CREATE TABLE seats (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    hall_id         INT                 NOT NULL,
    seat_row        VARCHAR(2)          NOT NULL,       -- A, B, C ...
    seat_number     INT                 NOT NULL,       -- 1, 2, 3 ...
    seat_type       ENUM('standard','premium','vip') NOT NULL DEFAULT 'standard',
    FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_seat (hall_id, seat_row, seat_number)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. MOVIES
-- ---------------------------------------------------------------------
CREATE TABLE movies (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(150)        NOT NULL,
    genre           VARCHAR(100)        NULL,
    language        VARCHAR(50)         NULL,          -- Sinhala / Tamil / English
    duration_min    INT                 NOT NULL,
    description     TEXT                NULL,
    poster_url      VARCHAR(255)        NULL,
    release_date    DATE                NULL,
    status          ENUM('now_showing','upcoming','ended') NOT NULL DEFAULT 'now_showing',
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. SHOWTIMES
-- ---------------------------------------------------------------------
CREATE TABLE showtimes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    movie_id        INT                 NOT NULL,
    hall_id         INT                 NOT NULL,
    show_date       DATE                NOT NULL,
    show_time       TIME                NOT NULL,
    base_price      DECIMAL(10,2)       NOT NULL,       -- LKR
    premium_price   DECIMAL(10,2)       NOT NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (hall_id)  REFERENCES halls(id)  ON DELETE CASCADE,
    INDEX idx_show_lookup (movie_id, show_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. SHOWTIME_SEATS (per-show seat availability — this is what makes
--    seat selection possible without seats colliding across shows)
-- ---------------------------------------------------------------------
CREATE TABLE showtime_seats (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id     INT                 NOT NULL,
    seat_id         INT                 NOT NULL,
    status          ENUM('available','locked','booked') NOT NULL DEFAULT 'available',
    locked_at       TIMESTAMP           NULL,           -- for temporary holds during checkout
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id)     REFERENCES seats(id)      ON DELETE CASCADE,
    UNIQUE KEY uniq_showtime_seat (showtime_id, seat_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. BOOKINGS
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref     VARCHAR(20)         NOT NULL UNIQUE,   -- e.g. CMX-20260923-0001
    user_id         INT                 NOT NULL,
    showtime_id     INT                 NOT NULL,
    total_amount    DECIMAL(10,2)       NOT NULL,
    status          ENUM('pending','confirmed','cancelled','expired') NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. BOOKING_SEATS (which seats belong to which booking)
-- ---------------------------------------------------------------------
CREATE TABLE booking_seats (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    booking_id          INT             NOT NULL,
    showtime_seat_id    INT             NOT NULL,
    price               DECIMAL(10,2)   NOT NULL,
    FOREIGN KEY (booking_id)       REFERENCES bookings(id)       ON DELETE CASCADE,
    FOREIGN KEY (showtime_seat_id) REFERENCES showtime_seats(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_booking_seat (showtime_seat_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. PAYMENTS
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT                 NOT NULL,
    amount          DECIMAL(10,2)       NOT NULL,
    payment_method  ENUM('card','bank_transfer','cash') NOT NULL DEFAULT 'card',
    transaction_id  VARCHAR(100)        NULL,
    status          ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
    paid_at         TIMESTAMP           NULL,
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- SAMPLE / SEED DATA
-- =====================================================================

INSERT INTO cinemas (name, city, address, contact_number) VALUES
('CinemaMax Colombo', 'Colombo', '123 Galle Road, Colombo 03', '0112233445'),
('CinemaMax Kandy', 'Kandy', '45 Peradeniya Road, Kandy', '0812233445');

INSERT INTO halls (cinema_id, name, total_rows, seats_per_row) VALUES
(1, 'Hall 1', 8, 10),
(1, 'IMAX', 10, 12),
(2, 'Hall 1', 6, 8);

-- Generate seats for Hall 1 (Colombo): rows A-H, seats 1-10
INSERT INTO seats (hall_id, seat_row, seat_number, seat_type)
SELECT 1, CHAR(64 + r), n,
       CASE WHEN r >= 7 THEN 'premium' ELSE 'standard' END
FROM (SELECT 1 r UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
      UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) r_vals
JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
      UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) n_vals;

INSERT INTO movies (title, genre, language, duration_min, description, poster_url, release_date, status) VALUES
('Godhawari', 'Drama', 'Sinhala', 128, 'A gripping Sri Lankan drama.', 'godhawari.jpg', '2026-08-01', 'now_showing'),
('Avengers: New Dawn', 'Action', 'English', 145, 'The next chapter in the superhero saga.', 'avengers.jpg', '2026-09-01', 'now_showing'),
('Vaanam Kottai', 'Thriller', 'Tamil', 132, 'A high-stakes heist thriller.', 'vaanam.jpg', '2026-09-15', 'now_showing');

INSERT INTO showtimes (movie_id, hall_id, show_date, show_time, base_price, premium_price) VALUES
(1, 1, '2026-09-24', '14:00:00', 800.00, 1200.00),
(1, 1, '2026-09-24', '18:30:00', 900.00, 1300.00),
(2, 2, '2026-09-24', '19:00:00', 1200.00, 1800.00),
(3, 3, '2026-09-25', '17:00:00', 700.00, 1000.00);

-- Populate showtime_seats for showtime 1 (all seats of hall 1, available)
INSERT INTO showtime_seats (showtime_id, seat_id, status)
SELECT 1, id, 'available' FROM seats WHERE hall_id = 1;

INSERT INTO showtime_seats (showtime_id, seat_id, status)
SELECT 2, id, 'available' FROM seats WHERE hall_id = 1;

-- Real bcrypt hash for the password "admin123" (change this after first login).
INSERT INTO admins (username, password_hash, role) VALUES
('admin', '$2b$10$K88hnWr8GSfxRUlVwI5HIOlI0OJg2U8zQtDs9nXsJo3bypOs8ITK6', 'super_admin');

-- =====================================================================
-- USEFUL / COMMON QUERIES (reference — also implemented in PHP in api/)
-- =====================================================================

-- A) List all now-showing movies
-- SELECT * FROM movies WHERE status = 'now_showing' ORDER BY release_date DESC;

-- B) Get all showtimes for a movie on a given date
-- SELECT s.id, s.show_time, h.name AS hall_name, c.name AS cinema_name, s.base_price, s.premium_price
-- FROM showtimes s
-- JOIN halls h ON s.hall_id = h.id
-- JOIN cinemas c ON h.cinema_id = c.id
-- WHERE s.movie_id = ? AND s.show_date = ?;

-- C) Get seat map (availability) for a showtime
-- SELECT ss.id AS showtime_seat_id, se.seat_row, se.seat_number, se.seat_type, ss.status
-- FROM showtime_seats ss
-- JOIN seats se ON ss.seat_id = se.id
-- WHERE ss.showtime_id = ?
-- ORDER BY se.seat_row, se.seat_number;

-- D) Revenue report per movie (for Chart.js dashboard)
-- SELECT m.title, SUM(p.amount) AS total_revenue, COUNT(DISTINCT b.id) AS total_bookings
-- FROM payments p
-- JOIN bookings b ON p.booking_id = b.id
-- JOIN showtimes st ON b.showtime_id = st.id
-- JOIN movies m ON st.movie_id = m.id
-- WHERE p.status = 'success'
-- GROUP BY m.id
-- ORDER BY total_revenue DESC;

-- E) A user's booking history
-- SELECT b.booking_ref, m.title, st.show_date, st.show_time, b.total_amount, b.status
-- FROM bookings b
-- JOIN showtimes st ON b.showtime_id = st.id
-- JOIN movies m ON st.movie_id = m.id
-- WHERE b.user_id = ?
-- ORDER BY b.created_at DESC;
