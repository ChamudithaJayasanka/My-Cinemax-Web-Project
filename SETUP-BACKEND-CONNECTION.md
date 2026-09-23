# Connecting your backend to your frontend

## What's in this zip
- `cinemamax-backend/` — your uploaded backend, with two small patches:
  - `includes/functions.php` now sends CORS headers, so your frontend (opened
    from a different port, or as a local file) is allowed to call it.
  - `database/schema.sql` now seeds the admin account with a **real** password
    hash (the original placeholder `$2y$10$examplehashreplaceon setup` has a
    space in it and can never match any password). Login is:
    `username: admin` / `password: admin123`
- `frontend-addon/live-connect.js` — a new file that connects your existing
  `index.html` / `app.js` / `data.js` to the backend. It does **not** modify
  those files.

## 1. Set up the database
```bash
mysql -u root -p < cinemamax-backend/database/schema.sql
```
Edit `cinemamax-backend/config/db.php` with your real DB host/user/password.

## 2. Serve the backend
Put `cinemamax-backend/` inside your PHP server's web root (e.g. XAMPP's
`htdocs/`) so it's reachable at something like:
```
http://localhost/cinemamax-backend
```

## 3. Connect the frontend (one file, one line)
1. Copy `frontend-addon/live-connect.js` into the same folder as your
   `app.js` and `data.js`.
2. In `index.html`, add one line right after `app.js`:
   ```html
   <script src="app.js"></script>
   <script src="live-connect.js"></script>
   ```
3. Open `live-connect.js` and set `API_BASE` at the top to match step 2
   (e.g. `http://localhost/cinemamax-backend`).

That's it — reload the site.

## What's actually connected now
- A new **"🔴 Live Backend"** nav link appears automatically. It's a real
  booking flow — movies → showtimes → live seat map → reserve → pay — that
  reads and writes your actual MySQL tables (`bookings`, `showtime_seats`,
  `payments`, etc.).
- **Admin → Login**: authenticates against the real `admins` table
  (`admin` / `admin123`).
- **Admin → Movies**: list, add, edit, delete now hit
  `admin/movies_crud.php` — this is your real movie catalog in the database.
- **Admin → Dashboard**: the revenue chart now pulls real numbers from
  `admin/dashboard_stats.php` once at least one booking has been paid for
  through the Live Backend flow.

## Why the rest of the site still uses demo data
Your frontend's showcase catalog (Avatar, Interstellar, Dune, etc. — with
posters, trailers, cast, formats, popularity) and features like **offers,
the loyalty program, notifications, and watchlist** don't have matching
tables in `schema.sql` — the backend's `movies` table is deliberately
simpler (title, genre, language, duration, description, poster_url, status).
Rather than silently faking a merge between two different data models, this
connector keeps your polished demo exactly as it is for browsing/showcasing,
and adds a clearly-labelled **live** section that proves the full
book → lock seats → pay → confirm pipeline actually works against MySQL.

If you'd like, a next step would be to extend `schema.sql` with tables for
offers/loyalty/watchlist and reseed `movies` with your real catalog (posters,
cast, trailers) so the *entire* site — not just the Live section — runs on
the database. That's a bigger job (schema changes + a data migration), so
it's worth doing as its own step once you're happy with this connection.

## Known gaps (also called out in the backend's own README)
- No real payment gateway call yet — `api/payment.php` marks payment as
  successful immediately (there's a `TODO` comment marking exactly where a
  gateway like PayHere/Stripe would go).
- No customer registration/login endpoint yet — only admin login is real;
  customer "login" on the Live section just uses whichever demo user is
  currently active (or user id 1) to attach the booking to.
- `admin/movies_crud.php` isn't session-protected yet (anyone who can reach
  the URL can call it) — fine for local testing, not for a public deploy.
