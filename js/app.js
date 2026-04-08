/* ============================================================
   Festival Radar – Main Application Logic
   ============================================================ */

'use strict';

/* ── State ─────────────────────────────────────────────────── */
let map = null;
let userMarker = null;
let radiusCircle = null;
let festivalMarkers = [];
let userCoords = null;   // { lat, lng, label }

/* ── DOM refs ───────────────────────────────────────────────── */
const plzInput         = document.getElementById('plz-input');
const searchBtn        = document.getElementById('search-btn');
const radiusSlider     = document.getElementById('radius-slider');
const radiusDisplay    = document.getElementById('radius-value');
const timeFilter       = document.getElementById('time-filter');
const resultsSection   = document.getElementById('results-section');
const festivalGrid     = document.getElementById('festival-grid');
const resultsTitle     = document.getElementById('results-title');
const toggleOptionsBtn = document.getElementById('toggle-options');
const optionsGrid      = document.getElementById('options-grid');
const genreContainer   = document.getElementById('genre-filters');

/* ── Genre colours ──────────────────────────────────────────── */
const GENRE_COLOURS = {
    'Rock':        '#ef4444',
    'Metal':       '#9ca3af',
    'Alternative': '#8b5cf6',
    'Pop':         '#ec4899',
    'Electronic':  '#3b82f6',
    'EDM':         '#6366f1',
    'Techno':      '#06b6d4',
    'House':       '#0ea5e9',
    'Hip-Hop':     '#f59e0b',
    'Reggae':      '#10b981',
    'Indie':       '#84cc16',
    'Folk':        '#a8a29e',
    'Gothic':      '#a855f7',
    'Hardcore':    '#dc2626',
    'Schlager':    '#f472b6',
};

function genreColour(genre) {
    return GENRE_COLOURS[genre] || '#64748b';
}

/* ── Genre filter setup ─────────────────────────────────────── */
function initGenres() {
    const genres = [...new Set(FESTIVALS.flatMap(f => f.genres))].sort();
    genres.forEach(genre => {
        const label = document.createElement('label');
        label.className = 'genre-chip';
        label.innerHTML =
            `<input type="checkbox" value="${genre}" checked><span>${genre}</span>`;
        genreContainer.appendChild(label);

        // Keep visual state in sync
        const cb = label.querySelector('input');
        cb.addEventListener('change', () => {
            label.classList.toggle('is-active', cb.checked);
            if (userCoords) updateResults();
        });
        label.classList.add('is-active'); // start checked
    });
}

document.getElementById('select-all-genres').addEventListener('click', () => {
    genreContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        cb.closest('.genre-chip').classList.add('is-active');
    });
    if (userCoords) updateResults();
});

document.getElementById('deselect-all-genres').addEventListener('click', () => {
    genreContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.genre-chip').classList.remove('is-active');
    });
    if (userCoords) updateResults();
});

/* ── Collapsible options ────────────────────────────────────── */
toggleOptionsBtn.addEventListener('click', () => {
    const isOpen = optionsGrid.classList.toggle('is-hidden');
    toggleOptionsBtn.textContent = isOpen ? 'Einblenden ▼' : 'Ausblenden ▲';
    toggleOptionsBtn.setAttribute('aria-expanded', String(!isOpen));
});

/* ── Haversine distance (km) ────────────────────────────────── */
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Date helpers ────────────────────────────────────────────── */
function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
}

function parseDateEnd(dateStr) {
    return new Date(dateStr + 'T23:59:59');
}

