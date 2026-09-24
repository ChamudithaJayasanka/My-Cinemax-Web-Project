/* ============================================================
   CINEMA MAX — Database Connector (cinemamax_full)
   ------------------------------------------------------------
   Loads the ENTIRE site from MySQL:
   1. Bootstraps everything from /api/site.php and hydrates
      APP_DATA (movies, cinemas+halls, showtimes, offers,
      notifications, watchlist, bookings, users).
   2. Real checkout: overrides processPayment so a booking is
      created via /api/book.php and confirmed via /api/payment.php
      (real rows in `bookings`, `booking_seats`, `payments`,
      seats locked/booked in `showtime_seats`).
   3. Real login against the `users` table (api/login.php, admin
      via admin/admin_auth.php).
   4. Real admin movie management + dashboard stats.
   If the backend is unreachable the app still runs on demo data.
   ============================================================ */

const API_BASE = 'http://localhost/cinemamax-backend';

const DB = { ok: false, showtimesIndex: [], movies: [], cinemas: [] };

(function injectDbStyles() {
    const css = `.live-error{color:#DC143C;background:rgba(220,20,60,.08);border:1px solid rgba(220,20,60,.2);border-radius:8px;padding:10px 14px;font-size:13px;margin:12px 0}
.live-success{color:#00C853;background:rgba(0,200,83,.08);border:1px solid rgba(0,200,83,.2);border-radius:8px;padding:10px 14px;font-size:13px;margin:12px 0}`;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
})();

const api = {
    async get(path) {
        const res = await fetch(API_BASE + path);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
        return data;
    },
    async send(method, path, body) {
        const res = await fetch(API_BASE + path, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
        return data;
    },
    post(path, body) { return this.send('POST', path, body); },
    put(path, body) { return this.send('PUT', path, body); },
    del(path) { return this.send('DELETE', path); }
};

/* ---------- helpers ---------- */
const splitCSV = v => (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);

function formatTime(t) {
    if (!t) return '';
    const [h, m] = String(t).slice(0, 5).split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    const hh = ((h + 11) % 12) + 1;
    return hh + ':' + String(m).padStart(2, '0') + ' ' + ap;
}

/* ---------- hydrate APP_DATA from the database ---------- */
function hydrate(data) {
    DB.movies = data.movies || [];
    DB.cinemas = data.cinemas || [];

    APP_DATA.movies = DB.movies.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        director: m.director || '',
        cast: splitCSV(m.cast),
        genre: splitCSV(m.genre),
        duration: Number(m.duration_min) || 0,
        rating: Number(m.rating) || 0,
        language: m.language || '',
        subtitles: splitCSV(m.subtitle),
        releaseDate: (m.release_date || '').slice(0, 10),
        status: m.status || 'now_showing',
        poster: m.poster_url || '',
        trailer: m.trailer_id || '',
        posterGradient: ['#2c3e50', '#e74c3c'],
        formats: splitCSV(m.format),
        basePrice: Number(m.base_price) || 1500,
        popularity: Number(m.popularity) || 0,
        featured: !!m.featured
    }));

    APP_DATA.cinemas = DB.cinemas.map(c => ({
        id: c.id,
        name: c.name,
        location: c.location,
        address: c.address || '',
        phone: c.phone || '',
        email: c.email || '',
        openingHours: c.opening_hours || '',
        image: c.image || '',
        features: splitCSV(c.features),
        halls: (data.halls || []).filter(h => h.cinema_id === c.id).map(h => ({
            id: h.id,
            name: h.name,
            type: h.hall_type || '',
            capacity: h.capacity,
            layout: h.layout || '',
            amenities: splitCSV(h.amenities),
            image: h.image || ''
        }))
    }));

    DB.showtimesIndex = (data.showtimes || []).map(s => ({
        showtime_id: s.showtime_id,
        movie_id: s.movie_id,
        cinema_id: s.cinema_id,
        hall_id: s.hall_id,
        show_date: s.show_date,
        show_time: s.show_time,
        time: formatTime(s.show_time),
        available: Number(s.available) || 0
    }));

    const st = {};
    DB.showtimesIndex.forEach(s => {
        (st[s.movie_id] = st[s.movie_id] || {});
        (st[s.movie_id][s.cinema_id] = st[s.movie_id][s.cinema_id] || {});
        (st[s.movie_id][s.cinema_id][s.hall_id] = st[s.movie_id][s.cinema_id][s.hall_id] || []);
        st[s.movie_id][s.cinema_id][s.hall_id].push({
            time: s.time, available: s.available, showtime_id: s.showtime_id, date: s.show_date
        });
    });
    APP_DATA.showtimes = st;

    APP_DATA.offers = (data.offers || []).map(o => ({
        id: o.id, title: o.title, description: o.description || '',
        discount: Number(o.discount) || 0, code: o.code || '',
        validFrom: o.valid_from, validTo: o.valid_to,
        type: o.offer_type, icon: o.icon || '', color: o.color || '#3498db'
    }));

    APP_DATA.notifications = (data.notifications || []).map(n => ({
        id: n.id, userId: n.user_id, title: n.title, message: n.message || '',
        time: n.time_label || '', read: !!n.is_read, type: n.type || 'info'
    }));

    APP_DATA.watchlist = (data.watchlist || []).filter(w => w.user_id === 1).map(w => w.movie_id);

    APP_DATA.bookings = (data.bookings || []).map(b => ({
        id: b.booking_ref, userId: b.user_id, movieId: b.movie_id,
        cinemaId: b.cinema_id, hallId: b.hall_id,
        showtime: formatTime(b.show_time), date: b.show_date,
        seats: splitCSV(b.seats_summary), seatTypes: [],
        ticketCount: Number(b.ticket_count) || 0,
        totalAmount: Number(b.total_amount) || 0,
        convenienceFee: Number(b.convenience_fee) || 0,
        status: b.status, bookingDate: (b.booking_date || '').slice(0, 10),
        paymentMethod: b.payment_method || '',
        bookingDateRaw: (b.booking_date || '').slice(0, 10),
        raw: b
    }));

    APP_DATA.users = (data.users || []).map(u => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone || '',
        role: u.role, password: '', avatar: u.avatar || (u.name ? u.name[0] : 'U')
    }));

    buildAdminStats();
}

