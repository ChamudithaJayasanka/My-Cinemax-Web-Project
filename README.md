# CinemaMax — Backend & Database (PHP + MySQL)

This completes the remaining ~15% of the backend/database side of CinemaMax:
seat-locking booking logic, payment confirmation, and admin management —
built on top of your existing HTML/CSS/JS frontend.

## 1. Set up the database

1. Create the database and tables by importing the schema:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   This also seeds sample cinemas, halls, seats, movies and showtimes so you
   can test immediately.

2. **Important:** the seeded admin password hash in `schema.sql` is a
   placeholder. Generate a real one and update the `admins` table:
   ```php
   <?php echo password_hash('your_real_password', PASSWORD_DEFAULT);
   ```

## 2. Configure the connection

Edit `config/db.php` with your actual database host/user/password
(these differ between local XAMPP/WAMP and a live host).

## 3. Folder structure

```
cinemamax-backend/
├── database/
│   └── schema.sql          # full schema + seed data + reference queries
├── config/
│   └── db.php              # PDO connection
├── includes/
│   └── functions.php       # jsonResponse, booking ref generator, etc.
├── api/                    # public-facing endpoints (used by index.html/app.js)
│   ├── movies.php          # GET movie list / detail + its showtimes
│   ├── showtimes.php       # GET showtimes for a movie
│   ├── seats.php           # GET live seat map for a showtime
│   ├── book.php            # POST create a pending booking (locks seats)
│   └── payment.php         # POST confirm payment -> booking confirmed
└── admin/                  # admin-only endpoints
    ├── admin_auth.php      # POST admin login
    ├── movies_crud.php     # GET/POST/PUT/DELETE movies
    └── dashboard_stats.php # GET data for your Chart.js dashboard
```

## 4. Booking flow (how the pieces connect)

1. Frontend calls `api/movies.php` to list movies, then `api/showtimes.php`
   for a chosen movie/date.
2. User picks a showtime → frontend calls `api/seats.php?showtime_id=X` to
   render the live seat map (available/locked/booked).
3. User selects seats → frontend calls `api/book.php` with the seat IDs.
   This **locks** the seats for 10 minutes and returns a `booking_id` +
   `total_amount`.
4. User pays → frontend calls `api/payment.php` with the `booking_id`.
   This is where you plug in a real gateway (PayHere, Stripe, etc.) —
   the TODO comment marks exactly where. On success, the booking is
   marked `confirmed` and the seats are marked `booked` permanently.
5. If the user abandons checkout, `api/seats.php` automatically releases
   any seat locked for more than 10 minutes back to `available`.

## 5. Why seats won't double-book

`api/book.php` uses `SELECT ... FOR UPDATE` inside a transaction, so if
two users try to grab the same seat at the same time, the second request
sees the seat as `locked`/`booked` and fails cleanly with a 409 — instead
of both bookings succeeding.

## 6. Testing quickly with curl

```bash
# List now-showing movies
curl http://localhost/cinemamax-backend/api/movies.php

# Seat map for showtime 1
curl http://localhost/cinemamax-backend/api/seats.php?showtime_id=1

# Create a booking (seat IDs from the seat map response)
curl -X POST http://localhost/cinemamax-backend/api/book.php \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"showtime_id":1,"showtime_seat_ids":[1,2]}'

# Confirm payment
curl -X POST http://localhost/cinemamax-backend/api/payment.php \
  -H "Content-Type: application/json" \
  -d '{"booking_id":1,"payment_method":"card","transaction_id":"TXN123"}'
```

## 7. Still to plug in for production

- Real payment gateway call inside `api/payment.php`
- User registration/login endpoints (same `password_hash`/`password_verify`
  pattern as `admin_auth.php`)
- CORS headers if your frontend is served from a different origin
- Input validation/rate limiting on public endpoints
