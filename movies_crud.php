<?php
/**
 * Admin-only movie management.
 * GET    /admin/movies_crud.php            -> list all movies
 * POST   /admin/movies_crud.php            -> create a movie
 * PUT    /admin/movies_crud.php?id=3       -> update a movie
 * DELETE /admin/movies_crud.php?id=3       -> delete a movie
 *
 * NOTE: wrap this file with your real admin-session check
 * (see admin_auth.php pattern) before using in production.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $stmt = $pdo->query('SELECT * FROM movies ORDER BY created_at DESC');
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $input = getJsonInput();
        requireFields($input, ['title', 'duration_min']);

        $stmt = $pdo->prepare(
            'INSERT INTO movies (title, genre, language, duration_min, description, poster_url, release_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['title'],
            $input['genre'] ?? null,
            $input['language'] ?? null,
            (int)$input['duration_min'],
            $input['description'] ?? null,
            $input['poster_url'] ?? null,
            $input['release_date'] ?? null,
            $input['status'] ?? 'now_showing',
        ]);

        jsonResponse(['id' => (int)$pdo->lastInsertId(), 'message' => 'Movie created'], 201);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'id is required'], 400);
        }
        $id = (int)$_GET['id'];
        $input = getJsonInput();

        $fields = [];
        $params = [];
        foreach (['title','genre','language','duration_min','description','poster_url','release_date','status'] as $col) {
            if (isset($input[$col])) {
                $fields[] = "$col = ?";
                $params[] = $input[$col];
            }
        }
        if (empty($fields)) {
            jsonResponse(['error' => 'No fields to update'], 400);
        }
        $params[] = $id;

        $stmt = $pdo->prepare('UPDATE movies SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);

        jsonResponse(['message' => 'Movie updated']);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'id is required'], 400);
        }
        $stmt = $pdo->prepare('DELETE FROM movies WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        jsonResponse(['message' => 'Movie deleted']);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