/* Compute real dashboard numbers from the hydrated bookings */
function buildAdminStats() {
    const conf = APP_DATA.bookings.filter(b => b.status === 'confirmed');
    const flat = DB.showtimesIndex.reduce((s, x) => s + x.available, 0);
    const stats = APP_DATA.adminStats;

    stats.todayRevenue = conf.reduce((s, b) => s + Number(b.totalAmount), 0);
    stats.todayBookings = conf.length;
    stats.availableSeats = flat || stats.availableSeats;
    stats.activeMovies = APP_DATA.movies.filter(m => m.status === 'now_showing').length;

    const rev = {};   const counts = {};
    conf.forEach(b => {
        const k = b.bookingDateRaw;
        rev[k] = (rev[k] || 0) + Number(b.totalAmount);
        counts[k] = (counts[k] || 0) + 1;
    });
    const weeklyRevenue = []; const dailySales = [];
    for (let d = 6; d >= 0; d--) {
        const day = new Date(); day.setDate(day.getDate() - d);
        const key = day.toISOString().slice(0, 10);
        weeklyRevenue.push(rev[key] || 0);
        dailySales.push(counts[key] || 0);
    }
    stats.weeklyRevenue = weeklyRevenue;
    stats.dailySales = dailySales;

    const perMovie = {};
    conf.forEach(b => { perMovie[b.movieId] = (perMovie[b.movieId] || 0) + (Number(b.totalAmount) || 0); });
    stats.moviePopularity = APP_DATA.movies
        .map(m => ({ name: m.title, tickets: perMovie[m.id] || 0 }))
        .filter(m => m.tickets > 0)
        .sort((a, b) => b.tickets - a.tickets)
        .slice(0, 5);

    const perCinema = {};
    conf.forEach(b => {
        const c = getCinemaById(b.cinemaId);
        if (!c) return;
        perCinema[c.id] = perCinema[c.id] || { revenue: 0, bookings: 0 };
        perCinema[c.id].revenue += Number(b.totalAmount);
        perCinema[c.id].bookings += 1;
    });
    stats.cinemaPerformance = APP_DATA.cinemas.map(c => ({
        name: c.name.replace('CINEPLEX ', '').replace('CINEPLEX', ''),
        revenue: perCinema[c.id] ? perCinema[c.id].revenue : 0,
        bookings: perCinema[c.id] ? perCinema[c.id].bookings : 0
    }));
}

