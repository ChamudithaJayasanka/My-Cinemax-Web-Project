/* ========================================
   CINEMA MAX - Main Application
   ======================================== */

const App = {
    currentPage: 'home',
    currentUser: null,
    selectedDate: null,
    selectedShowtime: null,
    selectedSeats: [],
    selectedCinema: null,
    selectedHall: null,
    selectedMovie: null,
    bookingStep: 1,
    searchQuery: '',
    charts: {},
    countdownTimer: null,
    movieFilter: 'all',
    movieSort: 'popularity',
    loginRole: 'user',
    offerFilter: 'all'
};

/* ---- UTILITY ---- */
function formatLKR(amount) {
    return 'LKR ' + amount.toLocaleString();
}

function getMovieById(id) {
    return APP_DATA.movies.find(m => m.id === id);
}

function getCinemaById(id) {
    return APP_DATA.cinemas.find(c => c.id === id);
}

function getHallById(cinemaId, hallId) {
    const cinema = getCinemaById(cinemaId);
    return cinema ? cinema.halls.find(h => h.id === hallId) : null;
}

function generateBookingId() {
    return 'CIN' + Math.floor(10000 + Math.random() * 90000);
}

function getDates() {
    const dates = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push({
            full: d,
            dayName: dayNames[d.getDay()],
            dayNum: d.getDate(),
            month: monthNames[d.getMonth()],
            label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[d.getDay()]
        });
    }
    return dates;
}

/* ---- LOYALTY & PERSONAL STATS ---- */
const LOYALTY_TIERS = [
    { name: 'Bronze', min: 0, color: '#CD7F32', icon: '🥉' },
    { name: 'Silver', min: 15000, color: '#C0C0C0', icon: '🥈' },
    { name: 'Gold', min: 40000, color: '#F5C518', icon: '🥇' },
    { name: 'Platinum', min: 80000, color: '#9FE2BF', icon: '💎' }
];

function getUserBookings(userId) {
    return APP_DATA.bookings.filter(b => b.userId === userId);
}

function getUserTotalSpent(userId) {
    return getUserBookings(userId).reduce((s, b) => s + (b.totalAmount || 0), 0);
}

function getUserPoints(userId) {
    return Math.floor(getUserTotalSpent(userId) / 100);
}

function getUserTier(userId) {
    const spent = getUserTotalSpent(userId);
    return [...LOYALTY_TIERS].reverse().find(t => spent >= t.min) || LOYALTY_TIERS[0];
}

function getUserNextTier(userId) {
    const spent = getUserTotalSpent(userId);
    return LOYALTY_TIERS.find(t => t.min > spent) || null;
}

function getMoviesWatched(userId) {
    return new Set(getUserBookings(userId).map(b => b.movieId)).size;
}

function getFavoriteGenre(userId) {
    const counts = {};
    getUserBookings(userId).forEach(b => {
        const m = getMovieById(b.movieId);
        if (m) (m.genre || []).forEach(g => counts[g] = (counts[g] || 0) + 1);
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : '—';
}

function getRecommendedMovies(userId, limit) {
    const booked = new Set(getUserBookings(userId).map(b => b.movieId));
    const favGenres = {};
    getUserBookings(userId).forEach(b => {
        const m = getMovieById(b.movieId);
        if (m) (m.genre || []).forEach(g => favGenres[g] = (favGenres[g] || 0) + 1);
    });
    return APP_DATA.movies
        .filter(m => !booked.has(m.id))
        .map(m => {
            const overlap = (m.genre || []).reduce((s, g) => s + (favGenres[g] || 0), 0);
            return { movie: m, score: overlap * 10 + (m.popularity || 0) * 0.5 };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit || 4)
        .map(x => x.movie);
}

function parseBookingDateTime(dateStr, timeStr) {
    let date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) {
        date = new Date(dateStr + 'T00:00:00');
    } else {
        const parts = (dateStr || '').split(' ');
        const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
        const year = parseInt(parts[2]) || new Date().getFullYear();
        date = new Date(year, monthMap[parts[1]] || 0, parseInt(parts[0]) || 1);
    }
    const tParts = (timeStr || '7:30 PM').split(':');
    let h = parseInt(tParts[0]);
    const m = parseInt(String(tParts[1] || '').replace(/\D/g, '') || 0);
    const isPM = /PM/i.test(timeStr || '');
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    date.setHours(h, m, 0, 0);
    return date.getTime();
}

function startCountdown(dateStr, timeStr) {
    clearAppIntervals();
    const end = parseBookingDateTime(dateStr, timeStr);
    const el = document.getElementById('countdownTimer');
    if (!el) return;
    function update() {
        const diff = end - Date.now();
        if (diff <= 0) {
            el.textContent = "It's showtime! 🍿";
            clearAppIntervals();
            return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor(diff % 86400000 / 3600000);
        const m = Math.floor(diff % 3600000 / 60000);
        const s = Math.floor(diff % 60000 / 1000);
        el.textContent = (d > 0 ? d + 'd ' : '') + h + 'h ' + m + 'm ' + s + 's';
    }
    update();
    App.countdownTimer = setInterval(update, 1000);
}

function clearAppIntervals() {
    if (App.countdownTimer) {
        clearInterval(App.countdownTimer);
        App.countdownTimer = null;
    }
}

/* ---- QUICK REBOOK ---- */
function quickRebook(bookingId) {
    const b = APP_DATA.bookings.find(x => x.id === bookingId);
    if (!b) return;
    const movie = getMovieById(b.movieId);
    if (!movie) return;
    App.selectedMovie = movie;
    App.selectedCinema = b.cinemaId;
    App.selectedHall = b.hallId;
    App.selectedShowtime = { time: b.showtime, available: b.ticketCount };
    App.selectedDate = getDates()[0];
    App.selectedSeats = (b.seats || []).map((id, i) => ({ id, type: (b.seatTypes || [])[i] || 'standard' }));
    navigate('checkout');
}

/* ---- NAVIGATION ---- */
function navigate(page, data) {
    App.currentPage = page;
    window.location.hash = page + (data ? '/' + data : '');
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const page = parts[0];
    const param = parts[1];

    clearAppIntervals();

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });

    switch (page) {
        case 'home': renderHome(); break;
        case 'movies': renderMovies(); break;
        case 'movie': renderMovieDetail(parseInt(param)); break;
        case 'seats': renderSeatSelection(parseInt(param)); break;
        case 'checkout': renderCheckout(); break;
        case 'ticket': renderTicket(); break;
        case 'dashboard': renderDashboard(); break;
        case 'admin':
            if (param) { renderAdminSection(param); break; }
            renderAdmin();
            break;
        case 'login': renderLogin(); break;
        case 'cinemas': renderCinemasPage(); break;
        case 'offers': renderOffersPage(); break;
        case 'contact': renderContact(); break;
        case 'watchlist': renderWatchlist(); break;
        case 'history': renderHistory(); break;
        case 'search': renderSearchResults(); break;
        default: renderHome();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeAllPanels();
}

/* ---- HEADER / NAV ---- */
function initNav() {
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    });

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

function updateNavUser() {
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    const loginBtn = document.getElementById('navLoginBtn');
    const userMenu = document.getElementById('navUser');

    if (!nameEl || !avatarEl) return;

    if (App.currentUser) {
        nameEl.textContent = App.currentUser.name;
        avatarEl.textContent = App.currentUser.avatar;
        nameEl.style.display = '';
        userMenu.style.display = '';
        if (loginBtn) loginBtn.style.display = 'none';
    } else {
        userMenu.style.display = 'none';
        if (loginBtn) loginBtn.style.display = '';
    }
}

function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('show');
}

function closeUserMenu() {
    document.getElementById('userDropdown').classList.remove('show');
}

function toggleNotifications() {
    document.getElementById('notificationsPanel').classList.toggle('show');
    renderNotifications();
}

function closeAllPanels() {
    document.getElementById('userDropdown').classList.remove('show');
    document.getElementById('notificationsPanel').classList.remove('show');
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('modal').classList.remove('show');
}

function toggleMobileMenu() {
    const links = document.querySelector('.nav-links');
    links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
    links.style.position = 'absolute';
    links.style.top = '70px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'var(--bg-secondary)';
    links.style.flexDirection = 'column';
    links.style.padding = '16px';
    links.style.borderBottom = '1px solid var(--border)';
}

function handleSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (q) {
        App.searchQuery = q;
        navigate('search');
    }
}

function handleLogout() {
    App.currentUser = null;
    localStorage.removeItem('cinemax-session');
    updateNavUser();
    navigate('login');
}

function renderNotifications() {
    const list = document.getElementById('notifList');
    const unread = APP_DATA.notifications.filter(n => !n.read).length;
    document.getElementById('notifBadge').textContent = unread;
    document.getElementById('notifBadge').style.display = unread > 0 ? 'flex' : 'none';

    list.innerHTML = APP_DATA.notifications.map(n => {
        const iconBg = n.type === 'booking' ? 'rgba(0,200,83,0.15)' : n.type === 'reminder' ? 'rgba(255,152,0,0.15)' : n.type === 'offer' ? 'rgba(156,39,176,0.15)' : 'rgba(33,150,243,0.15)';
        const icon = n.type === 'booking' ? '🎟' : n.type === 'reminder' ? '⏰' : n.type === 'offer' ? '🎁' : '🎬';
        return `<div class="notif-item ${n.read ? '' : 'unread'}">
            <div class="notif-icon-wrap" style="background:${iconBg}">${icon}</div>
            <div class="notif-content">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <div class="notif-time">${n.time}</div>
            </div>
        </div>`;
    }).join('');
}

function markAllRead() {
    APP_DATA.notifications.forEach(n => n.read = true);
    renderNotifications();
}

