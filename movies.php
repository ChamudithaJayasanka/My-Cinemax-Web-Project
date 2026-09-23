<?php
/**
 * GET /api/movies.php               -> list all now-showing movies
 * GET /api/movies.php?id=3          -> single movie detail
 * GET /api/movies.php?status=upcoming
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

if (isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT * FROM movies WHERE id = ?');
    $stmt->execute([(int)$_GET['id']]);
    $movie = $stmt->fetch();

    if (!$movie) {
        jsonResponse(['error' => 'Movie not found'], 404);
    }

    // Attach available showtimes
    $stmt2 = $pdo->prepare(
        'SELECT s.id, s.show_date, s.show_time, s.base_price, s.premium_price,
                h.name AS hall_name, c.name AS cinema_name, c.city
         FROM showtimes s
         JOIN halls h ON s.hall_id = h.id
         JOIN cinemas c ON h.cinema_id = c.id
         WHERE s.movie_id = ? AND s.show_date >= CURDATE()
         ORDER BY s.show_date, s.show_time'
    );
    $stmt2->execute([$movie['id']]);
    $movie['showtimes'] = $stmt2->fetchAll();

    jsonResponse($movie);
}

$status = $_GET['status'] ?? 'now_showing';
$stmt = $pdo->prepare('SELECT * FROM movies WHERE status = ? ORDER BY release_date DESC');
$stmt->execute([$status]);
jsonResponse($stmt->fetchAll());