/* ---------- bootstrap ---------- */
async function connectToDatabase() {
    try {
        const data = await api.get('/api/site.php');
        hydrate(data);
        DB.ok = true;

        // Re-point the current user at the DB version
        const saved = localStorage.getItem('cinemax-session');
        let uid = 1;
        try { uid = JSON.parse(saved).id || 1; } catch (e) {}
        App.currentUser = APP_DATA.users.find(u => u.id === uid) || APP_DATA.users[0];

        if (typeof updateNavUser === 'function') updateNavUser();
        if (typeof renderNotifications === 'function') renderNotifications();
        if (typeof handleRoute === 'function') handleRoute();

        showLiveChip('green', 'MySQL connected — cinemamax_full');
    } catch (e) {
        DB.ok = false;
        showLiveChip('red', 'Demo data (backend offline)');
    }
}

function showLiveChip(color, label) {
    const id = 'dbChip';
    let chip = document.getElementById(id);
    const colors = { green: '#00C853', red: '#DC143C' };
    if (!chip) {
        chip = document.createElement('div');
        chip.id = id;
        chip.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;align-items:center;gap:7px;background:#0E1219;border:1px solid var(--border,#2A2F3A);padding:7px 12px;border-radius:999px;font-size:12px;color:var(--text-secondary,#8E8E9A);box-shadow:0 8px 24px rgba(0,0,0,.35);cursor:default';
        chip.innerHTML = '<span id="dbDot" style="width:9px;height:9px;border-radius:50%"></span><span id="dbLabel"></span>';
        document.body.appendChild(chip);
    }
    document.getElementById('dbDot').style.background = colors[color];
    document.getElementById('dbLabel').textContent = label;
}

/* ============================================================
   REAL CHECKOUT  (book -> lock seats -> pay -> confirm)
   ============================================================ */
const __originalProcessPayment = window.processPayment;
window.processPayment = async function (btn) {
    if (!DB.ok) return __originalProcessPayment(btn);
    if (!btn) btn = document.querySelector('.btn-primary');
    btn.innerHTML = '⏳ Contacting database…';
    btn.disabled = true;

    try {
        if (!App.selectedMovie) throw new Error('No movie selected.');

        // 1) Find the matching database showtime
        const wantTime = App.selectedShowtime ? App.selectedShowtime.time : '';
        const st = DB.showtimesIndex.find(s =>
            s.movie_id === App.selectedMovie.id &&
            s.cinema_id === App.selectedCinema &&
            s.hall_id === App.selectedHall &&
            (!wantTime || s.time === wantTime)
        );
        if (!st) throw new Error('This showtime is not in the database (movie/multi-cinema schedules are DB-driven).');

        // 2) Load the live seat map and map "D4" -> showtime_seat id
        const seatData = await api.get('/api/seats.php?showtime_id=' + st.showtime_id);
        const byLabel = new Map();
        seatData.seats.forEach(ss => byLabel.set(ss.seat_row + String(ss.seat_number), ss));

        const ids = App.selectedSeats.map(sel => {
            const ss = byLabel.get(sel.id);
            if (!ss) throw new Error('Seat ' + sel.id + ' is not on the seat map.');
            if (ss.status !== 'available') throw new Error('Seat ' + sel.id + ' is ' + ss.status + ' — please pick another.');
            return ss.showtime_seat_id;
        });
        if (!ids.length) throw new Error('No seats selected.');

        // 3) Create the booking (locks seats in the DB)
        const userId = (App.currentUser && App.currentUser.id) || 1;
        const booking = await api.post('/api/book.php', {
            user_id: userId,
            showtime_id: st.showtime_id,
            showtime_seat_ids: ids
        });

        // 4) Confirm payment (marks seats permanently booked)
        await api.post('/api/payment.php', {
            booking_id: booking.booking_id,
            payment_method: 'card',
            transaction_id: 'WEB-' + Date.now()
        });

        // 5) Show the digital ticket using the DB booking
        const prices = APP_DATA.seatLayout.prices;
        let subtotal = 0;
        App.selectedSeats.forEach(s => subtotal += prices[s.type] || 1500);
        const convenience = 200;
        const demo = {
            id: booking.booking_ref,
            movieId: App.selectedMovie.id,
            cinemaId: App.selectedCinema,
            hallId: App.selectedHall,
            userId: userId,
            showtime: wantTime,
            date: App.selectedDate ? App.selectedDate.dayNum + ' ' + App.selectedDate.month + ' 2026' : '',
            seats: App.selectedSeats.map(s => s.id),
            seatTypes: App.selectedSeats.map(s => s.type),
            ticketCount: App.selectedSeats.length,
            totalAmount: Number(booking.total_amount) + convenience,
            convenienceFee: convenience,
            paymentMethod: 'card',
            bookingDate: new Date().toISOString(),
            status: 'confirmed'
        };
        APP_DATA.bookings.unshift(demo);
        App.latestBooking = demo;
        App.bookingStep = 1;
        navigate('ticket');
    } catch (e) {
        alert('Database booking failed:\n' + e.message);
        btn.innerHTML = '💳 Pay Now';
        btn.disabled = false;
    }
};

