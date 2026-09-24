<?php
/**
 * Admin-only movie management (cinemamax_full schema).
 * GET    /admin/movies_crud.php            -> list all movies (genre aggregated)
 * POST   /admin/movies_crud.php            -> create a movie (+ genres)
 * PUT    /admin/movies_crud.php?id=3       -> update a movie (+ replace genres)
 * DELETE /admin/movies_crud.php?id=3       -> delete a movie
 *
 * NOTE: wrap this file with your real admin-session check
 * (see admin_auth.php pattern) before using in production.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

/** "Action, Sci-Fi" -> rows in movies_genres */
function setGenres(PDO $pdo, int $movieId, ?string $genres): void {
    if ($genres === null || trim($genres) === '') return;
    $pdo->prepare('DELETE FROM movies_genres WHERE movie_id = ?')->execute([$movieId]);
    $stmt = $pdo->prepare('INSERT INTO movies_genres (movie_id, genre) VALUES (?, ?)');
    foreach (array_filter(array_map('trim', explode(',', $genres))) as $g) {
        $stmt->execute([$movieId, $g]);
    }
}

switch ($method) {

    case 'GET':
        $rows = $pdo->query(
            "SELECT m.*,
                    (SELECT GROUP_CONCAT(g.genre ORDER BY g.genre SEPARATOR ', ') FROM movies_genres g WHERE g.movie_id = m.id) AS genre
             FROM movies m ORDER BY m.created_at DESC"
        )->fetchAll();
        jsonResponse($rows);
        break;

    case 'POST':
        $input = getJsonInput();
        requireFields($input, ['title', 'duration_min']);

        $stmt = $pdo->prepare(
            'INSERT INTO movies (title, director, duration_min, rating, language, release_date, status, description, poster_url, trailer_id, base_price, popularity, featured)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['title'],
            $input['director'] ?? null,
            (int)$input['duration_min'],
            $input['rating'] ?? null,
            $input['language'] ?? null,
            $input['release_date'] ?? null,
            $input['status'] ?? 'now_showing',
            $input['description'] ?? null,
            $input['poster_url'] ?? null,
            $input['trailer_id'] ?? null,
            $input['base_price'] ?? null,
            $input['popularity'] ?? 0,
            !empty($input['featured']) ? 1 : 0,
        ]);
        $id = (int)$pdo->lastInsertId();
        setGenres($pdo, $id, $input['genre'] ?? null);

        jsonResponse(['id' => $id, 'message' => 'Movie created'], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'id is required'], 400);
        }
        $id = (int)$_GET['id'];
        $input = getJsonInput();

        $fields = [];
        $params = [];
        foreach (['title','director','duration_min','rating','language','release_date','status','description','poster_url','trailer_id','base_price','popularity'] as $col) {
            if (array_key_exists($col, $input)) {
                $fields[] = "$col = ?";
                $params[] = $input[$col];
            }
        }
        if (array_key_exists('featured', $input)) {
            $fields[] = 'featured = ?';
            $params[] = !empty($input['featured']) ? 1 : 0;
        }
        if (empty($fields) && !array_key_exists('genre', $input)) {
            jsonResponse(['error' => 'No fields to update'], 400);
        }
        if (!empty($fields)) {
            $params[] = $id;
            $pdo->prepare('UPDATE movies SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        }
        setGenres($pdo, $id, $input['genre'] ?? null);

        jsonResponse(['message' => 'Movie updated']);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'id is required'], 400);
        }
        $pdo->prepare('DELETE FROM movies WHERE id = ?')->execute([(int)$_GET['id']]);
        jsonResponse(['message' => 'Movie deleted']);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}