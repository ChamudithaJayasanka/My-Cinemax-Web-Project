<?php
/**
 * Shared helper functions used across api/ endpoints.
 */

// --- CORS ---------------------------------------------------------------
// Every api/ and admin/ file requires this file first, so this runs before
// any other output — lets the frontend (served from a different origin,
// e.g. a Live Server port, or opened locally) call these endpoints.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
// -------------------------------------------------------------------------

function jsonResponse($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Generates a unique, human-friendly booking reference.
 * Format: CMX-YYYYMMDD-XXXX
 */
function generateBookingRef(PDO $pdo): string {
    do {
        $ref = 'CMX-' . date('Ymd') . '-' . str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare('SELECT id FROM bookings WHERE booking_ref = ?');
        $stmt->execute([$ref]);
    } while ($stmt->fetch());
    return $ref;
}

function requireFields(array $input, array $fields): void {
    foreach ($fields as $f) {
        if (!isset($input[$f]) || $input[$f] === '') {
            jsonResponse(['error' => "Missing required field: $f"], 400);
        }
    }
}
