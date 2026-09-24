<?php
/**
 * API login for customers AND admins (cinemamax_full.users table).
 * POST /api/login.php
 * Body: { "identifier": "email or name", "password": "..." }
 * On success returns the user (never the password hash) + role.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
requireFields($input, ['identifier', 'password']);

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? OR name = ? LIMIT 1');
$stmt->execute([$input['identifier'], $input['identifier']]);
$user = $stmt->fetch();

if (!$user || !password_verify($input['password'], $user['password_hash'])) {
    jsonResponse(['error' => 'Invalid credentials'], 401);
}

jsonResponse([
    'message' => 'Login successful',
    'user' => [
        'id'     => (int)$user['id'],
        'name'   => $user['name'],
        'email'  => $user['email'],
        'phone'  => $user['phone'],
        'role'   => $user['role'],
        'avatar' => $user['avatar'],
    ],
]);