<?php
/**
 * Database connection (PDO, MySQL)
 * Edit the constants below to match your hosting environment.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'cinemamax_full');  // full cinema system database
define('DB_USER', 'root');       // change for production
define('DB_PASS', '');           // change for production

function getDBConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE  => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES    => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed']));
        }
    }
    return $pdo;
}