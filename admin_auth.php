<?php
/**
 * POST /admin/admin_auth.php
 * Body: { "username": "admin", "password": "..." }
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

$stmt = $pdo->prepare('SELECT * FROM admins WHERE username = ?');
$stmt->execute([$input['username']]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($input['password'], $admin['password_hash'])) {
    jsonResponse(['error' => 'Invalid username or password'], 401);
}

$_SESSION['admin_id']   = $admin['id'];
$_SESSION['admin_role'] = $admin['role'];

jsonResponse(['message' => 'Login successful', 'role' => $admin['role']]);

/**
 * Reusable guard — include this at the top of any admin-only endpoint:
 *
 *   session_start();
 *   if (empty($_SESSION['admin_id'])) {
 *       jsonResponse(['error' => 'Unauthorized'], 401);
 *   }
 */
