<?php
/**
 * POST /api/book.php
 * Body: {
 *   "user_id": 1,
 *   "showtime_id": 1,
 *   "showtime_seat_ids": [12, 13, 14]
 * }
 *
 * Locks the requested seats and creates a "pending" booking.
 * The booking must then be confirmed via payment.php within 10 minutes,
 * or seats.php will automatically release the lock.
 *
 * Pricing uses the cinemamax_full seat_pricing table (per seat type).
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
requireFields($input, ['user_id', 'showtime_id', 'showtime_seat_ids']);

$userId       = (int)$input['user_id'];
$showtimeId   = (int)$input['showtime_id'];
$seatIds      = array_map('intval', $input['showtime_seat_ids']);

if (empty($seatIds)) {
    jsonResponse(['error' => 'At least one seat must be selected'], 400);
}

try {
    $pdo->beginTransaction();

    // Lock the rows we're about to book so concurrent requests can't grab the same seats
    $placeholders = implode(',', array_fill(0, count($seatIds), '?'));
    $stmt = $pdo->prepare(
        "SELECT ss.id, ss.status, se.seat_row, se.seat_number, se.seat_type, sp.price
         FROM showtime_seats ss
         JOIN seats se ON ss.seat_id = se.id
         JOIN seat_pricing sp ON sp.seat_type = se.seat_type
         WHERE ss.id IN ($placeholders) AND ss.showtime_id = ?
         FOR UPDATE"
    );
    $stmt->execute([...$seatIds, $showtimeId]);
    $rows = $stmt->fetchAll();

    if (count($rows) !== count($seatIds)) {
        $pdo->rollBack();
        jsonResponse(['error' => 'One or more seats are invalid for this showtime'], 400);
    }

    foreach ($rows as $row) {
        if ($row['status'] !== 'available') {
            $pdo->rollBack();
            jsonResponse(['error' => 'One or more selected seats are no longer available'], 409);
        }
    }

    // Lock the seats
    $pdo->prepare(
        "UPDATE showtime_seats SET status = 'locked', locked_until = (NOW() + INTERVAL 10 MINUTE)
         WHERE id IN ($placeholders)"
    )->execute($seatIds);

    // Calculate total (sum of per-seat prices from seat_pricing)
    $total = 0.0;
    $labels = [];
    foreach ($rows as $row) {
        $total += (float)$row['price'];
        $labels[] = $row['seat_row'] . $row['seat_number'];
    }

    $bookingRef = generateBookingRef($pdo);

    $pdo->prepare(
        'INSERT INTO bookings (booking_ref, user_id, showtime_id, seats_summary, ticket_count, total_amount, convenience_fee, status, booking_date)
         VALUES (?, ?, ?, ?, ?, ?, 200, ?, CURDATE())'
    )->execute([$bookingRef, $userId, $showtimeId, implode(', ', $labels), count($rows), $total, 'pending']);

    $bookingId = (int)$pdo->lastInsertId();

    $insertSeat = $pdo->prepare(
        'INSERT INTO booking_seats (booking_id, showtime_seat_id, seat_type, price) VALUES (?, ?, ?, ?)'
    );
    foreach ($rows as $row) {
        $insertSeat->execute([$bookingId, $row['id'], $row['seat_type'], $row['price']]);
    }

    $pdo->commit();

    jsonResponse([
        'booking_id'   => $bookingId,
        'booking_ref'  => $bookingRef,
        'total_amount' => $total,
        'convenience_fee' => 200,
        'status'       => 'pending',
        'expires_in_seconds' => 600,
    ], 201);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['error' => 'Booking failed', 'details' => $e->getMessage()], 500);
}