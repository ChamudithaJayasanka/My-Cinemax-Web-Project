<?php
/**
 * GET /admin/dashboard_stats.php
 * Returns aggregated data shaped for Chart.js on the admin dashboard:
 *  - revenue & bookings per movie
 *  - bookings per day (last 14 days)
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Revenue + booking count per movie
$byMovie = $pdo->query(
    "SELECT m.title,
            COALESCE(SUM(p.amount), 0) AS total_revenue,
            COUNT(DISTINCT b.id) AS total_bookings
     FROM movies m
     LEFT JOIN showtimes st ON st.movie_id = m.id
     LEFT JOIN bookings b ON b.showtime_id = st.id AND b.status = 'confirmed'
     LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
     GROUP BY m.id
     ORDER BY total_revenue DESC"
)->fetchAll();

// Bookings per day, last 14 days
$byDay = $pdo->query(
    "SELECT DATE(b.created_at) AS booking_date, COUNT(*) AS bookings
     FROM bookings b
     WHERE b.status = 'confirmed' AND b.created_at >= (CURDATE() - INTERVAL 14 DAY)
     GROUP BY DATE(b.created_at)
     ORDER BY booking_date"
)->fetchAll();

jsonResponse([
    'revenue_by_movie'  => $byMovie,
    'bookings_last_14d' => $byDay,
]);
