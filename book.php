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
        "SELECT ss.id, ss.status, se.seat_type,
                st.base_price, st.premium_price
         FROM showtime_seats ss
         JOIN seats se ON ss.seat_id = se.id
         JOIN showtimes st ON ss.showtime_id = st.id
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
        "UPDATE showtime_seats SET status = 'locked', locked_at = NOW()
         WHERE id IN ($placeholders)"
    )->execute($seatIds);

    // Calculate total
    $total = 0.0;
    foreach ($rows as $row) {
        $total += ($row['seat_type'] === 'standard') ? (float)$row['base_price'] : (float)$row['premium_price'];
    }

    $bookingRef = generateBookingRef($pdo);

    $pdo->prepare(
        'INSERT INTO bookings (booking_ref, user_id, showtime_id, total_amount, status)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([$bookingRef, $userId, $showtimeId, $total, 'pending']);

    $bookingId = (int)$pdo->lastInsertId();

    $insertSeat = $pdo->prepare(
        'INSERT INTO booking_seats (booking_id, showtime_seat_id, price) VALUES (?, ?, ?)'
    );
    foreach ($rows as $row) {
        $price = ($row['seat_type'] === 'standard') ? $row['base_price'] : $row['premium_price'];
        $insertSeat->execute([$bookingId, $row['id'], $price]);
    }

    $pdo->commit();

    jsonResponse([
        'booking_id'   => $bookingId,
        'booking_ref'  => $bookingRef,
        'total_amount' => $total,
        'status'       => 'pending',
        'expires_in_seconds' => 600,
    ], 201);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['error' => 'Booking failed', 'details' => $e->getMessage()], 500);
}