function formatDateRange(start, end) {
    const s = parseDate(start);
    const e = parseDate(end);
    const fmt = d => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (start === end) return fmt(s);
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        return `${s.getDate()}.–${e.getDate()}. ${e.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
    }
    return `${fmt(s)} – ${fmt(e)}`;
}

/* ── Filter festivals ────────────────────────────────────────── */
function getSelectedGenres() {
    return [...genreContainer.querySelectorAll('input:checked')].map(cb => cb.value);
}

function filterFestivals() {
    if (!userCoords) return [];

    const radius        = parseInt(radiusSlider.value, 10);
    const weeks         = parseInt(timeFilter.value,   10);
    const selectedGenres = getSelectedGenres();
    const now     = new Date();
    const horizon = new Date(now.getTime() + weeks * 7 * 24 * 3600 * 1000);

    return FESTIVALS
        .map(f => ({ ...f, distance: Math.round(haversine(userCoords.lat, userCoords.lng, f.lat, f.lng)) }))
        .filter(f => {
            // Distance
            if (f.distance > radius) return false;

            // Time window: festival hasn't fully ended before now, and starts before horizon
            if (parseDateEnd(f.endDate) < now || parseDate(f.startDate) > horizon) return false;

            // Genre
            if (!f.genres.some(g => selectedGenres.includes(g))) return false;

            return true;
        })
        .sort((a, b) => a.distance - b.distance);
}

/* ── Map ─────────────────────────────────────────────────────── */
function initMap(lat, lng) {
    if (!map) {
        map = L.map('map', { zoomControl: true }).setView([lat, lng], 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18
        }).addTo(map);
    } else {
        map.setView([lat, lng], 8);
    }
}

const USER_ICON = L.divIcon({
    className: '',
    html: '<div class="user-pin"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
});

function renderMap(festivals) {
    // Remove old festival markers
    festivalMarkers.forEach(m => map.removeLayer(m));
    festivalMarkers = [];

    // Remove old radius circle
    if (radiusCircle) { map.removeLayer(radiusCircle); radiusCircle = null; }

    // Place / update user marker
    if (userMarker) {
        userMarker.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
        userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: USER_ICON, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup(`<strong>Dein Standort</strong><br>${userCoords.label}`);
    }

    // Draw radius circle
    const radiusM = parseInt(radiusSlider.value, 10) * 1000;
    radiusCircle = L.circle([userCoords.lat, userCoords.lng], {
        radius: radiusM,
        fillColor: '#7c3aed',
        fillOpacity: 0.06,
        color: '#7c3aed',
        weight: 2,
        opacity: 0.5,
        dashArray: '6 4'
    }).addTo(map);

    // Festival markers
    festivals.forEach(f => {
        const colour = genreColour(f.genres[0]);
        const marker = L.circleMarker([f.lat, f.lng], {
            radius: 10,
            fillColor: colour,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.88
        }).addTo(map);

        marker.bindPopup(
            `<div class="popup-inner">
                <strong>${f.name}</strong>
                <div class="popup-meta">📅 ${formatDateRange(f.startDate, f.endDate)}</div>
                <div class="popup-meta">📍 ${f.location}</div>
                <div class="popup-meta">🚗 ${f.distance} km entfernt</div>
                <a class="popup-link" href="${f.website}" target="_blank" rel="noopener noreferrer">Website öffnen →</a>
            </div>`,
            { maxWidth: 260 }
        );

        festivalMarkers.push(marker);
    });

    // Fit bounds
    const allPoints = [
        [userCoords.lat, userCoords.lng],
        ...festivals.map(f => [f.lat, f.lng])
    ];
    if (allPoints.length > 1) {
        map.fitBounds(allPoints, { padding: [50, 50] });
    } else {
        map.setView([userCoords.lat, userCoords.lng], 9);
    }
}

/* ── Festival cards ──────────────────────────────────────────── */
function buildCard(festival) {
    const card = document.createElement('article');
    card.className = 'festival-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const genreTagsHtml = festival.genres
        .map(g => {
            const c = genreColour(g);
            return `<span class="genre-tag" style="--c:${c}">${g}</span>`;
        })
        .join('');

    card.innerHTML = `
        <div class="card-head">
            <h3 class="card-name">${festival.name}</h3>
            <span class="card-dist">${festival.distance} km</span>
        </div>
        <div class="card-date">📅 ${formatDateRange(festival.startDate, festival.endDate)}</div>
        <div class="card-location">📍 ${festival.location}</div>
        <p class="card-desc">${festival.description}</p>
        <div class="card-genres">${genreTagsHtml}</div>
        <div class="card-foot">
            <span class="card-price">${festival.price}</span>
            <a class="card-link" href="${festival.website}" target="_blank" rel="noopener noreferrer">Website →</a>
        </div>
    `;

    // Click / keyboard → pan map to festival
    const focusMap = (e) => {
        if (e.target.classList.contains('card-link')) return;
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        map.setView([festival.lat, festival.lng], 12, { animate: true });
        const marker = festivalMarkers.find(
            m => m.getLatLng().lat === festival.lat && m.getLatLng().lng === festival.lng
        );
        if (marker) marker.openPopup();
        resultsSection.querySelector('.map-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    card.addEventListener('click', focusMap);
    card.addEventListener('keydown', focusMap);

    return card;
}

/* ── Update all results ──────────────────────────────────────── */
function updateResults() {
    const festivals = filterFestivals();
    const radius    = radiusSlider.value;

    const count = festivals.length;
    resultsTitle.textContent =
        count === 0
            ? 'Keine Festivals gefunden'
            : `${count} Festival${count !== 1 ? 's' : ''} im Umkreis von ${radius} km`;

    renderMap(festivals);

    festivalGrid.innerHTML = '';
    if (count === 0) {
        festivalGrid.innerHTML =
            '<div class="no-results">' +
            '😔 Keine Festivals mit diesen Filtereinstellungen gefunden.<br>' +
            'Versuche einen größeren Radius oder einen längeren Zeitraum.' +
            '</div>';
    } else {
        festivals.forEach(f => festivalGrid.appendChild(buildCard(f)));
    }
}

/* ── Slider – visual fill ─────────────────────────────────────── */
function syncSlider() {
    const min = +radiusSlider.min;
    const max = +radiusSlider.max;
    const val = +radiusSlider.value;
    const pct = ((val - min) / (max - min)) * 100;
    radiusSlider.style.background =
        `linear-gradient(to right,#7c3aed 0%,#7c3aed ${pct}%,#334155 ${pct}%,#334155 100%)`;
    radiusDisplay.textContent = val;
}

radiusSlider.addEventListener('input', () => {
    syncSlider();
    if (userCoords) updateResults();
});

timeFilter.addEventListener('change', () => {
    if (userCoords) updateResults();
});

/* ── Nominatim geocoding ─────────────────────────────────────── */
async function geocodePLZ(plz) {
    const url =
        `https://nominatim.openstreetmap.org/search` +
        `?postalcode=${encodeURIComponent(plz)}&country=de&format=json&limit=1&addressdetails=1`;

    const res = await fetch(url, {
        headers: { 'Accept-Language': 'de', 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Server-Fehler ${res.status}`);

    const data = await res.json();
    if (!data.length) throw new Error(`PLZ ${plz} wurde nicht gefunden`);

    const { lat, lon, address } = data[0];
    const city = address.city || address.town || address.village || address.county || '';
    return {
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        label: city ? `${plz} ${city}` : plz
    };
}

/* ── Error display ───────────────────────────────────────────── */
function showError(msg) {
    document.querySelector('.error-msg')?.remove();
    const el = document.createElement('p');
    el.className = 'error-msg';
    el.textContent = msg;
    document.querySelector('.search-bar').after(el);
    setTimeout(() => el.remove(), 6000);
}

/* ── Search handler ──────────────────────────────────────────── */
async function handleSearch() {
    const plz = plzInput.value.trim();
    if (!/^\d{5}$/.test(plz)) {
        showError('Bitte eine gültige 5-stellige deutsche Postleitzahl eingeben.');
        plzInput.focus();
        return;
    }

    // Loading state
    searchBtn.disabled = true;
    const btnText = searchBtn.querySelector('.btn-text');
    btnText.innerHTML = '<span class="spinner"></span>Suche …';
    document.querySelector('.error-msg')?.remove();

    try {
        userCoords = await geocodePLZ(plz);

        // First time: show results section and init map
        if (resultsSection.hidden) {
            resultsSection.hidden = false;
            initMap(userCoords.lat, userCoords.lng);
        }

        updateResults();
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        showError(`Fehler: ${err.message}`);
    } finally {
        searchBtn.disabled = false;
        btnText.innerHTML = 'Festivals finden';
    }
}

/* ── Event listeners ─────────────────────────────────────────── */
searchBtn.addEventListener('click', handleSearch);

plzInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
});

plzInput.addEventListener('input', () => {
    document.querySelector('.error-msg')?.remove();
});

/* ── Init ────────────────────────────────────────────────────── */
initGenres();
syncSlider();
