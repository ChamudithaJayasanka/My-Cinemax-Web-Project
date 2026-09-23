/* ============================================================
   CINEMA MAX — Live Backend Connector
   ------------------------------------------------------------
   Drop this file next to app.js and add ONE line to index.html,
   right after app.js:

       <script src="app.js"></script>
       <script src="live-connect.js"></script>   <-- add this

   Nothing else needs to change. This file does not touch your
   existing app.js / data.js — it adds a new "Live Backend Demo"
   page and swaps a handful of Admin functions (login, movie CRUD,
   revenue chart) to call the real API instead of the in-memory
   APP_DATA. Your existing demo catalog, offers, loyalty, watchlist
   etc. keep working exactly as before — the PHP schema doesn't
   model those yet, so they stay frontend-only for now.
   ============================================================ */

// 1) EDIT THIS to match where you're serving cinemamax-backend/ from.
//    e.g. XAMPP default:  'http://localhost/cinemamax-backend'
const API_BASE = 'http://localhost/cinemamax-backend';

/* ---------- tiny fetch wrapper ---------- */
const LiveAPI = {
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

const Live = {
    movies: [],
    selectedMovie: null,
    selectedShowtimeId: null,
    seatMap: [],
    selectedSeats: [],
    booking: null,
    adminMovies: []
};

/* ---------- styles (scoped, reuses your existing CSS variables) ---------- */
(function injectLiveStyles() {
    const css = `
    .live-wrap { max-width:1100px;margin:0 auto;padding:40px 48px; }
    .live-banner { background: linear-gradient(135deg, rgba(0,200,83,0.12), rgba(0,200,83,0.02)); border:1px solid rgba(0,200,83,0.3); border-radius:var(--radius-lg); padding:16px 20px; margin-bottom:24px; font-size:14px; }
    .live-banner strong { color: var(--green); }
    .live-movie-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }
    .live-movie-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:18px; cursor:pointer; transition:var(--transition); }
    .live-movie-card:hover { border-color:var(--accent); transform:translateY(-3px); }
    .live-showtime-row { display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:14px 18px; margin-bottom:10px; flex-wrap:wrap; gap:10px; }
    .live-seat-grid { display:flex; flex-direction:column; gap:6px; align-items:center; margin:24px 0; }
    .live-seat-row { display:flex; gap:6px; }
    .live-seat { width:34px;height:34px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;cursor:pointer;border:2px solid var(--border); background:var(--bg-input); color:var(--text-secondary); }
    .live-seat.premium { border-color: var(--gold); }
    .live-seat.vip { border-color: var(--purple); }
    .live-seat.locked, .live-seat.booked { background:var(--text-muted); opacity:.5; cursor:not-allowed; }
    .live-seat.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
    .live-error { color: var(--accent); background: rgba(220,20,60,0.08); border:1px solid rgba(220,20,60,0.2); border-radius:8px; padding:10px 14px; font-size:13px; margin:12px 0; }
    .live-success { color: var(--green); background: rgba(0,200,83,0.08); border:1px solid rgba(0,200,83,0.2); border-radius:8px; padding:10px 14px; font-size:13px; margin:12px 0; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
})();

/* ---------- add a nav link (no index.html edit needed) ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !navLinks.querySelector('[data-page="live"]')) {
        const a = document.createElement('a');
        a.href = '#live';
        a.className = 'nav-link';
        a.dataset.page = 'live';
        a.textContent = '🔴 Live Backend';
        navLinks.appendChild(a);
    }
});

/* ---------- routing: wrap handleRoute instead of editing app.js ---------- */
const __originalHandleRoute = window.handleRoute;
window.handleRoute = function () {
    const hash = window.location.hash.slice(1) || 'home';
    if (hash === 'live' || hash.startsWith('live/')) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === 'live'));
        if (typeof clearAppIntervals === 'function') clearAppIntervals();
        const parts = hash.split('/');
        if (parts[1] === 'showtimes') renderLiveShowtimes(parseInt(parts[2]));
        else if (parts[1] === 'seats') renderLiveSeats(parseInt(parts[2]));
        else if (parts[1] === 'confirm') renderLiveConfirm();
        else renderLiveHome();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof closeAllPanels === 'function') closeAllPanels();
        return;
    }
    return __originalHandleRoute();
};

/* ---------- LIVE customer pages: movies -> showtimes -> seats -> book -> pay ---------- */

async function renderLiveHome() {
    document.getElementById('mainFooter').style.display = '';
    document.getElementById('app').innerHTML = `
        <div class="live-wrap">
            <div class="live-banner">🔴 <strong>Live Backend Demo</strong> — this section talks directly to your PHP + MySQL API at <code>${API_BASE}</code>. Every booking here is real: real seat locking, real rows in your database.</div>
            <h2 class="section-title" style="margin-bottom:20px">Movies in the database</h2>
            <div id="liveMovieList">Loading…</div>
        </div>`;
    try {
        const movies = await LiveAPI.get('/api/movies.php');
        Live.movies = movies;
        const el = document.getElementById('liveMovieList');
        if (!movies.length) {
            el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎬</div><h3>No movies in the database yet</h3><p>Add one from Admin → Movies.</p></div>';
            return;
        }
        el.innerHTML = `<div class="live-movie-list">${movies.map(m => `
            <div class="live-movie-card" onclick="navigate('live/showtimes', ${m.id})">
                <h3 style="margin-bottom:6px">${m.title}</h3>
                <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">${m.genre || ''} • ${m.language || ''} • ${m.duration_min} min</p>
                <p style="font-size:13px;color:var(--text-secondary)">${(m.description || '').slice(0, 100)}</p>
                <button class="btn btn-sm btn-primary" style="margin-top:12px">🎟 View Showtimes</button>
            </div>`).join('')}</div>`;
    } catch (e) {
        document.getElementById('liveMovieList').innerHTML = `<div class="live-error">Couldn't reach the backend at ${API_BASE}.<br>${e.message}<br><br>Check that your PHP server is running and API_BASE at the top of live-connect.js points to it.</div>`;
    }
}

async function renderLiveShowtimes(movieId) {
    document.getElementById('mainFooter').style.display = '';
    document.getElementById('app').innerHTML = `<div class="live-wrap"><div id="liveShowtimeList">Loading…</div></div>`;
    try {
        const movie = await LiveAPI.get('/api/movies.php?id=' + movieId);
        Live.selectedMovie = movie;
        const el = document.getElementById('liveShowtimeList');
        if (!movie.showtimes || !movie.showtimes.length) {
            el.innerHTML = `<h2 style="margin-bottom:16px">${movie.title}</h2><div class="empty-state"><div class="empty-state-icon">🕐</div><h3>No upcoming showtimes</h3><p>Add one via phpMyAdmin, or check back later.</p></div>`;
            return;
        }
        el.innerHTML = `
            <h2 style="margin-bottom:4px">${movie.title}</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px">Pick a showtime — seat availability below is live.</p>
            ${movie.showtimes.map(s => `
                <div class="live-showtime-row">
                    <div>
                        <strong>${s.show_date} • ${s.show_time.slice(0, 5)}</strong>
                        <div style="font-size:13px;color:var(--text-secondary)">${s.cinema_name} (${s.city}) • ${s.hall_name}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px">
                        <span style="font-size:13px;color:var(--text-secondary)">From LKR ${s.base_price}</span>
                        <button class="btn btn-sm btn-primary" onclick="navigate('live/seats', ${s.id})">Select Seats</button>
                    </div>
                </div>`).join('')}`;
    } catch (e) {
        document.getElementById('liveShowtimeList').innerHTML = `<div class="live-error">${e.message}</div>`;
    }
}

async function renderLiveSeats(showtimeId) {
    document.getElementById('mainFooter').style.display = '';
    document.getElementById('app').innerHTML = `<div class="live-wrap"><div id="liveSeatArea">Loading seat map…</div></div>`;
    Live.selectedSeats = [];
    Live.selectedShowtimeId = showtimeId;
    try {
        const data = await LiveAPI.get('/api/seats.php?showtime_id=' + showtimeId);
        Live.seatMap = data.seats;
        drawLiveSeats();
    } catch (e) {
        document.getElementById('liveSeatArea').innerHTML = `<div class="live-error">${e.message}</div>`;
    }
}

function drawLiveSeats() {
    const rows = {};
    Live.seatMap.forEach(s => { (rows[s.seat_row] = rows[s.seat_row] || []).push(s); });
    const el = document.getElementById('liveSeatArea');
    el.innerHTML = `
        <h2 style="margin-bottom:16px">Select your seats</h2>
        <div class="screen"><div class="screen-text">Screen</div><div class="screen-bar"></div></div>
        <div class="live-seat-grid">
            ${Object.keys(rows).sort().map(r => `
                <div class="live-seat-row">
                    ${rows[r].sort((a, b) => a.seat_number - b.seat_number).map(s => {
                        const taken = s.status !== 'available';
                        const sel = Live.selectedSeats.includes(s.showtime_seat_id);
                        return `<div class="live-seat ${s.seat_type} ${taken ? s.status : ''} ${sel ? 'selected' : ''}"
                                  ${taken ? '' : `onclick="toggleLiveSeat(${s.showtime_seat_id})"`}
                                  title="${s.seat_row}${s.seat_number} — ${s.seat_type}${taken ? ' (' + s.status + ')' : ''}">${s.seat_row}${s.seat_number}</div>`;
                    }).join('')}
                </div>`).join('')}
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">${Live.selectedSeats.length} seat(s) selected</p>
        <div id="liveBookMsg"></div>
        <button class="btn btn-primary" onclick="createLiveBooking()" ${Live.selectedSeats.length ? '' : 'disabled'}>Reserve Seats</button>`;
}

function toggleLiveSeat(id) {
    const i = Live.selectedSeats.indexOf(id);
    if (i >= 0) Live.selectedSeats.splice(i, 1); else Live.selectedSeats.push(id);
    drawLiveSeats();
}

async function createLiveBooking() {
    const msg = document.getElementById('liveBookMsg');
    try {
        const userId = (window.App && App.currentUser && App.currentUser.id) || 1;
        const res = await LiveAPI.post('/api/book.php', {
            user_id: userId,
            showtime_id: Live.selectedShowtimeId,
            showtime_seat_ids: Live.selectedSeats
        });
        Live.booking = res;
        navigate('live/confirm');
    } catch (e) {
        msg.innerHTML = `<div class="live-error">${e.message}</div>`;
    }
}

function renderLiveConfirm() {
    document.getElementById('mainFooter').style.display = '';
    if (!Live.booking) { navigate('live'); return; }
    document.getElementById('app').innerHTML = `
        <div class="live-wrap" style="max-width:520px">
            <h2>Confirm payment</h2>
            <p style="color:var(--text-secondary);margin-bottom:16px">Booking <strong>${Live.booking.booking_ref}</strong> — seats are held for 10 minutes.</p>
            <div class="summary-total" style="margin-bottom:16px"><span class="summary-total-label">Total</span><span class="summary-total-value">LKR ${Live.booking.total_amount}</span></div>
            <div id="livePayMsg"></div>
            <button class="btn btn-primary" onclick="payLiveBooking()">💳 Pay Now</button>
        </div>`;
}

async function payLiveBooking() {
    const msg = document.getElementById('livePayMsg');
    try {
        const res = await LiveAPI.post('/api/payment.php', {
            booking_id: Live.booking.booking_id,
            payment_method: 'card',
            transaction_id: 'DEMO-' + Date.now()
        });
        document.querySelector('.live-wrap').innerHTML =
            `<div class="live-success" style="font-size:16px;padding:20px">✅ ${res.message}<br>Booking ref: <strong>${res.booking_ref}</strong></div>
             <button class="btn btn-secondary" style="margin-top:16px" onclick="navigate('live')">Back to live movies</button>`;
    } catch (e) {
        msg.innerHTML = `<div class="live-error">${e.message}</div>`;
    }
}

/* ---------- ADMIN: real login against the admins table ---------- */
const __originalHandleLogin = window.handleLogin;
window.handleLogin = async function (role) {
    if (role !== 'admin') return __originalHandleLogin(role);

    const username = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    try {
        await LiveAPI.post('/admin/admin_auth.php', { username, password });
        App.currentUser = { id: 0, name: username, role: 'admin', avatar: username[0].toUpperCase(), email: username };
        localStorage.setItem('cinemax-session', JSON.stringify({ id: 0, admin: true }));
        updateNavUser();
        navigate('admin');
    } catch (e) {
        if (errorEl) errorEl.textContent = '⚠️ ' + e.message + ' — the DB seed account is username "admin" / password "admin123".';
    }
};

/* ---------- ADMIN: movie management now hits the real database ---------- */
window.renderAdminMoviesSection = function () {
    loadLiveAdminMovies();
    return `<div class="admin-toolbar">
            <div><span class="admin-count" id="liveAdminMovieCount">Loading…</span></div>
            <button class="btn btn-primary" onclick="openMovieForm()">➕ Add Movie</button>
        </div>
        <div class="admin-table-wrap"><table class="admin-table">
            <thead><tr><th>ID</th><th>Title</th><th>Genre</th><th>Language</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="liveAdminMovieRows"><tr><td colspan="6" style="text-align:center;padding:30px">Loading from database…</td></tr></tbody>
        </table></div>`;
};

async function loadLiveAdminMovies() {
    try {
        const movies = await LiveAPI.get('/admin/movies_crud.php');
        Live.adminMovies = movies;
        document.getElementById('liveAdminMovieCount').textContent = movies.length + ' movies (from database)';
        document.getElementById('liveAdminMovieRows').innerHTML = movies.map(m => `
            <tr>
                <td>${m.id}</td><td>${m.title}</td><td>${m.genre || '—'}</td><td>${m.language || '—'}</td>
                <td><span class="booking-status ${m.status}">${(m.status || '').replace('_', ' ')}</span></td>
                <td class="admin-actions">
                    <button class="btn btn-sm admin-edit-btn" onclick="openMovieForm(${m.id})">✏️ Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMovie(${m.id})">🗑️</button>
                </td>
            </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px">No movies yet</td></tr>';
    } catch (e) {
        document.getElementById('liveAdminMovieRows').innerHTML = `<tr><td colspan="6"><div class="live-error">${e.message}</div></td></tr>`;
    }
}

window.openMovieForm = function (id) {
    const m = id ? Live.adminMovies.find(x => x.id === id) : null;
    openModal(`
        <div class="admin-form">
            <h2>${m ? '✏️ Edit Movie (database)' : '➕ Add Movie (database)'}</h2>
            <div class="form-row">
                <div class="form-group"><label>Title</label><input class="form-input" id="mvTitle" value="${m ? m.title : ''}"></div>
                <div class="form-group"><label>Genre</label><input class="form-input" id="mvGenre" value="${m ? (m.genre || '') : ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Language</label><input class="form-input" id="mvLang" value="${m ? (m.language || '') : ''}"></div>
                <div class="form-group"><label>Duration (min)</label><input class="form-input" type="number" id="mvDuration" value="${m ? m.duration_min : 120}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Status</label><select class="form-input" id="mvStatus">
                    <option value="now_showing" ${m && m.status === 'now_showing' ? 'selected' : ''}>Now Showing</option>
                    <option value="upcoming" ${m && m.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                    <option value="ended" ${m && m.status === 'ended' ? 'selected' : ''}>Ended</option>
                </select></div>
                <div class="form-group"><label>Release Date</label><input class="form-input" type="date" id="mvDate" value="${m ? (m.release_date || '') : ''}"></div>
            </div>
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
        duration_min: parseInt(val('mvDuration')) || 120, status: document.getElementById('mvStatus').value,
        release_date: val('mvDate') || null, description: val('mvDesc')
    };
    if (!body.title) { alert('Please enter a movie title'); return; }
    try {
        if (id) await LiveAPI.put('/admin/movies_crud.php?id=' + id, body);
        else await LiveAPI.post('/admin/movies_crud.php', body);
        closeModal();
        renderAdminSection('movies');
    } catch (e) { alert('Save failed: ' + e.message); }
};

window.deleteMovie = async function (id) {
    if (!confirm('Delete this movie from the database? This cannot be undone.')) return;
    try {
        await LiveAPI.del('/admin/movies_crud.php?id=' + id);
        renderAdminSection('movies');
    } catch (e) { alert('Delete failed: ' + e.message); }
};

/* ---------- ADMIN: real revenue chart, layered onto the existing dashboard ---------- */
const __originalRenderCharts = window.renderCharts;
window.renderCharts = function () {
    __originalRenderCharts();
    LiveAPI.get('/admin/dashboard_stats.php').then(stats => {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        if (App.charts.revenue) App.charts.revenue.destroy();
        App.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.revenue_by_movie.map(r => r.title),
                datasets: [{
                    label: 'Revenue (LKR) — live from database',
                    data: stats.revenue_by_movie.map(r => r.total_revenue),
                    backgroundColor: '#00C853',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#8E8E9A' } } },
                scales: { x: { ticks: { color: '#8E8E9A' } }, y: { ticks: { color: '#8E8E9A' } } }
            }
        });
    }).catch(() => { /* backend not reachable — keep the existing demo chart */ });
};
