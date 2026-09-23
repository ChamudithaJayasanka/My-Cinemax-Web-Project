<?php
/**
 * GET /api/seats.php?showtime_id=1
 * Returns the full seat map with live availability for a showtime.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

if (!isset($_GET['showtime_id'])) {
    jsonResponse(['error' => 'showtime_id is required'], 400);
}

$showtimeId = (int)$_GET['showtime_id'];

// Release any seat locks older than 10 minutes (expired checkout sessions)
$pdo->prepare(
    "UPDATE showtime_seats
     SET status = 'available', locked_at = NULL
     WHERE showtime_id = ? AND status = 'locked' AND locked_at < (NOW() - INTERVAL 10 MINUTE)"
)->execute([$showtimeId]);

$stmt = $pdo->prepare(
    'SELECT ss.id AS showtime_seat_id, se.seat_row, se.seat_number, se.seat_type, ss.status
     FROM showtime_seats ss
     JOIN seats se ON ss.seat_id = se.id
     WHERE ss.showtime_id = ?
     ORDER BY se.seat_row, se.seat_number'
);
$stmt->execute([$showtimeId]);
$seats = $stmt->fetchAll();

if (!$seats) {
    jsonResponse(['error' => 'Showtime not found or has no seat map'], 404);
}

jsonResponse(['showtime_id' => $showtimeId, 'seats' => $seats]);
