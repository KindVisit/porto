// js/hotels.js (clean rebuild)
import { utils } from './utils.js';

// State
let HOTELS = [];

// Fallback image
const PLACEHOLDER_IMG = 'assets/sample/placeholder.jpg';

// Load hotels from JSON
async function loadHotels() {
  try {
    const res = await fetch('data/hotels.json', { cache: 'no-store' });
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('hotels.json must be an array');

    // ensure thumbs exist
    HOTELS = data.map((h, i) => ({
      id: h.id || `htl-${i}`,
      name: h.name || 'Hotel',
      area: h.area || '',
      currency: h.currency || '€',
      pricePerNight: h.pricePerNight != null ? h.pricePerNight : '',
      affiliateUrl: h.affiliateUrl || '#',
      thumb: h.thumb || PLACEHOLDER_IMG,
    }));

    render();
  } catch (err) {
    console.error('Failed to load hotels:', err);
  }
}

// Format affiliate link with placeholders
function formatAffiliateUrl(url, start, end, adults) {
  return (url || '#')
    .replace('{CHECKIN}',  start || '')
    .replace('{CHECKOUT}', end   || '')
    .replace('{ADULTS}',   adults || '1');
}

// Advertising card (no image)
function adCardHTML() {
  return `
    <div class="hotel-ad" role="region" aria-label="Advertising">
      <div class="body">
        <span class="ad-badge">Advertising</span>
        <div class="title">Partner placement</div>
        <div class="muted">Promoted hotel or local apartment partner.</div>
        <div class="cta"><a href="#" target="_blank" rel="noopener">Learn more</a></div>
      </div>
    </div>
  `;
}

// Hotel card
function hotelCardHTML(h, start, end, adults) {
  const url = formatAffiliateUrl(h.affiliateUrl, start, end, adults);
  const img = h.thumb || PLACEHOLDER_IMG;

  return `
    <div class="hotel-card">
      <img src="${utils.escapeHtml(img)}" alt="" loading="lazy">
      <div class="body">
        <div class="name">${utils.escapeHtml(h.name)}</div>
        <div class="muted">${utils.escapeHtml(h.area)}</div>
        <div class="meta">
  <div class="price"><strong>${utils.escapeHtml(h.currency)}${utils.escapeHtml(String(h.pricePerNight))}</strong> / night</div>
  <a class="book btn btn-primary" href="${utils.escapeHtml(url)}" target="_blank" rel="noopener">Book</a>
</div>
      </div>
    </div>
  `;
}


// Render list
function render() {
  const listEl  = document.getElementById('rail-hotels');
  const datesEl = document.getElementById('hotels-dates');
  if (!listEl) return;

  const start  = document.getElementById('date-start')?.value || '';
  const end    = document.getElementById('date-end')?.value   || '';
  const adults = document.getElementById('adults')?.value      || '1';

  if (datesEl) {
    datesEl.textContent = (start && end) ? `${start} → ${end}` : 'Select dates';
  }

  const parts = [];
  HOTELS.forEach((h, i) => {
    parts.push(hotelCardHTML(h, start, end, adults));
    // interleave an ad after every 2 hotels, but not after the last item
    if ((i + 1) % 2 === 0 && i < HOTELS.length - 1) parts.push(adCardHTML());
  });

  listEl.innerHTML = parts.join('');
}

// Init
function initHotelsAside() {
  loadHotels();

  // Re-render on input changes
  ['date-start', 'date-end', 'adults'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', render);
  });

  // Re-render when filters are applied (clicking the search button, etc.)
  document.addEventListener('filtersChanged', render);
}

document.addEventListener('DOMContentLoaded', initHotelsAside);