/* ---- HOME PAGE ---- */
function renderHome() {
    const featured = APP_DATA.movies.find(m => m.featured) || APP_DATA.movies[0];
    const nowShowing = APP_DATA.movies.filter(m => m.status === 'now_showing');
    const comingSoon = APP_DATA.movies.filter(m => m.status === 'coming_soon');
    const popular = [...APP_DATA.movies].sort((a, b) => b.popularity - a.popularity).slice(0, 6);

    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <!-- HERO -->
        <section class="hero">
            <div class="hero-bg">
                ${featured.poster ? `<img src="${featured.poster}" alt="${featured.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div class=\\'hero-gradient\\' style=\\'background:linear-gradient(135deg,${featured.posterGradient[0]},${featured.posterGradient[1]})\\'></div>'">` : `<div class="hero-gradient" style="background:linear-gradient(135deg,${featured.posterGradient[0]},${featured.posterGradient[1]})"></div>`}
            </div>
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-badge">🎬 FEATURED MOVIE</div>
                <h1 class="hero-title">${featured.title}</h1>
                <div class="hero-meta">
                    <div class="hero-rating"><span class="star">⭐</span> ${featured.rating}</div>
                    <div class="hero-meta-divider"></div>
                    ${featured.genre.slice(0, 2).map(g => `<div class="hero-meta-item">${g}</div>`).join('<div class="hero-meta-divider"></div>')}
                    <div class="hero-meta-divider"></div>
                    <div class="hero-meta-item">🕐 ${Math.floor(featured.duration / 60)}h ${featured.duration % 60}m</div>
                </div>
                <div class="hero-genres">
                    ${featured.formats.map(f => `<span class="genre-tag">${f}</span>`).join('')}
                    <span class="genre-tag">${featured.language}</span>
                </div>
                <p class="hero-description">${featured.description}</p>
                <div class="hero-actions">
                    <button class="btn btn-primary" onclick="navigate('movie', ${featured.id})">🎟 Book Tickets</button>
                    <button class="btn btn-secondary" onclick="showTrailer(${featured.id})">▶ Watch Trailer</button>
                </div>
            </div>
        </section>

        <!-- NOW SHOWING -->
        <section class="section">
            <div class="section-header">
                <div>
                    <h2 class="section-title">🎬 Now Showing</h2>
                    <p class="section-subtitle">Movies currently in theaters</p>
                </div>
                <a class="see-all" onclick="navigate('movies')">See All →</a>
            </div>
            <div class="movie-grid">${nowShowing.map(m => renderMovieCard(m)).join('')}</div>
        </section>

        <!-- COMING SOON -->
        ${comingSoon.length ? `
        <section class="section" style="padding-top:0">
            <div class="section-header">
                <div>
                    <h2 class="section-title">🔜 Coming Soon</h2>
                    <p class="section-subtitle">Upcoming releases</p>
                </div>
            </div>
            <div class="movie-grid">${comingSoon.map(m => renderMovieCard(m)).join('')}</div>
        </section>` : ''}

        <!-- POPULAR -->
        <section class="section" style="padding-top:0">
            <div class="section-header">
                <div>
                    <h2 class="section-title">🔥 Popular Movies</h2>
                    <p class="section-subtitle">Most booked this week</p>
                </div>
            </div>
            <div class="movie-grid">${popular.map(m => renderMovieCard(m)).join('')}</div>
        </section>

        <!-- OFFERS -->
        <section class="section" style="padding-top:0">
            <div class="section-header">
                <div>
                    <h2 class="section-title">🎁 Special Offers</h2>
                    <p class="section-subtitle">Save big on your next booking</p>
                </div>
                <a class="see-all" onclick="navigate('offers')">See All →</a>
            </div>
            <div class="offers-grid">${APP_DATA.offers.slice(0, 3).map(renderOfferCard).join('')}</div>
        </section>

        <!-- CINEMA LOCATIONS -->
        <section class="section" style="padding-top:0">
            <div class="section-header">
                <div>
                    <h2 class="section-title">🏢 Our Cinemas</h2>
                    <p class="section-subtitle">Find a cinema near you</p>
                </div>
                <a class="see-all" onclick="navigate('cinemas')">See All →</a>
            </div>
            <div class="cinemas-grid">${APP_DATA.cinemas.slice(0, 3).map(renderCinemaCard).join('')}</div>
        </section>
    `;
}

function renderMovieCard(movie) {
    const initials = movie.title.split(' ').slice(0, 2).map(w => w[0]).join('');
    return `
    <div class="movie-card" onclick="navigate('movie', ${movie.id})">
        <div class="movie-poster">
            ${movie.poster 
                ? `<img src="${movie.poster}" alt="${movie.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="movie-poster-gradient" style="display:none;background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]})">${initials}</div>`
                : `<div class="movie-poster-gradient" style="background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]})">${initials}</div>`
            }
            <div class="movie-poster-overlay">
                <button class="poster-btn" onclick="event.stopPropagation();showTrailer(${movie.id})">▶ Trailer</button>
                <button class="poster-btn" onclick="event.stopPropagation();navigate('movie',${movie.id})">Book Now</button>
            </div>
            <div class="movie-format-badge">
                ${movie.formats.map(f => `<span class="format-badge ${f === 'IMAX' ? 'imax' : f === '3D' ? 'three-d' : 'four-dx'}">${f}</span>`).join('')}
            </div>
            <div class="movie-rating-badge">⭐ ${movie.rating}</div>
            <div class="movie-status-badge ${movie.status === 'now_showing' ? 'now-showing' : 'coming-soon'}">${movie.status === 'now_showing' ? 'NOW SHOWING' : 'COMING SOON'}</div>
        </div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-meta">
                <span>${movie.genre[0]}</span>
                <span>•</span>
                <span>${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m</span>
            </div>
            <div class="movie-price">From ${formatLKR(movie.basePrice)}</div>
        </div>
    </div>`;
}

function getOfferStatus(offer) {
    const now = new Date();
    const from = new Date(offer.validFrom + 'T00:00:00');
    const to = new Date(offer.validTo + 'T23:59:59');
    if (now > to) return { state: 'expired', label: '⛔ Expired', days: 0 };
    if (now < from) {
        const d = Math.ceil((from - now) / 86400000);
        return { state: 'upcoming', label: '📅 Upcoming', days: d };
    }
    const d = Math.ceil((to - now) / 86400000);
    if (d === 0) return { state: 'expiring', label: '🔥 Ends today', days: 0 };
    if (d <= 7) return { state: 'expiring', label: `🔥 Ends in ${d} day${d === 1 ? '' : 's'}`, days: d };
    return { state: 'active', label: `Ends in ${d} days`, days: d };
}

function getOfferBadge(offer) {
    if (offer.type === 'percentage') return `-${offer.discount}%`;
    if (offer.type === 'fixed') return `LKR ${offer.discount}`;
    if (offer.type === 'bundle') return 'FREE +';
    return 'VIP';
}

function renderOfferCard(offer) {
    const st = getOfferStatus(offer);
    const badge = getOfferBadge(offer);
    const isExpired = st.state === 'expired';
    return `
    <div class="offer-card ${isExpired ? 'expired' : ''}">
        <div class="offer-top" style="background:linear-gradient(135deg, ${offer.color}, ${offer.color}80)">
            <span class="offer-icon">${offer.icon}</span>
            <span class="offer-discount-badge">${offer.discount > 0 ? badge : (offer.type === 'bundle' ? 'FREE GIFTS' : offer.type === 'upgrade' ? 'UPGRADE' : badge)}</span>
        </div>
        <div class="offer-body">
            <h3>${offer.title}</h3>
            <p>${offer.description}</p>
            <div class="offer-status-chip ${st.state}">${st.label}</div>
            <div class="offer-actions">
                <span class="offer-code" onclick="copyOfferCode('${offer.code}')" title="Click to copy">${offer.code} 📋</span>
                <button class="btn btn-sm btn-primary" onclick="redeemOfferCode('${offer.code}')">Redeem</button>
            </div>
            <div class="offer-validity">Valid: ${offer.validFrom} → ${offer.validTo}</div>
        </div>
    </div>`;
}

function copyOfferCode(code) {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    const toast = document.getElementById('offerToast');
    if (toast) {
        toast.textContent = `✅ Code "${code}" copied!`;
        toast.classList.add('show');
        clearTimeout(App.toastTimer);
        App.toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

function redeemOfferCode(code) {
    navigate('offers');
    setTimeout(() => {
        const el = document.getElementById('redeemCode');
        if (el) el.value = code;
        redeemOffer();
    }, 0);
}

function redeemOffer() {
    const input = document.getElementById('redeemCode');
    const result = document.getElementById('redeemResult');
    const code = (input.value || '').trim().toUpperCase();
    const sample = 1500;

    if (!code) {
        if (result) result.innerHTML = '<span class="redeem-error">⚠️ Enter a promo code first</span>';
        return;
    }
    const offer = APP_DATA.offers.find(o => o.code.toUpperCase() === code);
    if (!offer) {
        if (result) result.innerHTML = '<span class="redeem-error">❌ Invalid code — try STUDENT20, FAMILY4, WED800 or VIPUP</span>';
        return;
    }
    const st = getOfferStatus(offer);
    if (st.state === 'expired') {
        if (result) result.innerHTML = '<span class="redeem-error">❌ This offer has expired</span>';
        return;
    }
    if (st.state === 'upcoming') {
        if (result) result.innerHTML = '<span class="redeem-error">⏳ This offer hasn\'t started yet — check back soon</span>';
        return;
    }

    let msg;
    if (offer.type === 'percentage') {
        const save = Math.round(sample * offer.discount / 100);
        msg = `✅ <strong>${offer.title}</strong> applied! ${offer.discount}% off → you save <strong>LKR ${save}</strong> and pay <strong>LKR ${sample - save}</strong>`;
    } else if (offer.type === 'fixed') {
        const save = Math.min(offer.discount, sample);
        msg = `✅ <strong>${offer.title}</strong> applied! Ticket reduced to <strong>LKR ${sample - save}</strong>`;
    } else if (offer.type === 'bundle') {
        msg = `✅ <strong>${offer.title}</strong> applied! Get <strong>free popcorn + 2 drinks</strong> with 4+ tickets`;
    } else {
        msg = `✅ <strong>${offer.title}</strong> applied! VIP upgrade for only <strong>LKR 500</strong> extra, snacks included`;
    }
    if (result) result.innerHTML = `<span class="redeem-success">${msg}</span>`;
}

function filterOffers(btn, filter) {
    document.querySelectorAll('.offer-filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    App.offerFilter = filter;
    updateOffersGrid();
}

function updateOffersGrid() {
    const filter = App.offerFilter || 'all';
    let list;
    if (filter === 'all') list = APP_DATA.offers;
    else if (filter === 'active') list = APP_DATA.offers.filter(o => getOfferStatus(o).state !== 'expired');
    else list = APP_DATA.offers.filter(o => o.type === filter);
    const grid = document.getElementById('offerGrid');
    if (grid) {
        grid.innerHTML = list.map(renderOfferCard).join('') ||
            '<div class="empty-state"><div class="empty-state-icon">🎁</div><h3>No offers here</h3><p>Try another filter</p></div>';
    }
}

function renderCinemaCard(cinema) {
    return `
    <div class="cinema-card" onclick="navigate('cinemas')">
        <div class="cinema-cover" style="background:linear-gradient(135deg,var(--accent),#8b0000)">
            <img src="${cinema.image}" alt="${cinema.name}" loading="lazy" onerror="this.style.display='none'">
            <div class="cinema-cover-location">📍 ${cinema.location}</div>
        </div>
        <div class="cinema-card-body">
            <h3>${cinema.name}</h3>
            <div class="cinema-features">
                ${cinema.features.map(f => `<span class="cinema-feature-tag">${f}</span>`).join('')}
            </div>
            <div class="cinema-halls">🎦 ${cinema.halls.length} halls • 🕒 ${cinema.openingHours}</div>
        </div>
    </div>`;
}

function showTrailer(movieId) {
    const movie = getMovieById(movieId);
    if (!movie) return;

    if (movie.trailer) {
        openModal(`
            <div style="text-align:center;padding:20px">
                <h3 style="margin-bottom:16px">${movie.title} - Trailer</h3>
                <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:16px">
                    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%" 
                        src="https://www.youtube.com/embed/${movie.trailer}" 
                        title="${movie.title} Trailer" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>
                </div>
                <button class="btn btn-primary" onclick="closeModal()">Close</button>
            </div>
        `);
    } else {
        const q = encodeURIComponent(movie.title + ' official trailer');
        window.open('https://www.youtube.com/results?search_query=' + q, '_blank');
    }
}

/* ---- ALL MOVIES ---- */
function renderMovies() {
    document.getElementById('mainFooter').style.display = '';
    const genres = [...new Set(APP_DATA.movies.flatMap(m => m.genre))];

    document.getElementById('app').innerHTML = `
        <section class="section">
            <div class="section-header">
                <div>
                    <h2 class="section-title">🎬 All Movies</h2>
                    <p class="section-subtitle"><span id="movieCount">${APP_DATA.movies.length}</span> movies available</p>
                </div>
                <div class="sort-control">
                    <label class="sort-label" for="movieSort">Sort by</label>
                    <select class="sort-select" id="movieSort" onchange="setMovieSort(this.value)">
                        <option value="popularity">🔥 Popularity</option>
                        <option value="rating">⭐ Rating</option>
                        <option value="price_asc">💰 Price (Low → High)</option>
                        <option value="price_desc">💰 Price (High → Low)</option>
                        <option value="title">🔤 Title A-Z</option>
                    </select>
                </div>
            </div>
            <div class="filter-bar">
                <button class="filter-chip active" onclick="filterMovies(this, 'all')">All</button>
                <button class="filter-chip" onclick="filterMovies(this, 'now_showing')">Now Showing</button>
                <button class="filter-chip" onclick="filterMovies(this, 'coming_soon')">Coming Soon</button>
                ${genres.map(g => `<button class="filter-chip" onclick="filterMovies(this, '${g.toLowerCase()}')">${g}</button>`).join('')}
                <button class="filter-chip" onclick="filterMovies(this, 'sinhala')">🇱🇰 Sinhala</button>
            </div>
            <div class="movie-grid" id="filteredMovies"></div>
        </section>
    `;

    App.movieFilter = 'all';
    App.movieSort = 'popularity';
    updateFilteredMovies();
}

function filterMovies(btn, filter) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    App.movieFilter = filter;
    updateFilteredMovies();
}

function setMovieSort(sort) {
    App.movieSort = sort;
    updateFilteredMovies();
}

function updateFilteredMovies() {
    const filter = App.movieFilter || 'all';
    let filtered;
    if (filter === 'all') filtered = APP_DATA.movies;
    else if (filter === 'now_showing' || filter === 'coming_soon') filtered = APP_DATA.movies.filter(m => m.status === filter);
    else if (filter === 'sinhala') filtered = APP_DATA.movies.filter(m => m.language === 'Sinhala');
    else filtered = APP_DATA.movies.filter(m => (m.genre || []).some(g => g.toLowerCase() === filter));

    const sort = App.movieSort || 'popularity';
    filtered = [...filtered].sort((a, b) => {
        switch (sort) {
            case 'rating': return (b.rating || 0) - (a.rating || 0);
            case 'price_asc': return (a.basePrice || 0) - (b.basePrice || 0);
            case 'price_desc': return (b.basePrice || 0) - (a.basePrice || 0);
            case 'title': return a.title.localeCompare(b.title);
            default: return (b.popularity || 0) - (a.popularity || 0);
        }
    });

    const grid = document.getElementById('filteredMovies');
    if (grid) {
        grid.innerHTML = filtered.map(m => renderMovieCard(m)).join('') ||
            '<div class="empty-state"><div class="empty-state-icon">🎬</div><h3>No movies found</h3><p>Try a different filter</p></div>';
    }
    const count = document.getElementById('movieCount');
    if (count) count.textContent = filtered.length;
}

/* ---- MOVIE DETAIL ---- */
function renderMovieDetail(movieId) {
    const movie = getMovieById(movieId);
    if (!movie) { renderHome(); return; }
    App.selectedMovie = movie;
    const dates = getDates();
    if (!App.selectedDate) App.selectedDate = dates[0];

    document.getElementById('mainFooter').style.display = '';

    const showtimesHTML = buildShowtimesHTML(movie, App.selectedDate);

    document.getElementById('app').innerHTML = `
        <section class="movie-detail-hero">
            <div class="movie-detail-bg">
                ${movie.poster ? `<img src="${movie.poster}" alt="${movie.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">` : `<div class="movie-detail-gradient" style="background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]})"></div>`}
            </div>
            <div class="movie-detail-overlay"></div>
            <div class="movie-detail-content">
                <div class="movie-detail-poster">
                    ${movie.poster 
                        ? `<img src="${movie.poster}" alt="${movie.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="movie-poster-gradient" style="display:none;background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]});font-size:64px">${movie.title.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>`
                        : `<div class="movie-poster-gradient" style="background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]});font-size:64px">${movie.title.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>`
                    }
                </div>
                <div class="movie-detail-info">
                    <h1>${movie.title}</h1>
                    <div class="hero-meta">
                        <div class="hero-rating"><span class="star">⭐</span> ${movie.rating} / 10</div>
                        <div class="hero-meta-divider"></div>
                        <div class="hero-meta-item">🕐 ${Math.floor(movie.duration/60)}h ${movie.duration%60}m</div>
                        <div class="hero-meta-divider"></div>
                        <div class="hero-meta-item">🌐 ${movie.language}</div>
                    </div>
                    <div class="hero-genres" style="margin-bottom:16px">
                        ${movie.genre.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                        ${movie.formats.map(f => `<span class="genre-tag">${f}</span>`).join('')}
                    </div>
                    <p class="hero-description">${movie.description}</p>
                    <div class="movie-detail-tags">
                        <div class="detail-tag">🎬 Director: ${movie.director}</div>
                        <div class="detail-tag">🗣 Subtitles: ${movie.subtitles.join(', ')}</div>
                        <div class="detail-tag">💰 From ${formatLKR(movie.basePrice)}</div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:24px">
                        <button class="btn btn-primary" onclick="navigate('seats', ${movie.id})">🎟 Book Tickets</button>
                        <button class="btn btn-secondary" onclick="showTrailer(${movie.id})">▶ Watch Trailer</button>
                    </div>
                    <div class="movie-cast">
                        <h3>Cast</h3>
                        <div class="cast-list">
                            ${(Array.isArray(movie.cast) ? movie.cast : [movie.cast]).map(name => `
                                <div class="cast-item">
                                    <div class="cast-avatar">${name.split(' ').map(w=>w[0]).join('')}</div>
                                    <span>${name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="showtime-section">
            <h2>🎟 Select Showtime</h2>
            <div class="date-selector">
                ${dates.map((d, i) => `
                    <button class="date-btn ${i === 0 ? 'active' : ''}" onclick="selectDate(${i})">
                        <span class="day-name">${d.label}</span>
                        <span class="day-num">${d.dayNum}</span>
                        <span class="month">${d.month}</span>
                    </button>
                `).join('')}
            </div>
            <div id="showtimesContainer">${showtimesHTML}</div>
        </section>
    `;
}

function buildShowtimesHTML(movie, date) {
    let html = '';
    let hasShowtimes = false;

    for (const [cinemaId, halls] of Object.entries(APP_DATA.showtimes[movie.id] || {})) {
        const cinema = getCinemaById(parseInt(cinemaId));
        if (!cinema) continue;

        html += `<div class="cinema-showtime-card">
            <div class="cinema-showtime-header">
                <h3>${cinema.name}</h3>
                <span>📍 ${cinema.location}</span>
            </div>`;

        for (const [hallId, times] of Object.entries(halls)) {
            const hall = getHallById(parseInt(cinemaId), parseInt(hallId));
            if (!hall) continue;
            hasShowtimes = true;

            html += `<div class="hall-showtime">
                <h4>${hall.name} (${hall.type})</h4>
                <div class="time-slots">
                    ${times.map(t => `
                        <button class="time-slot" onclick="selectShowtime(${movie.id}, ${cinemaId}, ${hallId}, '${t.time}', ${t.available}, event)">
                            ${t.time}
                            <span class="seats-left">${t.available} seats</span>
                        </button>
                    `).join('')}
                </div>
            </div>`;
        }
        html += '</div>';
    }

    if (!hasShowtimes) {
        html = `<div class="empty-state">
            <div class="empty-state-icon">🎬</div>
            <h3>No showtimes available</h3>
            <p>Select a different date or check back later</p>
        </div>`;
    }

    return html;
}

function selectDate(index) {
    const dates = getDates();
    App.selectedDate = dates[index];
    document.querySelectorAll('.date-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
    if (App.selectedMovie) {
        document.getElementById('showtimesContainer').innerHTML = buildShowtimesHTML(App.selectedMovie, dates[index]);
    }
}

function selectShowtime(movieId, cinemaId, hallId, time, available, e) {
    App.selectedMovie = getMovieById(movieId);
    App.selectedCinema = cinemaId;
    App.selectedHall = hallId;
    App.selectedShowtime = { time, available };
    App.selectedSeats = [];

    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    if (e && e.currentTarget) e.currentTarget.classList.add('selected');

    navigate('seats', movieId);
}

/* ---- SEAT SELECTION ---- */
function renderSeatSelection(movieId) {
    const movie = getMovieById(movieId || (App.selectedMovie && App.selectedMovie.id));
    if (!movie) { navigate('home'); return; }
    App.selectedMovie = movie;

    const layout = APP_DATA.seatLayout;
    const cinema = getCinemaById(App.selectedCinema) || getCinemaById(1);
    const hall = getHallById(cinema.id, App.selectedHall) || cinema.halls[0];

    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <div class="seat-selection-page">
            <div class="seat-map-container">
                <h2 style="text-align:center;margin-bottom:8px;font-size:22px">${movie.title}</h2>
                <p style="text-align:center;color:var(--text-secondary);margin-bottom:24px;font-size:14px">${cinema.name} • ${hall.name} • ${App.selectedShowtime ? App.selectedShowtime.time : '7:30 PM'} • ${App.selectedDate ? App.selectedDate.label : 'Today'}</p>

                <div class="screen">
                    <div class="screen-text">Screen</div>
                    <div class="screen-bar"></div>
                </div>

                <div class="seats-grid" id="seatsGrid">
                    ${layout.rows.map(row => `
                        <div class="seat-row">
                            <span class="row-label">${row}</span>
                            ${Array.from({length: layout.seatsPerRow}, (_, i) => {
                                const seatId = row + (i + 1);
                                const isOccupied = layout.occupied.includes(seatId);
                                const isWheelchair = layout.wheelchair.includes(seatId);
                                const isCouple = layout.types[row] === 'couple';
                                const seatType = layout.types[row];
                                let cls = 'seat';
                                if (isOccupied) cls += ' occupied';
                                else if (isWheelchair) cls += ' wheelchair';
                                else cls += ' available';
                                if (isCouple) cls += ' couple';
                                return `<div class="${cls}" 
                                    data-seat="${seatId}" 
                                    data-type="${seatType}"
                                    onclick="${isOccupied ? '' : `toggleSeat('${seatId}', '${seatType}')`}"
                                    title="${seatId} - ${seatType}${isWheelchair ? ' (Wheelchair)' : ''}">${isOccupied ? '✕' : isWheelchair ? '♿' : seatId}</div>`;
                            }).join('')}
                            <span class="row-label">${row}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="seat-legend">
                    <div class="legend-item"><div class="legend-dot available"></div> Available</div>
                    <div class="legend-item"><div class="legend-dot selected"></div> Selected</div>
                    <div class="legend-item"><div class="legend-dot occupied"></div> Occupied</div>
                    <div class="legend-item"><div class="legend-dot premium" style="background:var(--gold)"></div> Premium</div>
                    <div class="legend-item"><div class="legend-dot vip" style="background:var(--purple)"></div> VIP</div>
                    <div class="legend-item"><div class="legend-dot wheelchair-dot"></div> Wheelchair</div>
                </div>
            </div>

            <div class="booking-summary">
                <h3>Your Booking</h3>
                <div class="summary-movie">
                    <div class="summary-poster">
                        ${movie.poster 
                            ? `<img src="${movie.poster}" alt="${movie.title}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="movie-poster-gradient" style="display:none;background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]});font-size:14px">${movie.title.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>`
                            : `<div class="movie-poster-gradient" style="background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]});font-size:14px">${movie.title.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>`
                        }
                    </div>
                    <div class="summary-movie-info">
                        <h4>${movie.title}</h4>
                        <p>${cinema.name}</p>
                        <p>${hall.name}</p>
                    </div>
                </div>

                <div class="summary-row">
                    <span class="summary-row-label">Date</span>
                    <span class="summary-row-value">${App.selectedDate ? App.selectedDate.label + ', ' + App.selectedDate.dayNum + ' ' + App.selectedDate.month : 'Today'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-row-label">Time</span>
                    <span class="summary-row-value">${App.selectedShowtime ? App.selectedShowtime.time : '7:30 PM'}</span>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-row">
                    <span class="summary-row-label">Seats</span>
                    <div class="summary-seats" id="summarySeats"><span style="color:var(--text-muted);font-size:13px">No seats selected</span></div>
                </div>

                <div class="summary-row">
                    <span class="summary-row-label">Tickets</span>
                    <span class="summary-row-value" id="summaryTickets">0 × Premium</span>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-total">
                    <span class="summary-total-label">Total</span>
                    <span class="summary-total-value" id="summaryTotal">${formatLKR(0)}</span>
                </div>

                <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px" onclick="proceedToCheckout()" id="continueBtn" disabled>Continue</button>
            </div>
        </div>
    `;
}

function toggleSeat(seatId, seatType) {
    const idx = App.selectedSeats.findIndex(s => s.id === seatId);
    const el = document.querySelector(`[data-seat="${seatId}"]`);

    if (idx >= 0) {
        App.selectedSeats.splice(idx, 1);
        el.classList.remove('selected');
        el.classList.add('available');
        el.textContent = seatId;
    } else {
        App.selectedSeats.push({ id: seatId, type: seatType });
        el.classList.remove('available');
        el.classList.add('selected');
        el.textContent = '●';
    }

    updateBookingSummary();
}

function updateBookingSummary() {
    const prices = APP_DATA.seatLayout.prices;
    let total = 0;

    const seatsContainer = document.getElementById('summarySeats');
    const ticketsEl = document.getElementById('summaryTickets');
    const totalEl = document.getElementById('summaryTotal');
    const btn = document.getElementById('continueBtn');

    if (App.selectedSeats.length === 0) {
        seatsContainer.innerHTML = '<span style="color:var(--text-muted);font-size:13px">No seats selected</span>';
        ticketsEl.textContent = '0 × Premium';
        totalEl.textContent = formatLKR(0);
        btn.disabled = true;
        return;
    }

    seatsContainer.innerHTML = App.selectedSeats.map(s =>
        `<span class="seat-tag">${s.id}</span>`
    ).join('');

    const typeCounts = {};
    App.selectedSeats.forEach(s => {
        typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
        total += prices[s.type] || 1500;
    });

    const ticketStr = Object.entries(typeCounts).map(([type, count]) => `${count} × ${type.charAt(0).toUpperCase() + type.slice(1)}`).join(', ');
    ticketsEl.textContent = ticketStr;
    totalEl.textContent = formatLKR(total);
    btn.disabled = false;
}

function proceedToCheckout() {
    if (App.selectedSeats.length === 0) return;
    App.bookingStep = 1;
    navigate('checkout');
}

/* ---- CHECKOUT ---- */
function renderCheckout() {
    if (!App.selectedMovie || App.selectedSeats.length === 0) { navigate('home'); return; }

    const movie = App.selectedMovie;
    const cinema = getCinemaById(App.selectedCinema) || getCinemaById(1);
    const hall = getHallById(cinema.id, App.selectedHall) || cinema.halls[0];
    const prices = APP_DATA.seatLayout.prices;
    let subtotal = 0;
    App.selectedSeats.forEach(s => subtotal += prices[s.type] || 1500);
    const convenience = 200;
    const total = subtotal + convenience;

    document.getElementById('mainFooter').style.display = 'none';

    document.getElementById('app').innerHTML = `
        <div class="checkout-page">
            <div class="checkout-steps">
                <div class="checkout-step ${App.bookingStep >= 1 ? (App.bookingStep > 1 ? 'completed' : 'active') : ''}">
                    <div class="step-number">${App.bookingStep > 1 ? '✓' : '1'}</div>
                    <span class="step-label">Seats</span>
                </div>
                <div class="checkout-step ${App.bookingStep >= 2 ? (App.bookingStep > 2 ? 'completed' : 'active') : ''}">
                    <div class="step-number">${App.bookingStep > 2 ? '✓' : '2'}</div>
                    <span class="step-label">Customer Details</span>
                </div>
                <div class="checkout-step ${App.bookingStep >= 3 ? 'active' : ''}">
                    <div class="step-number">3</div>
                    <span class="step-label">Payment</span>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 340px;gap:24px">
                <div>
                    ${App.bookingStep === 1 ? renderCheckoutStep1() : ''}
                    ${App.bookingStep === 2 ? renderCheckoutStep2() : ''}
                    ${App.bookingStep === 3 ? renderCheckoutStep3() : ''}
                </div>
                <div>
                    <div class="booking-summary-right">
                        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">Booking Summary</h3>
                        <div class="summary-row">
                            <span class="summary-row-label">Movie</span>
                            <span class="summary-row-value">${movie.title}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-row-label">Cinema</span>
                            <span class="summary-row-value">${cinema.name}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-row-label">Hall</span>
                            <span class="summary-row-value">${hall.name}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-row-label">Date</span>
                            <span class="summary-row-value">${App.selectedDate ? App.selectedDate.dayNum + ' ' + App.selectedDate.month + ' 2026' : '15 Sep 2026'}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-row-label">Time</span>
                            <span class="summary-row-value">${App.selectedShowtime ? App.selectedShowtime.time : '7:30 PM'}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-row-label">Seats</span>
                            <span class="summary-row-value">${App.selectedSeats.map(s => s.id).join(', ')}</span>
                        </div>
                        <div class="summary-divider"></div>
                        <div class="summary-row">
                            <span class="summary-row-label">Tickets</span>
                            <span class="summary-row-value">${formatLKR(subtotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-row-label">Convenience</span>
                            <span class="summary-row-value">${formatLKR(convenience)}</span>
                        </div>
                        <div class="summary-divider"></div>
                        <div class="summary-total">
                            <span class="summary-total-label">Total</span>
                            <span class="summary-total-value">${formatLKR(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCheckoutStep1() {
    return `
        <div class="checkout-form">
            <h3 style="margin-bottom:20px">Review Your Seats</h3>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px">
                ${App.selectedSeats.map(s => `
                    <div style="padding:12px 20px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;text-align:center">
                        <div style="font-size:18px;font-weight:700">${s.id}</div>
                        <div style="font-size:12px;color:var(--text-secondary);text-transform:capitalize">${s.type}</div>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-primary" onclick="App.bookingStep=2;renderCheckout()">Continue to Details →</button>
        </div>`;
}

function renderCheckoutStep2() {
    return `
        <div class="checkout-form">
            <h3 style="margin-bottom:20px">Customer Details</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>First Name</label>
                    <input class="form-input" type="text" id="firstName" value="Chamuditha" placeholder="Enter first name">
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input class="form-input" type="text" id="lastName" value="Perera" placeholder="Enter last name">
                </div>
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input class="form-input" type="email" id="email" value="chamuditha@email.com" placeholder="Enter email">
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input class="form-input" type="tel" id="phone" value="+94 77 123 4567" placeholder="Enter phone number">
            </div>
            <div style="display:flex;gap:12px">
                <button class="btn btn-secondary" onclick="App.bookingStep=1;renderCheckout()">← Back</button>
                <button class="btn btn-primary" onclick="App.bookingStep=3;renderCheckout()">Continue to Payment →</button>
            </div>
        </div>`;
}

function renderCheckoutStep3() {
    return `
        <div class="checkout-form">
            <h3 style="margin-bottom:20px">Select Payment Method</h3>
            <div class="payment-methods">
                <button class="payment-method selected" onclick="selectPayment(this)">
                    <div class="payment-method-icon">💳</div>
                    <div class="payment-method-name">Visa / Mastercard</div>
                </button>
                <button class="payment-method" onclick="selectPayment(this)">
                    <div class="payment-method-icon">🏦</div>
                    <div class="payment-method-name">Online Banking</div>
                </button>
                <button class="payment-method" onclick="selectPayment(this)">
                    <div class="payment-method-icon">📱</div>
                    <div class="payment-method-name">Mobile Payment</div>
                </button>
                <button class="payment-method" onclick="selectPayment(this)">
                    <div class="payment-method-icon">📷</div>
                    <div class="payment-method-name">QR Payment</div>
                </button>
                <button class="payment-method" onclick="selectPayment(this)">
                    <div class="payment-method-icon">🅿️</div>
                    <div class="payment-method-name">PayPal</div>
                </button>
            </div>

            <div id="cardForm">
                <div class="form-group">
                    <label>Card Number</label>
                    <input class="form-input" type="text" placeholder="1234 5678 9012 3456" maxlength="19" oninput="formatCardNumber(this)">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Expiry Date</label>
                        <input class="form-input" type="text" placeholder="MM/YY" maxlength="5">
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input class="form-input" type="text" placeholder="123" maxlength="3">
                    </div>
                </div>
                <div class="form-group">
                    <label>Cardholder Name</label>
                    <input class="form-input" type="text" placeholder="Name on card">
                </div>
            </div>

            <div style="display:flex;gap:12px;margin-top:24px">
                <button class="btn btn-secondary" onclick="App.bookingStep=2;renderCheckout()">← Back</button>
                <button class="btn btn-primary" onclick="processPayment(this)" style="flex:1;justify-content:center">💳 Pay Now</button>
            </div>
        </div>`;
}

function selectPayment(el) {
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');
}

function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
}

function processPayment(btn) {
    if (!btn) btn = document.querySelector('.btn-primary');
    btn.innerHTML = '⏳ Processing...';
    btn.disabled = true;

    const prices = APP_DATA.seatLayout.prices;
    let subtotal = 0;
    App.selectedSeats.forEach(s => subtotal += prices[s.type] || 1500);
    const convenience = 200;
    const total = subtotal + convenience;

    setTimeout(() => {
        const booking = {
            id: generateBookingId(),
            movieId: App.selectedMovie.id,
            cinemaId: App.selectedCinema,
            hallId: App.selectedHall,
            userId: App.currentUser ? App.currentUser.id : 1,
            showtime: App.selectedShowtime ? App.selectedShowtime.time : '7:30 PM',
            date: App.selectedDate ? `${App.selectedDate.dayNum} ${App.selectedDate.month} 2026` : '15 Sep 2026',
            seats: App.selectedSeats.map(s => s.id),
            seatTypes: App.selectedSeats.map(s => s.type),
            ticketCount: App.selectedSeats.length,
            totalAmount: total,
            convenienceFee: convenience,
            paymentMethod: document.querySelector('.payment-method.selected') ? document.querySelector('.payment-method.selected').dataset.method : 'card',
            bookingDate: new Date().toISOString(),
            status: 'confirmed'
        };

        APP_DATA.bookings.push(booking);
        App.latestBooking = booking;
        App.bookingStep = 1;
        navigate('ticket');
    }, 2000);
}

/* ---- DIGITAL TICKET ---- */
function renderTicket() {
    const booking = App.latestBooking || APP_DATA.bookings[0];
    if (!booking) { navigate('home'); return; }

    const movie = getMovieById(booking.movieId);
    const cinema = getCinemaById(booking.cinemaId) || getCinemaById(1);
    const hall = getHallById(cinema.id, booking.hallId) || cinema.halls[0];

    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <div class="ticket-page">
            <div style="text-align:center;margin-bottom:24px">
                <div class="success-animation">
                    <div class="success-check">✓</div>
                </div>
                <h2 style="font-size:24px;font-weight:800;margin-bottom:4px">Booking Confirmed!</h2>
                <p style="color:var(--text-secondary);font-size:14px">Your ticket has been generated successfully</p>
            </div>

            <div class="digital-ticket">
                <div class="ticket-header">
                    <h2>🎬 CINEMA MAX</h2>
                    <p>Sri Lanka's Premier Cinema Experience</p>
                </div>
                <div class="ticket-perforation"></div>
                <div class="ticket-body">
                    <div class="ticket-movie-title">${movie ? movie.title : 'Movie'}</div>

                    <div class="ticket-details">
                        <div class="ticket-detail-row">
                            <div class="ticket-detail-icon">📅</div>
                            <div class="ticket-detail-text">
                                <span>Date</span>
                                <strong>${booking.date}</strong>
                            </div>
                        </div>
                        <div class="ticket-detail-row">
                            <div class="ticket-detail-icon">🕐</div>
                            <div class="ticket-detail-text">
                                <span>Time</span>
                                <strong>${booking.showtime}</strong>
                            </div>
                        </div>
                        <div class="ticket-detail-row">
                            <div class="ticket-detail-icon">📍</div>
                            <div class="ticket-detail-text">
                                <span>Cinema</span>
                                <strong>${cinema.name} • ${cinema.location}</strong>
                            </div>
                        </div>
                        <div class="ticket-detail-row">
                            <div class="ticket-detail-icon">🎬</div>
                            <div class="ticket-detail-text">
                                <span>Hall</span>
                                <strong>${hall.name} (${hall.type})</strong>
                            </div>
                        </div>
                    </div>

                    <div class="ticket-seats">
                        ${booking.seats.map(s => `<span class="ticket-seat-tag">💺 ${s}</span>`).join('')}
                    </div>

                    <div class="ticket-qr">
                        <div class="qr-placeholder"></div>
                    </div>
                    <div class="ticket-booking-id">BOOKING #${booking.id}</div>
                </div>
            </div>

            <div style="display:flex;gap:12px;margin-top:24px;justify-content:center">
                <button class="btn btn-primary" onclick="navigate('dashboard')">📋 View Dashboard</button>
                <button class="btn btn-secondary" onclick="navigate('home')">🏠 Back to Home</button>
            </div>
        </div>
    `;
}

/* ---- USER DASHBOARD ---- */
function renderDashboard() {
    const user = App.currentUser || APP_DATA.users[0];
    const userBookings = getUserBookings(user.id);
    const upcomingBookings = userBookings.filter(b => b.status !== 'cancelled');
    const tier = getUserTier(user.id);
    const nextTier = getUserNextTier(user.id);
    const spent = getUserTotalSpent(user.id);
    const points = getUserPoints(user.id);

    const tierProgress = nextTier ? Math.min(100, Math.round((spent / nextTier.min) * 100)) : 100;

    document.getElementById('mainFooter').style.display = '';

    const recommended = getRecommendedMovies(user.id, 4);

    document.getElementById('app').innerHTML = `
        <div class="dashboard-page">
            <div class="dashboard-header">
                <div>
                    <h1>My Dashboard</h1>
                    <p>Welcome back, ${user.name} 👋</p>
                </div>
            </div>

            <div class="loyalty-card">
                <div class="loyalty-head">
                    <div class="loyalty-tier">
                        <span class="loyalty-tier-icon">${tier.icon}</span>
                        <div>
                            <div class="loyalty-tier-name">${tier.name} Member</div>
                            <div class="loyalty-tier-sub">${formatLKR(spent)} lifetime spend</div>
                        </div>
                    </div>
                    <div class="loyalty-points">
                        <div class="loyalty-points-value">${points.toLocaleString()}</div>
                        <div class="loyalty-points-label">Reward Points</div>
                    </div>
                </div>
                <div class="loyalty-progress">
                    <div class="loyalty-progress-bar" style="width:${tierProgress}%;background:${tier.color}"></div>
                </div>
                <div class="loyalty-progress-label">
                    ${nextTier
                        ? `${formatLKR(nextTier.min - spent)} more to reach <strong>${nextTier.icon} ${nextTier.name}</strong>`
                        : `You've reached the highest tier <strong>${tier.icon} ${tier.name}</strong> — enjoy exclusive perks!`}
                </div>
            </div>

            <div class="dash-stats">
                <div class="dash-stat">
                    <div class="dash-stat-icon">🎟️</div>
                    <div class="dash-stat-value">${upcomingBookings.length}</div>
                    <div class="dash-stat-label">Upcoming Bookings</div>
                </div>
                <div class="dash-stat">
                    <div class="dash-stat-icon">🎬</div>
                    <div class="dash-stat-value">${getMoviesWatched(user.id)}</div>
                    <div class="dash-stat-label">Movies Watched</div>
                </div>
                <div class="dash-stat">
                    <div class="dash-stat-icon">💰</div>
                    <div class="dash-stat-value">${formatLKR(spent).replace('LKR ', '')}</div>
                    <div class="dash-stat-label">Total Spent</div>
                </div>
                <div class="dash-stat">
                    <div class="dash-stat-icon">❤️</div>
                    <div class="dash-stat-value" style="font-size:18px">${getFavoriteGenre(user.id)}</div>
                    <div class="dash-stat-label">Favorite Genre</div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-sidebar">
                    <div class="sidebar-user">
                        <div class="sidebar-avatar">${user.avatar}</div>
                        <h3>${user.name}</h3>
                        <p>${user.email}</p>
                    </div>
                    <nav class="sidebar-nav">
                        <a href="#dashboard" class="active">📋 My Bookings</a>
                        <a href="#watchlist">❤️ Watchlist</a>
                        <a href="#history">📜 Booking History</a>
                        <a href="#dashboard">🔔 Notifications</a>
                        <a href="#dashboard">👤 Profile</a>
                    </nav>
                </div>

                <div class="dashboard-content">
                    <h3 style="margin-bottom:16px;font-size:18px;font-weight:700">Upcoming Bookings</h3>
                    ${upcomingBookings.length ? `
                        ${startCountdownBtn(upcomingBookings[0])}
                        <div class="booking-cards">
                            ${upcomingBookings.map(b => {
                                const movie = getMovieById(b.movieId);
                                const cinema = getCinemaById(b.cinemaId) || getCinemaById(1);
                                return `
                                <div class="booking-card">
                                    <div class="booking-card-poster">
                                        ${movie && movie.poster 
                                            ? `<img src="${movie.poster}" alt="${movie.title}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="movie-poster-gradient" style="display:none;background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]});font-size:16px">${movie.title.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>`
                                            : `<div class="movie-poster-gradient" style="background:linear-gradient(135deg,${movie ? movie.posterGradient[0] : '#333'},${movie ? movie.posterGradient[1] : '#666'});font-size:16px">${movie ? movie.title.split(' ').slice(0,2).map(w=>w[0]).join('') : '🎬'}</div>`
                                        }
                                    </div>
                                    <div class="booking-card-info">
                                        <h4>${movie ? movie.title : 'Movie'}</h4>
                                        <div class="booking-card-detail">📅 ${b.date}</div>
                                        <div class="booking-card-detail">🕐 ${b.showtime}</div>
                                        <div class="booking-card-detail">📍 ${cinema.name}</div>
                                        <div class="booking-card-detail">💺 ${b.seats.join(', ')}</div>
                                        <span class="booking-status ${b.status}">${b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
                                        <div class="booking-card-actions">
                                            <button class="btn btn-sm btn-outline" onclick="navigate('ticket')">View Ticket</button>
                                            <button class="btn btn-sm admin-edit-btn" onclick="quickRebook('${b.id}')">⚡ Rebook</button>
                                        </div>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <div class="empty-state-icon">🎟</div>
                            <h3>No upcoming bookings</h3>
                            <p>Book a movie to see your tickets here</p>
                            <button class="btn btn-primary" onclick="navigate('movies')">Browse Movies</button>
                        </div>
                    `}

                    ${recommended.length ? `
                        <h3 class="dash-section-title">⭐ Recommended for You</h3>
                        <p class="dash-section-sub">Based on genres you love</p>
                        <div class="movie-grid">${recommended.map(m => renderMovieCard(m)).join('')}</div>
                    ` : ''}

                    <h3 class="dash-section-title">Quick Actions</h3>
                    <div class="quick-actions">
                        <div class="quick-action-card" onclick="navigate('movies')">
                            <div class="quick-action-icon">🎟</div>
                            <h4>Book Tickets</h4>
                        </div>
                        <div class="quick-action-card" onclick="navigate('watchlist')">
                            <div class="quick-action-icon">❤️</div>
                            <h4>My Watchlist</h4>
                        </div>
                        <div class="quick-action-card" onclick="navigate('history')">
                            <div class="quick-action-icon">📜</div>
                            <h4>Booking History</h4>
                        </div>
                        <div class="quick-action-card" onclick="navigate('offers')">
                            <div class="quick-action-icon">🎁</div>
                            <h4>Special Offers</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (upcomingBookings.length) {
        const first = upcomingBookings[0];
        startCountdown(first.date, first.showtime);
    }
}

function startCountdownBtn(booking) {
    return `
        <div class="countdown-card">
            <div class="countdown-label">⏰ Next showtime in</div>
            <div class="countdown-timer" id="countdownTimer">--</div>
            <div class="countdown-movie">${getMovieById(booking.movieId) ? getMovieById(booking.movieId).title : ''} • ${booking.showtime}</div>
        </div>`;
}

/* ---- ADMIN DASHBOARD ---- */
function renderAdmin() {
    const stats = APP_DATA.adminStats;

    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <div class="admin-page">
            <div class="admin-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p style="color:var(--text-secondary);font-size:14px">Welcome back, ${App.currentUser ? App.currentUser.name : 'Admin'} 👋</p>
                </div>
            </div>

            <div class="admin-tabs">
                <button class="admin-tab active">📊 Dashboard</button>
                <button class="admin-tab" onclick="navigate('admin/movies')">🎬 Movies</button>
                <button class="admin-tab" onclick="navigate('admin/bookings')">🎟 Bookings</button>
                <button class="admin-tab" onclick="navigate('admin/customers')">👥 Customers</button>
                <button class="admin-tab" onclick="navigate('admin/showtimes')">🕐 Showtimes</button>
                <button class="admin-tab" onclick="navigate('admin/offers')">🎁 Offers</button>
                <button class="admin-tab" onclick="navigate('admin/cinemas')">🏢 Cinemas</button>
            </div>

            <div class="admin-stats">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-label">Today's Revenue</div>
                        <div class="stat-card-icon" style="background:rgba(0,200,83,0.15)">💰</div>
                    </div>
                    <div class="stat-card-value">${formatLKR(stats.todayRevenue)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-label">Today's Bookings</div>
                        <div class="stat-card-icon" style="background:rgba(33,150,243,0.15)">🎟</div>
                    </div>
                    <div class="stat-card-value">${stats.todayBookings}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-label">Available Seats</div>
                        <div class="stat-card-icon" style="background:rgba(255,152,0,0.15)">💺</div>
                    </div>
                    <div class="stat-card-value">${stats.availableSeats}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-label">Active Movies</div>
                        <div class="stat-card-icon" style="background:rgba(156,39,176,0.15)">🎬</div>
                    </div>
                    <div class="stat-card-value">${stats.activeMovies}</div>
                </div>
            </div>

            <div class="admin-charts">
                <div class="chart-card">
                    <h3>📈 Daily Revenue</h3>
                    <div class="chart-container"><canvas id="revenueChart"></canvas></div>
                </div>
                <div class="chart-card">
                    <h3>📊 Ticket Sales</h3>
                    <div class="chart-container"><canvas id="salesChart"></canvas></div>
                </div>
                <div class="chart-card">
                    <h3>🎬 Most Popular Movies</h3>
                    <div class="chart-container"><canvas id="moviesChart"></canvas></div>
                </div>
                <div class="chart-card">
                    <h3>🏢 Cinema Performance</h3>
                    <div class="chart-container"><canvas id="cinemaChart"></canvas></div>
                </div>
            </div>

            <h3 style="margin-bottom:16px;font-size:18px;font-weight:700">Admin Modules</h3>
            <div class="admin-modules">
                <div class="admin-module" onclick="navigate('admin/movies')"><div class="admin-module-icon">🎬</div><h4>Movies</h4><p class="admin-module-desc">Add, edit & remove movies</p></div>
                <div class="admin-module" onclick="navigate('admin/bookings')"><div class="admin-module-icon">🎟</div><h4>Bookings</h4><p class="admin-module-desc">View & manage bookings</p></div>
                <div class="admin-module" onclick="navigate('admin/customers')"><div class="admin-module-icon">👥</div><h4>Customers</h4><p class="admin-module-desc">Manage customers</p></div>
                <div class="admin-module" onclick="navigate('admin/showtimes')"><div class="admin-module-icon">🕐</div><h4>Showtimes</h4><p class="admin-module-desc">Manage movie schedules</p></div>
                <div class="admin-module" onclick="navigate('admin/offers')"><div class="admin-module-icon">🎁</div><h4>Offers</h4><p class="admin-module-desc">Create & manage offers</p></div>
                <div class="admin-module" onclick="navigate('admin/cinemas')"><div class="admin-module-icon">🏢</div><h4>Cinemas</h4><p class="admin-module-desc">Cinemas & halls</p></div>
            </div>
        </div>
    `;

    setTimeout(renderCharts, 100);
}

function renderCharts() {
    const stats = APP_DATA.adminStats;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8E8E9A', font: { size: 12 } } } },
        scales: {
            x: { ticks: { color: '#8E8E9A' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#8E8E9A' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    };

    Object.values(App.charts).forEach(c => c.destroy());
    App.charts = {};

    App.charts.revenue = new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Revenue (LKR)',
                data: stats.weeklyRevenue,
                borderColor: '#DC143C',
                backgroundColor: 'rgba(220,20,60,0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: chartDefaults
    });

    App.charts.sales = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Tickets Sold',
                data: stats.dailySales,
                backgroundColor: '#2196F3',
                borderRadius: 6
            }]
        },
        options: chartDefaults
    });

    App.charts.movies = new Chart(document.getElementById('moviesChart'), {
        type: 'bar',
        data: {
            labels: stats.moviePopularity.map(m => m.name),
            datasets: [{
                label: 'Tickets',
                data: stats.moviePopularity.map(m => m.tickets),
                backgroundColor: ['#DC143C', '#FF9800', '#2196F3', '#9C27B0', '#00C853'],
                borderRadius: 6
            }]
        },
        options: { ...chartDefaults, indexAxis: 'y' }
    });

    App.charts.cinema = new Chart(document.getElementById('cinemaChart'), {
        type: 'doughnut',
        data: {
            labels: stats.cinemaPerformance.map(c => c.name),
            datasets: [{
                data: stats.cinemaPerformance.map(c => c.revenue),
                backgroundColor: ['#DC143C', '#2196F3', '#FF9800', '#9C27B0', '#00C853']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#8E8E9A', font: { size: 12 }, padding: 12 } } }
        }
    });
}

/* ---- ADMIN SECTIONS ---- */
const ADMIN_TABS = {
    dashboard: ['dashboard', '📊 Dashboard'],
    movies: ['movies', '🎬 Movies'],
    bookings: ['bookings', '🎟 Bookings'],
    customers: ['customers', '👥 Customers'],
    showtimes: ['showtimes', '🕐 Showtimes'],
    offers: ['offers', '🎁 Offers'],
    cinemas: ['cinemas', '🏢 Cinemas']
};

const ADMIN_TITLES = {
    dashboard: 'Admin Dashboard',
    movies: 'Movie Management',
    bookings: 'Booking Management',
    customers: 'Customer Management',
    showtimes: 'Showtime Management',
    offers: 'Offer Management',
    cinemas: 'Cinema & Hall Management'
};

function renderAdminSection(section) {
    if (!section || section === 'dashboard') { renderAdmin(); return; }

    const tabBar = `
        <div class="admin-tabs">
            ${Object.values(ADMIN_TABS).map(([key, label]) => `
                <button class="admin-tab ${key === section ? 'active' : ''}" onclick="navigate('admin/${key}')">${label}</button>
            `).join('')}
        </div>`;

    document.getElementById('mainFooter').style.display = '';
    document.getElementById('app').innerHTML = `
        <div class="admin-page">
            <div class="admin-header">
                <div>
                    <h1>${ADMIN_TITLES[section]}</h1>
                    <p style="color:var(--text-secondary);font-size:14px">Welcome back, ${App.currentUser ? App.currentUser.name : 'Admin'} 👋</p>
                </div>
            </div>
            ${tabBar}
            ${getAdminSectionContent(section)}
        </div>
    `;
}

function getAdminSectionContent(section) {
    switch (section) {
        case 'movies': return renderAdminMoviesSection();
        case 'bookings': return renderAdminBookingsSection();
        case 'customers': return renderAdminCustomersSection();
        case 'showtimes': return renderAdminShowtimesSection();
        case 'offers': return renderAdminOffersSection();
        case 'cinemas': return renderAdminCinemasSection();
        default: return '';
    }
}

/* ---- ADMIN: MOVIES ---- */
function renderAdminMoviesSection() {
    return `
        <div class="admin-toolbar">
            <div>
                <span class="admin-count">${APP_DATA.movies.length} movies</span>
            </div>
            <button class="btn btn-primary" onclick="openMovieForm()">➕ Add Movie</button>
        </div>
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead>
                    <tr><th>ID</th><th>Movie</th><th>Director</th><th>Genre</th><th>Status</th><th>Price</th><th>Rating</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${APP_DATA.movies.map(m => `
                        <tr>
                            <td>${m.id}</td>
                            <td><div class="admin-movie-cell">${m.poster ? `<img src="${m.poster}" onerror="this.style.display='none'" alt="">` : '<span class="movie-no-poster">🎬</span>'}<span>${m.title}</span></div></td>
                            <td>${m.director}</td>
                            <td>${(m.genre || []).join(', ')}</td>
                            <td><span class="booking-status ${m.status}">${m.status ? m.status.replace('_', ' ') : 'n/a'}</span></td>
                            <td>${formatLKR(m.basePrice)}</td>
                            <td>⭐ ${m.rating || '—'}</td>
                            <td class="admin-actions">
                                <button class="btn btn-sm admin-edit-btn" onclick="openMovieForm(${m.id})">✏️ Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteMovie(${m.id})">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

function openMovieForm(id) {
    const m = id ? getMovieById(id) : null;
    openModal(`
        <div class="admin-form">
            <h2>${m ? '✏️ Edit Movie' : '➕ Add New Movie'}</h2>
            <div class="form-row">
                <div class="form-group"><label>Title</label><input class="form-input" id="mvTitle" value="${m ? m.title : ''}"></div>
                <div class="form-group"><label>Director</label><input class="form-input" id="mvDirector" value="${m ? m.director : ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Cast (comma separated)</label><input class="form-input" id="mvCast" value="${m ? m.cast.join(', ') : ''}"></div>
                <div class="form-group"><label>Genres (comma separated)</label><input class="form-input" id="mvGenre" value="${m ? m.genre.join(', ') : ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Duration (minutes)</label><input class="form-input" type="number" id="mvDuration" value="${m ? m.duration : ''}"></div>
                <div class="form-group"><label>Rating</label><input class="form-input" type="number" step="0.1" id="mvRating" value="${m ? m.rating : ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Language</label><input class="form-input" id="mvLang" value="${m ? m.language : ''}"></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="mvStatus">
                    <option value="now_showing" ${m && m.status === 'now_showing' ? 'selected' : ''}>Now Showing</option>
                    <option value="coming_soon" ${m && m.status === 'coming_soon' ? 'selected' : ''}>Coming Soon</option>
                </select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Base Price (LKR)</label><input class="form-input" type="number" id="mvPrice" value="${m ? m.basePrice : ''}"></div>
                <div class="form-group"><label>Release Date</label><input class="form-input" type="date" id="mvDate" value="${m ? m.releaseDate : ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group" style="grid-column:span 2"><label>Poster URL</label><input class="form-input" id="mvPoster" value="${m ? m.poster : ''}"></div>
            </div>
            <div class="form-row">
                <div class="form-group" style="grid-column:span 2"><label>Description</label><textarea class="form-input" id="mvDesc" rows="3">${m ? m.description : ''}</textarea></div>
            </div>
            <div class="admin-form-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveMovie(${m ? m.id : 'null'})">${m ? 'Save Changes' : 'Add Movie'}</button>
            </div>
        </div>
    `);
}

function saveMovie(id) {
    const val = el => document.getElementById(el).value.trim();
    const title = val('mvTitle');
    if (!title) { alert('Please enter a movie title'); return; }

    const movie = {
        title,
        director: val('mvDirector') || 'Unknown',
        cast: val('mvCast').split(',').map(s => s.trim()).filter(Boolean),
        genre: val('mvGenre').split(',').map(s => s.trim()).filter(Boolean),
        duration: parseInt(val('mvDuration')) || 120,
        rating: parseFloat(val('mvRating')) || 7,
        language: val('mvLang') || 'English',
        status: document.getElementById('mvStatus').value,
        basePrice: parseInt(val('mvPrice')) || 1000,
        releaseDate: val('mvDate') || '2026-01-01',
        poster: val('mvPoster'),
        description: val('mvDesc'),
        posterGradient: ['#006994', '#00CED1'],
        formats: ['3D'],
        popularity: 60,
        featured: false,
        subtitles: ['English']
    };

    if (id) {
        const idx = APP_DATA.movies.findIndex(m => m.id === id);
        if (idx !== -1) APP_DATA.movies[idx] = { ...APP_DATA.movies[idx], ...movie };
        alert('Movie updated successfully ✅');
    } else {
        movie.id = Math.max(...APP_DATA.movies.map(m => m.id)) + 1;
        APP_DATA.movies.push(movie);
        alert('Movie added successfully ✅');
    }
    closeModal();
    renderAdminSection('movies');
}

function deleteMovie(id) {
    if (!confirm('Delete this movie "' + (getMovieById(id) || {}).title + '"? This cannot be undone.')) return;
    APP_DATA.movies = APP_DATA.movies.filter(m => m.id !== id);
    renderAdminSection('movies');
}

/* ---- ADMIN: BOOKINGS ---- */
function renderAdminBookingsSection() {
    const bookings = [...APP_DATA.bookings].reverse();
    const totalRevenue = APP_DATA.bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
    const activeCount = APP_DATA.bookings.filter(b => b.status === 'confirmed').length;
    return `
        <div class="admin-toolbar">
            <div>
                <span class="admin-count">${bookings.length} bookings</span>
                <span class="admin-count">Active: ${activeCount}</span>
                <span class="admin-count">Revenue: ${formatLKR(totalRevenue)}</span>
            </div>
        </div>
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead>
                    <tr><th>Booking</th><th>Customer</th><th>Movie</th><th>Date / Time</th><th>Seats</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${bookings.length ? bookings.map(b => {
                        const movie = getMovieById(b.movieId);
                        const user = APP_DATA.users.find(u => u.id === b.userId);
                        const cinema = getCinemaById(b.cinemaId);
                        return `<tr>
                            <td>${b.id}<div class="booking-sub">${cinema ? cinema.name : ''}</div></td>
                            <td>${user ? user.name : 'User #' + b.userId}</td>
                            <td>${movie ? movie.title : 'Movie #' + b.movieId}</td>
                            <td>${b.date}<div class="booking-sub">${b.showtime}</div></td>
                            <td>${(b.seats || []).join(', ')}</td>
                            <td>${formatLKR(b.totalAmount || 0)}</td>
                            <td><span class="booking-status ${b.status}">${(b.status || 'confirmed').toUpperCase()}</span></td>
                            <td class="admin-actions">
                                ${b.status === 'confirmed'
                                    ? `<button class="btn btn-sm btn-danger" onclick="cancelBooking('${b.id}')">✕ Cancel</button>`
                                    : `<span style="color:var(--text-muted)">—</span>`}
                            </td>
                        </tr>`;
                    }).join('') : `
                        <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No bookings found</td></tr>
                    `}
                </tbody>
            </table>
        </div>`;
}

function cancelBooking(id) {
    if (!confirm('Cancel booking ' + id + '?')) return;
    const b = APP_DATA.bookings.find(x => x.id === id);
    if (b) b.status = 'cancelled';
    renderAdminSection('bookings');
}

/* ---- ADMIN: CUSTOMERS ---- */
function renderAdminCustomersSection() {
    return `
        <div class="admin-toolbar">
            <div><span class="admin-count">${APP_DATA.users.length} customers</span></div>
        </div>
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead>
                    <tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Bookings</th><th>Total Spent</th></tr>
                </thead>
                <tbody>
                    ${APP_DATA.users.map(u => {
                        const bookings = APP_DATA.bookings.filter(b => b.userId === u.id && b.status !== 'cancelled');
                        const total = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
                        return `<tr>
                            <td><div class="admin-customer-cell"><span class="admin-avatar">${u.avatar}</span><span>${u.name}</span></div></td>
                            <td>${u.email}</td>
                            <td>${u.phone}</td>
                            <td><span class="booking-status ${u.role}">${u.role}</span></td>
                            <td>${bookings.length}</td>
                            <td>${formatLKR(total)}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

/* ---- ADMIN: SHOWTIMES ---- */
function renderAdminShowtimesSection() {
    let rows = [];
    Object.entries(APP_DATA.showtimes).forEach(([movieId, cinemas]) => {
        Object.entries(cinemas).forEach(([cinemaId, halls]) => {
            Object.entries(halls).forEach(([hallId, times]) => {
                const mid = parseInt(movieId), cid = parseInt(cinemaId), hid = parseInt(hallId);
                if (!Array.isArray(times) || times.length === 0) return;
                rows.push({
                    movieId: mid, cinemaId: cid, hallId: hid,
                    movie: getMovieById(mid), cinema: getCinemaById(cid), hall: getHallById(cid, hid),
                    times
                });
            });
        });
    });
    if (!rows.length) {
        return `<div class="empty-state" style="padding:60px 0"><div class="empty-state-icon">🕐</div><h3>No showtimes yet</h3><p>Add your first showtime to get started</p></div>`;
    }
    return `
        <div class="admin-toolbar">
            <div><span class="admin-count">${rows.length} schedules</span></div>
            <button class="btn btn-primary" onclick="openShowtimeForm()">➕ Add Showtime</button>
        </div>
        <div class="showtime-admin-grid">
            ${rows.map(r => `
                <div class="showtime-admin-card">
                    <div class="showtime-card-head">
                        <div class="showtime-card-title">
                            <strong>${r.movie ? r.movie.title : 'Movie #' + r.movieId}</strong>
                            <span>${r.cinema ? r.cinema.name : 'Cinema'} • ${r.hall ? r.hall.name : 'Hall'}</span>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="deleteShowtime(${r.movieId}, ${r.cinemaId}, ${r.hallId})">🗑️</button>
                    </div>
                    <div class="showtime-chips">
                        ${r.times.map((t, i) => `
                            <span class="showtime-chip">
                                ${t.time} <small>(${t.available})</small>
                                <button class="chip-del" onclick="removeShowtimeSlot(${r.movieId}, ${r.cinemaId}, ${r.hallId}, ${i})" title="Remove slot">×</button>
                            </span>`).join('')}
                    </div>
                    <button class="btn btn-sm admin-add-slot" onclick="addShowtimeSlot(${r.movieId}, ${r.cinemaId}, ${r.hallId})">＋ Add Time Slot</button>
                </div>
            `).join('')}
        </div>`;
}

function openShowtimeForm() {
    openModal(`
        <div class="admin-form">
            <h2>➕ Add Showtime</h2>
            <div class="form-row">
                <div class="form-group"><label>Movie</label><select class="form-input" id="stMovie">${APP_DATA.movies.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}</select></div>
                <div class="form-group"><label>Cinema</label><select class="form-input" id="stCinema" onchange="renderHallOptions()">${APP_DATA.cinemas.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Hall</label><select class="form-input" id="stHall"></select></div>
                <div class="form-group"><label>Available Seats</label><input class="form-input" type="number" id="stAvail" value="40"></div>
            </div>
            <div class="form-row">
                <div class="form-group" style="grid-column:span 2"><label>Time Slots (comma separated, e.g. 10:30 AM, 1:30 PM)</label><input class="form-input" id="stTimes" placeholder="10:30 AM, 1:30 PM, 7:30 PM"></div>
            </div>
            <div class="admin-form-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveShowtime()">Add Showtime</button>
            </div>
        </div>
    `);
    renderHallOptions();
}

function renderHallOptions() {
    const el = document.getElementById('stHall');
    if (!el) return;
    const cinemaId = parseInt(document.getElementById('stCinema').value);
    const cinema = getCinemaById(cinemaId);
    el.innerHTML = cinema ? cinema.halls.map(h => `<option value="${h.id}">${h.name} (${h.type})</option>`).join('') : '';
}

function saveShowtime() {
    const movieId = parseInt(document.getElementById('stMovie').value);
    const cinemaId = parseInt(document.getElementById('stCinema').value);
    const hallId = parseInt(document.getElementById('stHall').value);
    const avail = parseInt(document.getElementById('stAvail').value) || 40;
    const raw = document.getElementById('stTimes').value;
    const times = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (!times.length) { alert('Please enter at least one time slot'); return; }

    if (!APP_DATA.showtimes[movieId]) APP_DATA.showtimes[movieId] = {};
    if (!APP_DATA.showtimes[movieId][cinemaId]) APP_DATA.showtimes[movieId][cinemaId] = {};
    if (!APP_DATA.showtimes[movieId][cinemaId][hallId]) APP_DATA.showtimes[movieId][cinemaId][hallId] = [];

    times.forEach(t => {
        APP_DATA.showtimes[movieId][cinemaId][hallId].push({ time: t, available: avail });
    });
    closeModal();
    renderAdminSection('showtimes');
}

function addShowtimeSlot(movieId, cinemaId, hallId) {
    openModal(`
        <div class="admin-form">
            <h2>Add Time Slot</h2>
            <div class="form-row">
                <div class="form-group"><label>Time</label><input class="form-input" id="slotTime" placeholder="e.g. 6:00 PM"></div>
                <div class="form-group"><label>Available Seats</label><input class="form-input" type="number" id="slotAvail" value="40"></div>
            </div>
            <div class="admin-form-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveShowtimeSlot(${movieId}, ${cinemaId}, ${hallId})">Add</button>
            </div>
        </div>
    `);
}

function saveShowtimeSlot(movieId, cinemaId, hallId) {
    const time = document.getElementById('slotTime').value.trim();
    const avail = parseInt(document.getElementById('slotAvail').value) || 40;
    if (!time) { alert('Please enter a time'); return; }
    if (!APP_DATA.showtimes[movieId] || !APP_DATA.showtimes[movieId][cinemaId] || !APP_DATA.showtimes[movieId][cinemaId][hallId]) {
        alert('Schedule not found');
        return;
    }
    APP_DATA.showtimes[movieId][cinemaId][hallId].push({ time, available: avail });
    closeModal();
    renderAdminSection('showtimes');
}

function removeShowtimeSlot(movieId, cinemaId, hallId, index) {
    if (!APP_DATA.showtimes[movieId] || !APP_DATA.showtimes[movieId][cinemaId] || !APP_DATA.showtimes[movieId][cinemaId][hallId]) return;
    APP_DATA.showtimes[movieId][cinemaId][hallId].splice(index, 1);
    renderAdminSection('showtimes');
}

function deleteShowtime(movieId, cinemaId, hallId) {
    if (!confirm('Remove all time slots for this schedule?')) return;
    if (APP_DATA.showtimes[movieId] && APP_DATA.showtimes[movieId][cinemaId]) {
        delete APP_DATA.showtimes[movieId][cinemaId][hallId];
    }
    renderAdminSection('showtimes');
}

/* ---- ADMIN: OFFERS ---- */
function renderAdminOffersSection() {
    return `
        <div class="admin-toolbar">
            <div><span class="admin-count">${APP_DATA.offers.length} active offers</span></div>
            <button class="btn btn-primary" onclick="openOfferForm()">➕ Add Offer</button>
        </div>
        <div class="offer-admin-grid">
            ${APP_DATA.offers.map(o => `
                <div class="offer-admin-card">
                    <div class="offer-admin-head">
                        <div class="offer-admin-icon" style="background:${o.color}1a">${o.icon}</div>
                        <button class="btn btn-sm btn-danger" onclick="deleteOffer(${o.id})">🗑️</button>
                    </div>
                    <h4>${o.title}</h4>
                    <p>${o.description}</p>
                    <div class="offer-admin-meta">
                        <span>Code: <strong>${o.code}</strong></span>
                        <span>${o.discount > 0 ? 'Save ' + o.discount + (o.type === 'percentage' ? '%' : '') : o.type === 'bundle' ? 'Bundle deal' : o.type === 'upgrade' ? 'Upgrade offer' : 'Offer'}</span>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

function openOfferForm() {
    openModal(`
        <div class="admin-form">
            <h2>➕ Add New Offer</h2>
            <div class="form-row">
                <div class="form-group"><label>Title</label><input class="form-input" id="ofTitle" placeholder="e.g. STUDENT OFFER"></div>
                <div class="form-group"><label>Promo Code</label><input class="form-input" id="ofCode" placeholder="e.g. STUDENT20"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Discount</label><input class="form-input" type="number" id="ofDiscount" value="0"></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="ofType">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (LKR)</option>
                    <option value="bundle">Bundle</option>
                    <option value="upgrade">Upgrade</option>
                </select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Icon (emoji)</label><input class="form-input" id="ofIcon" value="🎁"></div>
                <div class="form-group"><label>Accent Color</label><input class="form-input" type="color" id="ofColor" value="#DC143C"></div>
            </div>
            <div class="form-row">
                <div class="form-group" style="grid-column:span 2"><label>Description</label><textarea class="form-input" id="ofDesc" rows="2" placeholder="Describe the offer"></textarea></div>
            </div>
            <div class="admin-form-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveOffer()">Add Offer</button>
            </div>
        </div>
    `);
}

function saveOffer() {
    const title = document.getElementById('ofTitle').value.trim();
    const code = document.getElementById('ofCode').value.trim().toUpperCase();
    if (!title || !code) { alert('Title and promo code are required'); return; }

    APP_DATA.offers.push({
        id: Math.max(...APP_DATA.offers.map(o => o.id)) + 1,
        title,
        description: document.getElementById('ofDesc').value.trim() || 'No description provided',
        discount: parseInt(document.getElementById('ofDiscount').value) || 0,
        code,
        type: document.getElementById('ofType').value,
        icon: document.getElementById('ofIcon').value || '🎁',
        color: document.getElementById('ofColor').value || '#DC143C',
        validFrom: '2026-09-01',
        validTo: '2026-12-31'
    });
    closeModal();
    renderAdminSection('offers');
}

function deleteOffer(id) {
    if (!confirm('Delete this offer?')) return;
    APP_DATA.offers = APP_DATA.offers.filter(o => o.id !== id);
    renderAdminSection('offers');
}

/* ---- ADMIN: CINEMAS ---- */
function renderAdminCinemasSection() {
    return `
        <div class="cinema-admin-grid">
            ${APP_DATA.cinemas.map(c => `
                <div class="cinema-admin-card">
                    <div class="cinema-admin-head">
                        <h4>${c.name}</h4>
                        <span class="booking-status now_showing">${c.halls.length} halls</span>
                    </div>
                    <p>📍 ${c.address}</p>
                    <p>📞 ${c.phone} &nbsp; ✉️ ${c.email}</p>
                    <p>🕒 ${c.openingHours}</p>
                    <div class="cinema-features">
                        ${c.features.map(f => `<span class="genre-tag">${f}</span>`).join('')}
                    </div>
                    <div class="hall-list">
                        ${c.halls.map(h => `
                            <div class="hall-chip">
                                <strong>${h.name}</strong>
                                <span>${h.type} • ${h.capacity} seats • ${h.layout}</span>
                            </div>
                            <div style="margin-left:12px;margin-bottom:10px;font-size:12px;color:var(--text-secondary)">
                                ${h.amenities.join(' • ')}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>`;
}

/* ---- LOGIN ---- */
function renderLogin() {
    document.getElementById('mainFooter').style.display = '';

    const tab = App.loginRole || 'user';
    const demo = tab === 'admin'
        ? { email: 'chamuditha@email.com', pass: 'admin123' }
        : { email: 'kasun@email.com', pass: 'user123' };

    document.getElementById('app').innerHTML = `
        <div class="login-page">
            <div class="login-card">
                <div class="login-logo">🎬 CINEMA<span class="logo-accent">MAX</span></div>
                <h2>Welcome Back</h2>
                <p class="subtitle">Sign in to continue</p>

                <div class="login-tabs">
                    <button class="login-tab ${tab === 'user' ? 'active' : ''}" onclick="switchLoginTab(this, 'user')">👤 User Login</button>
                    <button class="login-tab ${tab === 'admin' ? 'active' : ''}" onclick="switchLoginTab(this, 'admin')">🧑‍💼 Admin Login</button>
                </div>

                <div class="login-role-badge ${tab}">${tab === 'admin' ? '🔐 Admin Access' : '✋ Customer Access'}</div>

                <div id="loginForm">
                    <div class="form-group">
                        <label>Email Address</label>
                        <input class="form-input" type="email" placeholder="Enter your email" id="loginEmail" value="${demo.email}">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input class="form-input" type="password" placeholder="Enter your password" id="loginPassword" value="${demo.pass}">
                    </div>
                    <div class="login-error" id="loginError"></div>
                    <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px" onclick="handleLogin('${tab}')">${tab === 'admin' ? 'Sign In as Admin' : 'Sign In'}</button>
                </div>

                <div class="demo-box">
                    <div class="demo-box-title">🔎 Demo Accounts</div>
                    <div class="demo-row ${tab === 'user' ? 'active' : ''}" onclick="switchLoginTab(this, 'user')">
                        <span>👤 Customer</span><span><strong>kasun@email.com</strong> / user123</span>
                    </div>
                    <div class="demo-row ${tab === 'admin' ? 'active' : ''}" onclick="switchLoginTab(this, 'admin')">
                        <span>🧑‍💼 Admin</span><span><strong>chamuditha@email.com</strong> / admin123</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function switchLoginTab(btn, tab) {
    document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    App.loginRole = tab;
    renderLogin();
}

function handleLogin(role) {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    const user = APP_DATA.users.find(u => u.email.toLowerCase() === email);

    if (!user) {
        if (errorEl) errorEl.textContent = '⚠️ No account found with this email';
        return;
    }
    if (user.password !== password) {
        if (errorEl) errorEl.textContent = '⚠️ Incorrect password';
        return;
    }
    const expectedRole = role || 'user';
    if (user.role !== expectedRole) {
        if (errorEl) errorEl.textContent = expectedRole === 'admin'
            ? '⚠️ This account is not an admin. Use the User Login tab.'
            : '⚠️ This is an admin account. Use the Admin Login tab.';
        return;
    }

    App.currentUser = user;
    localStorage.setItem('cinemax-session', JSON.stringify({ id: user.id }));
    updateNavUser();

    if (user.role === 'admin') {
        navigate('admin');
    } else {
        navigate('dashboard');
    }
}

/* ---- CINEMAS PAGE ---- */
function renderCinemasPage() {
    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <section class="section">
            <div class="section-header">
                <div>
                    <h2 class="section-title">🏢 Our Cinemas</h2>
                    <p class="section-subtitle">${APP_DATA.cinemas.length} cinema locations across Sri Lanka</p>
                </div>
            </div>
            <div class="cinemas-list">
                ${APP_DATA.cinemas.map(c => `
                    <div class="cinema-detail-card">
                        <div class="cinema-detail-cover" style="background:linear-gradient(135deg,var(--accent),#8b0000)">
                            <img src="${c.image}" alt="${c.name}" loading="lazy" onerror="this.style.display='none'">
                            <div class="cinema-detail-header">
                                <div>
                                    <h3>${c.name}</h3>
                                    <p class="cinema-detail-location">📍 ${c.location}</p>
                                </div>
                            </div>
                        </div>
                        <div class="cinema-detail-body">
                            <div class="cinema-detail-info">
                                <div class="cinema-info-item">📍 <span>${c.address}</span></div>
                                <div class="cinema-info-item">📞 <span>${c.phone}</span></div>
                                <div class="cinema-info-item">✉️ <span>${c.email}</span></div>
                                <div class="cinema-info-item">🕒 <span>${c.openingHours}</span></div>
                            </div>
                            <div class="cinema-features">
                                ${c.features.map(f => `<span class="cinema-feature-tag">${f}</span>`).join('')}
                            </div>
                            <h4 class="cinema-halls-title">Cinema Halls (${c.halls.length})</h4>
                            <div class="halls-grid">
                                ${c.halls.map(h => `
                                    <div class="hall-card">
                                        <div class="hall-media" style="background:linear-gradient(135deg,${h.type==='IMAX'?'#1a1a2e,#e94560':h.type==='4DX'?'#c0392b,#8e44ad':h.type==='VIP'?'#f39c12,#e67e22':'#2c3e50,#3498db'})">
                                            <img src="${h.image}" alt="${h.name}" loading="lazy" onerror="this.style.display='none'">
                                            <div class="hall-type-badge">${h.type}</div>
                                        </div>
                                        <div class="hall-card-body">
                                            <div class="hall-card-title"><strong>${h.name}</strong><span class="hall-seats">👥 ${h.capacity}</span></div>
                                            <div class="hall-layout">📐 Layout: ${h.layout}</div>
                                            <div class="hall-amenities">
                                                ${h.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

/* ---- OFFERS PAGE ---- */
function renderOffersPage() {
    document.getElementById('mainFooter').style.display = '';

    const active = APP_DATA.offers.filter(o => getOfferStatus(o).state !== 'expired').length;
    const expiring = APP_DATA.offers.filter(o => getOfferStatus(o).state === 'expiring').length;
    const biggest = APP_DATA.offers
        .filter(o => o.discount > 0)
        .reduce((m, o) => Math.max(m, o.discount), 0);

    const filter = App.offerFilter || 'all';
    let list;
    if (filter === 'all') list = APP_DATA.offers;
    else if (filter === 'active') list = APP_DATA.offers.filter(o => getOfferStatus(o).state !== 'expired');
    else list = APP_DATA.offers.filter(o => o.type === filter);

    document.getElementById('app').innerHTML = `
        <section class="section">
            <div class="section-header">
                <div>
                    <h2 class="section-title">🎁 Special Offers</h2>
                    <p class="section-subtitle">Exclusive deals and promotions at CinemaMax</p>
                </div>
            </div>

            <div class="offer-stats">
                <div class="offer-stat"><span class="offer-stat-num">${active}</span><span class="offer-stat-label">Active Offers</span></div>
                <div class="offer-stat"><span class="offer-stat-num">${expiring}</span><span class="offer-stat-label">Ending Soon</span></div>
                <div class="offer-stat"><span class="offer-stat-num">${biggest}%</span><span class="offer-stat-label">Biggest Saving</span></div>
                <div class="offer-stat"><span class="offer-stat-num">🎥</span><span class="offer-stat-label">Applies on Tickets</span></div>
            </div>

            <div class="redeem-box">
                <div class="redeem-box-title">🎟️ Redeem Your Promo Code</div>
                <div class="redeem-row">
                    <input class="form-input redeem-input" type="text" placeholder="Enter code e.g. STUDENT20" id="redeemCode">
                    <button class="btn btn-primary" onclick="redeemOffer()">Apply Code</button>
                </div>
                <div id="redeemResult"></div>
            </div>

            <div class="offer-filter-bar">
                <button class="offer-filter-chip active" onclick="filterOffers(this, 'all')">All</button>
                <button class="offer-filter-chip" onclick="filterOffers(this, 'active')">Live Now</button>
                <button class="offer-filter-chip" onclick="filterOffers(this, 'percentage')">% Off</button>
                <button class="offer-filter-chip" onclick="filterOffers(this, 'fixed')">Fixed Price</button>
                <button class="offer-filter-chip" onclick="filterOffers(this, 'bundle')">Bundles</button>
                <button class="offer-filter-chip" onclick="filterOffers(this, 'upgrade')">Upgrades</button>
            </div>

            <div class="offers-grid" id="offerGrid">
                ${list.map(renderOfferCard).join('')}
            </div>

            <div class="offer-toast" id="offerToast"></div>
        </section>
    `;
}

/* ---- CONTACT ---- */
function renderContact() {
    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <section class="section">
            <div class="section-header">
                <div>
                    <h2 class="section-title">📞 Contact Us</h2>
                    <p class="section-subtitle">We'd love to hear from you — reach out any time</p>
                </div>
            </div>

            <div class="contact-grid">
                <div class="contact-card">
                    <div class="contact-icon">📞</div>
                    <h3>Call Us</h3>
                    <p class="contact-value">+94 11 234 5678</p>
                    <p class="contact-note">Hotline open 9 AM – 11 PM daily</p>
                </div>
                <div class="contact-card">
                    <div class="contact-icon">📧</div>
                    <h3>Email Us</h3>
                    <p class="contact-value">info@cinemamax.lk</p>
                    <p class="contact-note">We reply within 24 hours</p>
                </div>
                <div class="contact-card">
                    <div class="contact-icon">📍</div>
                    <h3>Visit Us</h3>
                    <p class="contact-value">Galle Road, Colombo 03</p>
                    <p class="contact-note">Head office headquarters</p>
                </div>
                <div class="contact-card">
                    <div class="contact-icon">🕒</div>
                    <h3>Opening Hours</h3>
                    <p class="contact-value">10:00 AM – 11:30 PM</p>
                    <p class="contact-note">Open every day incl. holidays</p>
                </div>
            </div>

            <div class="contact-social-section">
                <h3 class="contact-social-title">Follow Us on Social Media</h3>
                <div class="contact-socials">
                    <a href="#" target="_blank" rel="noopener" class="contact-social-btn fb"><span class="social-emoji">📘</span><span class="social-name">Facebook</span><span class="social-handle">@cinemax.lk</span></a>
                    <a href="#" target="_blank" rel="noopener" class="contact-social-btn ig"><span class="social-emoji">📸</span><span class="social-name">Instagram</span><span class="social-handle">@cinemax_srilanka</span></a>
                    <a href="#" target="_blank" rel="noopener" class="contact-social-btn x"><span class="social-emoji">𝕏</span><span class="social-name">X / Twitter</span><span class="social-handle">@cinemaxLK</span></a>
                    <a href="#" target="_blank" rel="noopener" class="contact-social-btn yt"><span class="social-emoji">▶️</span><span class="social-name">YouTube</span><span class="social-handle">CinemaMax TV</span></a>
                    <a href="#" target="_blank" rel="noopener" class="contact-social-btn tt"><span class="social-emoji">🎵</span><span class="social-name">TikTok</span><span class="social-handle">@cinemax.lk</span></a>
                </div>
            </div>

            <div class="contact-form-section">
                <h3 class="contact-social-title">Send Us a Message</h3>
                <form class="contact-form" onsubmit="submitContact(event)">
                    <div class="form-row">
                        <div class="form-group"><label>Your Name</label><input class="form-input" type="text" id="ctName" placeholder="Enter your name" required></div>
                        <div class="form-group"><label>Email Address</label><input class="form-input" type="email" id="ctEmail" placeholder="Enter your email" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="grid-column:span 2"><label>Subject</label><input class="form-input" type="text" id="ctSubject" placeholder="What's this about?"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="grid-column:span 2"><label>Message</label><textarea class="form-input" id="ctMsg" rows="4" placeholder="Write your message..." required></textarea></div>
                    </div>
                    <button type="submit" class="btn btn-primary">✉️ Send Message</button>
                    <div class="contact-form-result" id="ctResult"></div>
                </form>
            </div>
        </section>
    `;
}

function submitContact(e) {
    e.preventDefault();
    const name = document.getElementById('ctName').value.trim();
    const email = document.getElementById('ctEmail').value.trim();
    const msg = document.getElementById('ctMsg').value.trim();
    const result = document.getElementById('ctResult');
    if (!name || !email || !msg) {
        if (result) result.innerHTML = '<span class="redeem-error">⚠️ Please fill in all required fields</span>';
        return;
    }
    if (result) {
        result.innerHTML = `<span class="redeem-success">✅ Thank you, ${name}! Your message has been sent. Our team will reply to ${email} within 24 hours.</span>`;
    }
    if (e.target) e.target.reset();
}

/* ---- WATCHLIST ---- */
function renderWatchlist() {
    const movies = APP_DATA.watchlist.map(id => getMovieById(id)).filter(Boolean);

    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <div class="watchlist-page">
            <div class="section-header">
                <div>
                    <h2 class="section-title">❤️ My Watchlist</h2>
                    <p class="section-subtitle">${movies.length} movies saved</p>
                </div>
            </div>
            ${movies.length ? `
                <div class="movie-grid">${movies.map(m => renderMovieCard(m)).join('')}</div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">❤️</div>
                    <h3>Your watchlist is empty</h3>
                    <p>Save movies you want to watch later</p>
                    <button class="btn btn-primary" onclick="navigate('movies')">Browse Movies</button>
                </div>
            `}
        </div>
    `;
}

/* ---- BOOKING HISTORY ---- */
function renderHistory() {
    const bookings = APP_DATA.bookings;

    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <div class="watchlist-page">
            <div class="section-header">
                <div>
                    <h2 class="section-title">📜 Booking History</h2>
                    <p class="section-subtitle">${bookings.length} bookings</p>
                </div>
            </div>
            <div class="booking-cards">
                ${bookings.map(b => {
                    const movie = getMovieById(b.movieId);
                    const cinema = getCinemaById(b.cinemaId) || getCinemaById(1);
                    return `
                    <div class="booking-card">
                        <div class="booking-card-poster">
                            ${movie && movie.poster 
                                ? `<img src="${movie.poster}" alt="${movie.title}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="movie-poster-gradient" style="display:none;background:linear-gradient(135deg,${movie.posterGradient[0]},${movie.posterGradient[1]});font-size:16px">${movie.title.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>`
                                : `<div class="movie-poster-gradient" style="background:linear-gradient(135deg,${movie ? movie.posterGradient[0] : '#333'},${movie ? movie.posterGradient[1] : '#666'});font-size:16px">${movie ? movie.title.split(' ').slice(0,2).map(w=>w[0]).join('') : '🎬'}</div>`
                            }
                        </div>
                        <div class="booking-card-info">
                            <h4>${movie ? movie.title : 'Movie'}</h4>
                            <div class="booking-card-detail">📅 ${b.date}</div>
                            <div class="booking-card-detail">🕐 ${b.showtime}</div>
                            <div class="booking-card-detail">📍 ${cinema.name}</div>
                            <div class="booking-card-detail">💺 ${b.seats.join(', ')}</div>
                            <div class="booking-card-detail">💰 ${formatLKR(b.totalAmount || 0)}</div>
                            <span class="booking-status ${b.status}">${(b.status || 'confirmed').charAt(0).toUpperCase() + (b.status || 'confirmed').slice(1)}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `;
}

/* ---- SEARCH ---- */
function renderSearchResults() {
    const q = App.searchQuery.toLowerCase();
    const results = APP_DATA.movies.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.genre.some(g => g.toLowerCase().includes(q)) ||
        m.language.toLowerCase().includes(q) ||
        (Array.isArray(m.cast) && m.cast.some(c => c.toLowerCase().includes(q)))
    );

    document.getElementById('mainFooter').style.display = '';

    document.getElementById('app').innerHTML = `
        <div class="search-results">
            <div class="search-header">
                <h1>Search Results</h1>
                <p>${results.length} results for "${App.searchQuery}"</p>
            </div>
            <div class="filter-bar">
                <button class="filter-chip active">All</button>
                <button class="filter-chip">Genre</button>
                <button class="filter-chip">Language</button>
                <button class="filter-chip">Rating</button>
            </div>
            ${results.length ? `
                <div class="movie-grid">${results.map(m => renderMovieCard(m)).join('')}</div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try a different search term</p>
                </div>
            `}
        </div>
    `;
}

/* ---- MODAL ---- */
function openModal(content) {
    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('modal').classList.add('show');
    document.getElementById('modal').innerHTML = content;
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('modal').classList.remove('show');
}

/* ---- THEME ---- */
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('cinemax-theme', next);
}

function loadSavedTheme() {
    const saved = localStorage.getItem('cinemax-theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    }
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
    const saved = localStorage.getItem('cinemax-session');
    if (saved) {
        try {
            const s = JSON.parse(saved);
            App.currentUser = APP_DATA.users.find(u => u.id === s.id) || APP_DATA.users[0];
        } catch (e) {
            App.currentUser = APP_DATA.users[0];
        }
    } else {
        App.currentUser = APP_DATA.users[0];
    }
    App.selectedDate = getDates()[0];
    initNav();
    updateNavUser();
    renderNotifications();
});
