<?php
/**
 * GET /api/movies.php               -> list now-showing movies
 * GET /api/movies.php?id=3          -> single movie detail + its showtimes
 * GET /api/movies.php?status=upcoming
 *
 * Works against the cinemamax_full schema: genres come from the
 * movies_genres join table, showtimes have no column pricing (price is
 * per seat type in seat_pricing).
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

/** Attach genre/format/subtitle/cast as comma-joined strings */
function enrichMovie(PDO $pdo, array $movie): array {
    foreach (['movies_genres' => 'genre', 'movies_subtitles' => 'subtitle', 'movies_formats' => 'format', 'movies_cast' => 'cast'] as $table => $col) {
        $stmt = $pdo->prepare("SELECT $col FROM $table WHERE movie_id = ?");
        $stmt->execute([$movie['id']]);
        $movie[$col] = implode(', ', array_column($stmt->fetchAll(), $col));
    }
    return $movie;
}

if (isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT * FROM movies WHERE id = ?');
    $stmt->execute([(int)$_GET['id']]);
    $movie = $stmt->fetch();

    if (!$movie) {
        jsonResponse(['error' => 'Movie not found'], 404);
    }
    $movie = enrichMovie($pdo, $movie);

    $stmt2 = $pdo->prepare(
        'SELECT s.id, s.show_date, s.show_time,
                h.name AS hall_name, h.hall_type AS hall_type,
                c.name AS cinema_name, c.location AS city
         FROM showtimes s
         JOIN halls h   ON s.hall_id = h.id
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
$rows = $stmt->fetchAll();
foreach ($rows as &$row) {
    $row = enrichMovie($pdo, $row);
}
jsonResponse($rows);