/* ============================================================
   REAL LOGIN  (users table with bcrypt)
   ============================================================ */
const __originalHandleLogin = window.handleLogin;
window.handleLogin = async function (role) {
    if (!DB.ok) return __originalHandleLogin(role);

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        const res = await api.post('/api/login.php', { identifier: email, password });
        const u = res.user;
        const expectedRole = role || 'user';
        if (u.role !== expectedRole) {
            throw new Error(expectedRole === 'admin'
                ? 'This account is not an admin. Use the User Login tab.'
                : 'This is an admin account. Use the Admin Login tab.');
        }
        App.currentUser = APP_DATA.users.find(x => x.id === u.id) || {
            id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, password: '', avatar: u.avatar
        };
        localStorage.setItem('cinemax-session', JSON.stringify({ id: u.id }));
        updateNavUser();
        if (u.role === 'admin') navigate('admin'); else navigate('dashboard');
    } catch (e) {
        if (errorEl) errorEl.textContent = '⚠️ ' + e.message;
    }
};

/* ============================================================
   REAL ADMIN MOVIE MANAGEMENT
   ============================================================ */
window.renderAdminMoviesSection = function () {
    loadLiveAdminMovies();
    return `
        <div class="admin-toolbar">
            <div><span class="admin-count" id="liveAdminMovieCount">Loading from database…</span></div>
            <button class="btn btn-primary" onclick="openMovieForm()">➕ Add Movie</button>
        </div>
        <div class="admin-table-wrap"><table class="admin-table">
            <thead><tr><th>ID</th><th>Title</th><th>Genre</th><th>Language</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="liveAdminMovieRows"><tr><td colspan="6" style="text-align:center;padding:30px">Loading…</td></tr></tbody>
        </table></div>`;
};

