-- =====================================================================
-- CINEMAX_FULL — Database check queries
-- Open this in MySQL Workbench: File > Open SQL Script > check_database.sql
-- Ensure a connection to 127.0.0.1:3306 (root, blank password), then press
-- the Execute (lightning bolt) button.
-- =====================================================================

USE cinemamax_full;

-- 1) Quick summary
SELECT 'movies' AS entity, COUNT(*) AS total FROM movies
UNION ALL SELECT 'cinemas', COUNT(*) FROM cinemas
UNION ALL SELECT 'halls', COUNT(*) FROM halls
UNION ALL SELECT 'seats', COUNT(*) FROM seats
UNION ALL SELECT 'showtimes', COUNT(*) FROM showtimes
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments;

-- 2) Latest bookings (newest first) — your new booking should be on top
SELECT id, booking_ref, user_id, seats_summary, ticket_count,
       total_amount, status, booking_date
FROM bookings
ORDER BY id DESC;

-- 3) Seats you just booked (status = booked) per showtime
SELECT st.show_date, st.show_time, s.seat_row, s.seat_number, s.seat_type, ss.status
FROM showtime_seats ss
JOIN seats s       ON s.id = ss.seat_id
JOIN showtimes st  ON st.id = ss.showtime_id
WHERE ss.status IN ('locked', 'booked')
ORDER BY st.show_date, st.show_time, s.seat_row, s.seat_number;

-- 4) Payments recorded
SELECT p.id, p.amount, p.payment_method, p.transaction_id, p.status, p.paid_at, b.booking_ref
FROM payments p
JOIN bookings b ON b.id = p.booking_id
ORDER BY p.paid_at DESC;

-- 5) Live seating map for a specific showtime (change 1 to your showtime_id)
SELECT s.seat_row, s.seat_number, s.seat_type, ss.status
FROM seats s
JOIN showtime_seats ss ON ss.seat_id = s.id AND ss.showtime_id = 1
ORDER BY s.seat_row, s.seat_number;

-- 6) Revenue summary + per movie
SELECT COUNT(*) AS total_bookings,
       SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
       COALESCE(SUM(total_amount), 0) AS total_revenue
FROM bookings;

SELECT m.title,
       COUNT(b.id)                              AS bookings,
       COALESCE(SUM(b.total_amount), 0)         AS revenue
FROM movies m
LEFT JOIN showtimes st ON st.movie_id = m.id
LEFT JOIN bookings b   ON b.showtime_id = st.id AND b.status = 'confirmed'
GROUP BY m.id, m.title
ORDER BY revenue DESC;

-- 7) Bookings made today
SELECT booking_ref, seats_summary, ticket_count, total_amount, status
FROM bookings
WHERE booking_date = CURDATE()
ORDER BY id;