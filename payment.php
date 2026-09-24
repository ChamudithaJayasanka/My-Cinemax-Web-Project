<?php
/**
 * POST /api/payment.php
 * Body: {
 *   "booking_id": 5,
 *   "payment_method": "card",
 *   "transaction_id": "PROVIDER-TXN-12345"
 * }
 *
 * Confirms payment for a pending booking:
 *  - marks the payment as successful
 *  - marks the booking as confirmed
 *  - marks the seats as permanently booked
 * All in one transaction so nothing is left half-updated.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/functions.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
requireFields($input, ['booking_id', 'payment_method']);

$bookingId     = (int)$input['booking_id'];
$paymentMethod = $input['payment_method'];
$transactionId = $input['transaction_id'] ?? null;

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT * FROM bookings WHERE id = ? FOR UPDATE');
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Booking not found'], 404);
    }

    if ($booking['status'] !== 'pending') {
        $pdo->rollBack();
        jsonResponse(['error' => 'Booking is not awaiting payment (status: ' . $booking['status'] . ')'], 409);
    }

    // --- In production: call your real payment gateway here (Stripe/PayHere/etc.)
    // and only proceed past this line once the gateway confirms success. ---

    $pdo->prepare(
        'INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status, paid_at)
         VALUES (?, ?, ?, ?, "success", NOW())'
    )->execute([$bookingId, $booking['total_amount'], $paymentMethod, $transactionId]);

    $pdo->prepare('UPDATE bookings SET status = "confirmed" WHERE id = ?')->execute([$bookingId]);

    $pdo->prepare(
        "UPDATE showtime_seats ss
         JOIN booking_seats bs ON bs.showtime_seat_id = ss.id
         SET ss.status = 'booked', ss.locked_until = NULL
         WHERE bs.booking_id = ?"
    )->execute([$bookingId]);

    $pdo->commit();

    jsonResponse([
        'booking_id'  => $bookingId,
        'booking_ref' => $booking['booking_ref'],
        'status'      => 'confirmed',
        'message'     => 'Payment successful, booking confirmed.',
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['error' => 'Payment processing failed', 'details' => $e->getMessage()], 500);
}
