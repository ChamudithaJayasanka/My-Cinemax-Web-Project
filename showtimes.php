<?php
/**
 * GET /api/showtimes.php?movie_id=1&date=2026-09-24
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

if (!isset($_GET['movie_id'])) {
    jsonResponse(['error' => 'movie_id is required'], 400);
}

$movieId = (int)$_GET['movie_id'];
$date    = $_GET['date'] ?? null;

$sql = 'SELECT s.id, s.show_date, s.show_time, s.base_price, s.premium_price,
               h.name AS hall_name, c.name AS cinema_name, c.city
        FROM showtimes s
        JOIN halls h ON s.hall_id = h.id
        JOIN cinemas c ON h.cinema_id = c.id
        WHERE s.movie_id = ?';
$params = [$movieId];

if ($date) {
    $sql .= ' AND s.show_date = ?';
    $params[] = $date;
} else {
    $sql .= ' AND s.show_date >= CURDATE()';
}

$sql .= ' ORDER BY s.show_date, s.show_time';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
jsonResponse($stmt->fetchAll());
