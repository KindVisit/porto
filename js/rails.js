// js/rails.js
import { FILTERS } from './filters.js';
import { utils } from './utils.js';

/* ===========================
   Sources per section
   =========================== */
const SECTION_SOURCES = {
  nature:    'data/opportunities/nature.json',
  social:    'data/opportunities/social.json',
  culture:   'data/opportunities/culture.json',
  events:    'data/opportunities/events.json',
  crowd:     'data/opportunities/crowd.json',
  animals:   'data/opportunities/animals.json',
  homeless:  'data/opportunities/homeless.json',
  seniors:   'data/opportunities/seniors.json',
  education: 'data/opportunities/education.json',
};

/* Rails (containers in the DOM) */
const RAILS = {
  nature:    document.getElementById('rail-nature'),
  social:    document.getElementById('rail-social'),
  culture:   document.getElementById('rail-culture'),
  events:    document.getElementById('rail-events'),
  crowd:     document.getElementById('rail-crowd'),
  animals:   document.getElementById('rail-animals'),
  homeless:  document.getElementById('rail-homeless'),
  seniors:   document.getElementById('rail-seniors'),
  education: document.getElementById('rail-education'),
};

/* Caches */
const CACHE = {};         // section -> array of ops
let BY_ID = new Map();    // all ops by id (for modal lookup)

/* ===========================
   Filters
   =========================== */
function passFilters(op){
  // language
  if (FILTERS.language !== 'Any') {
    const langs = op.languages || [];
    if (!langs.includes(FILTERS.language)) return false;
  }
  // duration
  if (FILTERS.duration !== 'any'){
    const d = String(op.duration||'').toLowerCase();
    const want = FILTERS.duration;
    if (want === 'half' && !/half|3–4h|3-4h|3h|4h/.test(d)) return false;
    if (want === 'full' && !/full|6–8h|6-8h|6h|7h|8h/.test(d)) return false;
    if (want === '1h'   && !/1h/.test(d)) return false;
    if (want === '2–3h' && !/(2–3h|2-3h|2h|3h)/.test(d)) return false;
  }
  return true;
}

/* ===========================
   Rendering helpers
   =========================== */
function safeImg(src){
  return src && typeof src === 'string' ? src : 'assets/sample/placeholder.jpg';
}

function cardHTML(op){
  const img = safeImg(op.image);
  const tags = (op.tags||[]).map(t=>`<span class="tag">${utils.escapeHtml(t)}</span>`).join('');
  const fee = op.fee ? `<div class="fee">${utils.escapeHtml(op.fee)}</div>` : '';

  return `
    <article class="card-op">
      <img src="${utils.escapeHtml(img)}" alt="" loading="lazy">
      <div class="body">
        <h3>${utils.escapeHtml(op.title)}</h3>
        <div class="meta">${utils.escapeHtml(op.org || '')} · ${utils.escapeHtml(op.duration || '')}</div>
        <div class="tags">${tags}</div>
        ${fee}
        <div class="actions">
          <button class="btn btn-primary" data-op-join="${utils.escapeHtml(op.id)}">I want to help</button>
          <button class="btn-secondary" data-op-learn="${utils.escapeHtml(op.id)}">Learn more</button>
        </div>
      </div>
    </article>`;
}

/* Submit-your-project CTA card (the whole card feels like a button; no link yet) */
function submitCardHTML(section){
  return `
    <article class="card-submit" tabindex="0" aria-label="Submit your project for ${utils.escapeHtml(section)}">
      <div class="body">
        <div class="label">Are you an NGO or community group?</div>
        <h3>Submit your project</h3>
      </div>
    </article>`;
}

/* Render a single section into its rail */
function renderSection(section){
  const rail = RAILS[section];
  if (!rail) return;

  rail.innerHTML = '';
  const list = (CACHE[section] || []).filter(passFilters);

  list.forEach(op => {
    rail.insertAdjacentHTML('beforeend', cardHTML(op));
  });

  // Append CTA at the end of non-empty rails
  if (list.length){
    rail.insertAdjacentHTML('beforeend', submitCardHTML(section));
  }
}

/* Rebuild BY_ID map (for modal lookups) */
function rebuildIndex(){
  const all = Object.values(CACHE).flat();
  BY_ID = new Map(all.map(o => [o.id, o]));
}

/* ===========================
   Loading
   =========================== */
async function loadSection(section){
  if (CACHE[section]) {         // already loaded once
    renderSection(section);
    rebuildIndex();
    return;
  }
  const url = SECTION_SOURCES[section];
  if (!url) return;

  try{
    const res = await fetch(url, { cache:'no-store' });
    const arr = await res.json();
    CACHE[section] = Array.isArray(arr) ? arr : [];
    renderSection(section);
    rebuildIndex();
  }catch(e){
    console.error('rails: failed loading', section, e);
  }
}

function loadAllSections(){
  Object.keys(SECTION_SOURCES).forEach(loadSection);
}

function refreshAll(){
  Object.keys(SECTION_SOURCES).forEach(renderSection);
}

/* ===========================
   Rail arrows
   =========================== */
function initArrows(){
  document.querySelectorAll('.rail-next').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.target;
      const rail = document.getElementById(id);
      if (rail) rail.scrollBy({ left: rail.clientWidth * 0.9, behavior:'smooth' });
    });
  });
}

/* ===========================
   Modal
   =========================== */
function openModal(op){
  const modal = document.getElementById('op-modal');
  if (!modal || !op) return;

  const imgEl  = modal.querySelector('#opm-image');
  const tEl    = modal.querySelector('#opm-title');
  const orgEl  = modal.querySelector('#opm-org');
  const feeEl  = modal.querySelector('#opm-fee');
  const dEl    = modal.querySelector('#opm-desc');
  const durEl  = modal.querySelector('#opm-duration');
  const langEl = modal.querySelector('#opm-langs');
  const ageEl  = modal.querySelector('#opm-age');
  const tagsEl = modal.querySelector('#opm-tags');
  const cta    = modal.querySelector('#opm-cta');

  imgEl.src = safeImg(op.image);
  tEl.textContent   = op.title || '';
  orgEl.textContent = op.org || '';
  feeEl.textContent = op.fee || '';
  dEl.textContent   = op.description || op.summary || '';

  durEl.textContent  = op.duration || '—';
  langEl.textContent = (op.languages || []).join(', ') || 'Any';
  ageEl.textContent  = Number.isFinite(op.minAge) ? `${op.minAge}+` : '—';
  tagsEl.textContent = (op.tags||[]).join(', ');

  // (future) registration deep link can be placed here
  cta.href = '#';

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');

  setTimeout(()=> modal.querySelector('[data-opm-close]')?.focus(), 0);
}

function closeModal(){
  const modal = document.getElementById('op-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
}

/* Delegated events for Learn more / I want to help / modal close */
function initActions(){
  document.addEventListener('click', (e)=>{
    const learnBtn = e.target.closest('[data-op-learn]');
    if (learnBtn){
      const id = learnBtn.getAttribute('data-op-learn');
      const op = BY_ID.get(id);
      if (op) openModal(op);
    }

    const joinBtn = e.target.closest('[data-op-join]');
    if (joinBtn){
      const id = joinBtn.getAttribute('data-op-join');
      const op = BY_ID.get(id);
      if (op) openModal(op);
    }

    if (e.target.matches('[data-opm-close]')) closeModal();
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });

  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') closeModal();
  });
}

/* ===========================
   Boot
   =========================== */
document.addEventListener('DOMContentLoaded', ()=>{
  initArrows();
  loadAllSections();
  initActions();
  document.addEventListener('filtersChanged', refreshAll);
});
