/* ─────────────────────────────────────────────────────────────────
   components/tours.js — Guided tour panel
   Renders tour list and narrative panel, triggers network loads
   ───────────────────────────────────────────────────────────────── */

import { TOURS } from '../data/tours.js';
import { PANTHEON_COLORS, DEITIES } from '../data/deities.js';

let _activeTourId = null;
let _onLoadTour;

/* ── Init ─────────────────────────────────────────────────────────── */
export function initTours({ onLoadTour }) {
  _onLoadTour = onLoadTour;
}

/* ── Render tour list in sidebar ─────────────────────────────────── */
export function renderTourList() {
  const panel = document.getElementById('tours-panel');
  if (!panel) return;

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="panel-title"><span class="panel-icon">✦</span> Guided tours</div>
    <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">
      Pre-built story paths through the network
    </div>
    <div class="tour-list" id="tour-list">
      ${TOURS.map(tour => buildTourCard(tour)).join('')}
    </div>
  `;

  TOURS.forEach(tour => {
    const el = document.getElementById(`tour-${tour.id}`);
    if (el) el.addEventListener('click', () => selectTour(tour));
  });
}

/* ── Build a single tour card ────────────────────────────────────── */
function buildTourCard(tour) {
  return `
    <div class="tour-card" id="tour-${tour.id}">
      <span class="tour-icon">${tour.icon}</span>
      <div class="tour-name">${tour.name}</div>
      <div class="tour-tagline">${tour.tagline}</div>
      <div class="tour-deities">
        ${tour.deities.slice(0, 5).map(id => {
          const d = DEITIES.find(x => x.id === id);
          const col = d ? (PANTHEON_COLORS[d.pantheon] || '#888') : '#888';
          return `<span class="tour-deity-chip" style="border-color:${col}44;color:${col}">${id}</span>`;
        }).join('')}
        ${tour.deities.length > 5 ? `<span class="tour-deity-chip">+${tour.deities.length - 5}</span>` : ''}
      </div>
    </div>
  `;
}

/* ── Select a tour ───────────────────────────────────────────────── */
export function selectTour(tour) {
  _activeTourId = tour.id;

  // Update card active state
  document.querySelectorAll('.tour-card').forEach(el => {
    el.classList.toggle('active', el.id === `tour-${tour.id}`);
  });

  // Render narrative in sidebar
  renderTourNarrative(tour);

  // Trigger network load
  _onLoadTour && _onLoadTour(tour);
}

/* ── Render tour narrative panel ─────────────────────────────────── */
export function renderTourNarrative(tour) {
  const panel = document.getElementById('tour-narrative-panel');
  if (!panel) return;

  panel.style.display = 'block';

  // Pagination state
  let page = 0;
  const total = tour.narrative.length;

  function render() {
    const section = tour.narrative[page];
    panel.innerHTML = `
      <div class="panel-title">
        <span>${tour.icon}</span>
        <span>${tour.name}</span>
      </div>
      <div class="tour-narrative">
        <div class="tour-narrative-title">${section.heading}</div>
        <div class="tour-narrative-text">
          ${section.text.split('\n\n').map(p => `<p>${p.replace(/\*(.*?)\*/g, '<em>$1</em>')}</p>`).join('')}
        </div>
      </div>
      <div class="tour-nav">
        <button class="btn btn-sm" id="tour-prev" ${page === 0 ? 'disabled' : ''}>← Prev</button>
        <span style="font-size:11px;color:var(--text-3);flex:1;text-align:center">${page + 1} / ${total}</span>
        <button class="btn btn-sm" id="tour-next" ${page === total - 1 ? 'disabled' : ''}>Next →</button>
        <button class="btn btn-sm btn-ghost" id="tour-close" style="margin-left:4px">✕</button>
      </div>
    `;

    document.getElementById('tour-prev')?.addEventListener('click', () => { if (page > 0) { page--; render(); } });
    document.getElementById('tour-next')?.addEventListener('click', () => { if (page < total - 1) { page++; render(); } });
    document.getElementById('tour-close')?.addEventListener('click', () => {
      panel.style.display = 'none';
      _activeTourId = null;
      document.querySelectorAll('.tour-card').forEach(el => el.classList.remove('active'));
    });
  }

  render();
}

/* ── Clear tour state ────────────────────────────────────────────── */
export function clearTour() {
  _activeTourId = null;
  const panel = document.getElementById('tour-narrative-panel');
  if (panel) panel.style.display = 'none';
  document.querySelectorAll('.tour-card').forEach(el => el.classList.remove('active'));
}

/* ── Get active tour ─────────────────────────────────────────────── */
export function getActiveTour() {
  return _activeTourId ? TOURS.find(t => t.id === _activeTourId) : null;
}