window.loadLiveAdminMovies = async function () {
    try {
        const movies = await api.get('/admin/movies_crud.php');
        DB.movies = movies;
        const countEl = document.getElementById('liveAdminMovieCount');
        if (countEl) countEl.textContent = `${movies.length} movies (from database)`;
        const rowsEl = document.getElementById('liveAdminMovieRows');
        if (rowsEl) rowsEl.innerHTML = movies.map(m => `
            <tr>
                <td>${m.id}</td><td>${m.title}</td><td>${m.genre || '—'}</td><td>${m.language || '—'}</td>
                <td><span class="booking-status ${m.status}">${(m.status || '').replace('_', ' ')}</span></td>
                <td class="admin-actions">
                    <button class="btn btn-sm admin-edit-btn" onclick="openMovieForm(${m.id})">✏️ Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMovie(${m.id})">🗑️</button>
                </td>
            </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px">No movies yet</td></tr>';
    } catch (e) {
        const rowsEl = document.getElementById('liveAdminMovieRows');
        if (rowsEl) rowsEl.innerHTML = `<tr><td colspan="6"><div class="live-error">${e.message}</div></td></tr>`;
    }
};

window.openMovieForm = function (id) {
    const m = id ? (DB.movies.find(x => x.id === id) || APP_DATA.movies.find(x => x.id === id)) : null;
    openModal(`
        <div class="admin-form">
            <h2>${m ? '✏️ Edit Movie' : '➕ Add Movie'}</h2>
            <div class="form-row">
                <div class="form-group"><label>Title</label><input class="form-input" id="mvTitle" value="${m ? m.title : ''}"></div>
                <div class="form-group"><label>Genre (comma separated)</label><input class="form-input" id="mvGenre" value="${m ? (m.genre || '') : ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Language</label><input class="form-input" id="mvLang" value="${m ? (m.language || '') : ''}"></div>
                <div class="form-group"><label>Duration (min)</label><input class="form-input" type="number" id="mvDuration" value="${m ? m.duration_min : 120}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Director</label><input class="form-input" id="mvDirector" value="${m ? (m.director || '') : ''}"></div>
                <div class="form-group"><label>Rating (0-10)</label><input class="form-input" type="number" step="0.1" id="mvRating" value="${m ? m.rating : ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Status</label><select class="form-input" id="mvStatus">
                    <option value="now_showing" ${m && m.status === 'now_showing' ? 'selected' : ''}>Now Showing</option>
                    <option value="coming_soon" ${m && m.status === 'coming_soon' ? 'selected' : ''}>Coming Soon</option>
                </select></div>
                <div class="form-group"><label>Release Date</label><input class="form-input" type="date" id="mvDate" value="${m ? (m.release_date || '') : ''}"></div>
            </div>
            <div class="form-group"><label>Poster URL</label><input class="form-input" id="mvPoster" value="${m ? (m.poster_url || '') : ''}"></div>
            <div class="form-group"><label>Base Price (LKR)</label><input class="form-input" type="number" id="mvPrice" value="${m ? m.base_price : 1500}"></div>
            <div class="form-group"><label>Description</label><textarea class="form-input" id="mvDesc" rows="3">${m ? (m.description || '') : ''}</textarea></div>
            <div class="admin-form-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveMovie(${m ? m.id : 'null'})">${m ? 'Save Changes' : 'Add Movie'}</button>
            </div>
        </div>`);
};

window.saveMovie = async function (id) {
    const val = elId => document.getElementById(elId).value.trim();
    const body = {
        title: val('mvTitle'), genre: val('mvGenre'), language: val('mvLang'),
        duration_min: parseInt(val('mvDuration')) || 120,
        director: val('mvDirector') || null,
        rating: val('mvRating') ? parseFloat(val('mvRating')) : null,
        status: document.getElementById('mvStatus').value,
        release_date: val('mvDate') || null,
        poster_url: val('mvPoster') || null,
        base_price: parseInt(val('mvPrice')) || null,
        description: val('mvDesc') || null
    };
    if (!body.title) { alert('Please enter a movie title'); return; }
    try {
        if (id) await api.put('/admin/movies_crud.php?id=' + id, body);
        else await api.post('/admin/movies_crud.php', body);
        closeModal();
        renderAdminSection('movies');
    } catch (e) { alert('Save failed: ' + e.message); }
};

window.deleteMovie = async function (id) {
    if (!confirm('Delete this movie from the database? This cannot be undone.')) return;
    try {
        await api.del('/admin/movies_crud.php?id=' + id);
        renderAdminSection('movies');
    } catch (e) { alert('Delete failed: ' + e.message); }
};

/* ============================================================
   REAL DASHBOARD STATS  (Chart.js overlays live DB numbers)
   ============================================================ */
const __originalRenderCharts = window.renderCharts;
window.renderCharts = function () {
    __originalRenderCharts();
    if (!DB.ok) return;
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    connectToDatabase();
});