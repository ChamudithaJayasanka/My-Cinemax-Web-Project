<?php
/**
 * POST /admin/admin_auth.php
 * Body: { "username": "admin", "password": "..." }
 *
 * In cinemamax_full there is a single `users` table with a role column
 * ('admin' | 'user'); we look up the admin by email or name.
 *
 * On success, starts a PHP session so protected admin endpoints
 * can check $_SESSION['admin_id'].
 */

session_start();
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
requireFields($input, ['username', 'password']);

$stmt = $pdo->prepare('SELECT * FROM users WHERE (email = ? OR name = ?) AND role = "admin" LIMIT 1');
$stmt->execute([$input['username'], $input['username']]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($input['password'], $admin['password_hash'])) {
    jsonResponse(['error' => 'Invalid username or password'], 401);
}

$_SESSION['admin_id']   = $admin['id'];
$_SESSION['admin_role'] = $admin['role'];

jsonResponse(['message' => 'Login successful', 'role' => $admin['role'], 'user' => [
    'id' => $admin['id'], 'name' => $admin['name'], 'email' => $admin['email'],
    'phone' => $admin['phone'], 'role' => $admin['role'], 'avatar' => $admin['avatar'],
]]);