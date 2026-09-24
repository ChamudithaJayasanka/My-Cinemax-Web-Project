<?php
/**
 * GET /api/site.php
 * One-call bootstrap for the frontend. Returns everything the CinemaMax
 * app needs to "go live" against the cinemamax_full database:
 * movies (+aggregated genres/subtitles/formats/cast), cinemas, halls,
 * showtimes (with live available-seat counts), offers, notifications,
 * watchlist, bookings (joined) and users (no password hash).
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Movies with comma-joined side tables
$movies = $pdo->query(
    "SELECT m.*,
            (SELECT GROUP_CONCAT(g.genre    ORDER BY g.genre    SEPARATOR ', ') FROM movies_genres   g WHERE g.movie_id = m.id) AS genre,
            (SELECT GROUP_CONCAT(s.subtitle ORDER BY s.subtitle SEPARATOR ', ') FROM movies_subtitles s WHERE s.movie_id = m.id) AS subtitle,
            (SELECT GROUP_CONCAT(f.format   ORDER BY f.format   SEPARATOR ', ') FROM movies_formats   f WHERE f.movie_id = m.id) AS format,
            (SELECT GROUP_CONCAT(c.cast_name ORDER BY c.cast_name SEPARATOR ', ') FROM movies_cast    c WHERE c.movie_id = m.id) AS `cast`
     FROM movies m
     ORDER BY m.id"
)->fetchAll();

$cinemas = $pdo->query('SELECT * FROM cinemas ORDER BY id')->fetchAll();
$halls   = $pdo->query('SELECT * FROM halls ORDER BY cinema_id, id')->fetchAll();

// Showtimes with current available-seat count
$showtimes = $pdo->query(
    "SELECT st.id AS showtime_id, st.movie_id, h.cinema_id, st.hall_id, st.show_date, st.show_time,
            (SELECT COUNT(*) FROM showtime_seats ss
              JOIN seats s ON ss.seat_id = s.id
             WHERE ss.showtime_id = st.id AND ss.status = 'available') AS available
     FROM showtimes st
     JOIN halls h ON st.hall_id = h.id
     ORDER BY st.movie_id, h.cinema_id, st.hall_id, st.show_time"
)->fetchAll();

$offers = $pdo->query('SELECT * FROM offers ORDER BY id')->fetchAll();
$notifications = $pdo->query('SELECT * FROM notifications ORDER BY id')->fetchAll();
$watchlist = $pdo->query('SELECT * FROM watchlist ORDER BY user_id')->fetchAll();

$bookings = $pdo->query(
    "SELECT b.*, m.title AS movie_title, c.name AS cinema_name, h.name AS hall_name,
            st.show_date, st.show_time
     FROM bookings b
     JOIN showtimes st ON st.id = b.showtime_id
     JOIN movies m     ON m.id = st.movie_id
     JOIN halls h      ON h.id = st.hall_id
     JOIN cinemas c    ON c.id = h.cinema_id
     ORDER BY b.created_at DESC"
)->fetchAll();

$users = $pdo->query(
    'SELECT id, name, email, phone, role, avatar FROM users ORDER BY id'
)->fetchAll();

jsonResponse([
    'movies'        => $movies,
    'cinemas'       => $cinemas,
    'halls'         => $halls,
    'showtimes'     => $showtimes,
    'offers'        => $offers,
    'notifications' => $notifications,
    'watchlist'     => $watchlist,
    'bookings'      => $bookings,
    'users'         => $users,
]);