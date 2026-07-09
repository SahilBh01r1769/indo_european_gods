/* ─────────────────────────────────────────────────────────────────
   views/matrix.js — Pantheon similarity heatmap
   ───────────────────────────────────────────────────────────────── */

import { PANTHEON_COLORS } from '../data/deities.js';
import { computePantheonMatrix } from '../utils/similarity.js';
import { getCognate } from '../data/cognates.js';

let _metric   = 'cosine';
let _matData  = null;
let _onLoadDeity;

/* ── Init ─────────────────────────────────────────────────────────── */
export function initMatrix({ onLoadDeity }) {
  _onLoadDeity = onLoadDeity;
}

/* ── Render ──────────────────────────────────────────────────────── */
export function renderMatrix(metric = 'cosine') {
  _metric  = metric;
  _matData = computePantheonMatrix(metric);

  const container = document.getElementById('matrix-view');
  container.innerHTML = `
    <div class="view-inner">
      <div class="view-title">Pantheon Similarity Matrix</div>
      <div class="view-subtitle">
        Average pairwise ${metric === 'cosine' ? 'cosine' : 'weighted overlap'} similarity
        between all deities across each pair of traditions.
        Click any cell to see the top deity pairs driving that score.
      </div>
      <div class="matrix-wrap">
        <table class="matrix-table" id="matrix-table"></table>
      </div>
      <div class="matrix-legend">
        <span>Low similarity</span>
        <div class="matrix-legend-bar"></div>
        <span>High similarity</span>
        <button class="btn btn-sm" id="matrix-csv-btn" style="margin-left:14px">⬇ Export CSV</button>
      </div>
      <div id="matrix-detail" style="display:none" class="matrix-detail"></div>
    </div>
  `;

  buildTable();

  document.getElementById('matrix-csv-btn')?.addEventListener('click', () => {
    import('../utils/export.js').then(m =>
      m.exportMatrixCSV(_matData.pantheons, _matData.matrix)
    );
  });
}

/* ── Build table ─────────────────────────────────────────────────── */
function buildTable() {
  const { pantheons, matrix } = _matData;
  const table = document.getElementById('matrix-table');
  if (!table) return;

  // Header row
  const thead = table.createTHead();
  const hrow  = thead.insertRow();

  // Corner
  const corner = document.createElement('th');
  corner.className = 'matrix-corner';
  hrow.appendChild(corner);

  // Column headers
  pantheons.forEach(p => {
    const th = document.createElement('th');
    th.className = 'matrix-th-col';
    th.style.color = PANTHEON_COLORS[p] || '#888';
    th.innerHTML = `<span>${p}</span>`;
    hrow.appendChild(th);
  });

  // Body rows
  const tbody = table.createTBody();
  matrix.forEach((row, i) => {
    const tr = tbody.insertRow();

    // Row header
    const rh = tr.insertCell();
    rh.className = 'matrix-th-row';
    rh.style.color = PANTHEON_COLORS[pantheons[i]] || '#888';
    rh.textContent = pantheons[i];

    // Data cells
    row.forEach((val, j) => {
      const td = tr.insertCell();
      const isSelf = i === j;
      td.className = `matrix-cell${isSelf ? ' matrix-cell-self' : ''}`;
      td.style.background = isSelf ? '' : cellBackground(val);
      td.title = isSelf ? pantheons[i] : `${pantheons[i]} ↔ ${pantheons[j]}: ${val.toFixed(3)}`;

      td.innerHTML = isSelf
        ? `<div class="matrix-cell-inner"><div class="matrix-score" style="color:${PANTHEON_COLORS[pantheons[i]]||'#888'};font-size:11px">${pantheons[i]}</div></div>`
        : `<div class="matrix-cell-inner">
             <div class="matrix-score">${val.toFixed(3)}</div>
             <div class="matrix-label">${scoreLabel(val)}</div>
           </div>`;

      if (!isSelf) {
        td.addEventListener('click', () => showDetail(pantheons[i], pantheons[j], val));
        td.addEventListener('mouseenter', () => {
          td.style.outline = '2px solid rgba(124,111,204,0.6)';
          td.style.zIndex  = '2';
        });
        td.addEventListener('mouseleave', () => {
          td.style.outline = '';
          td.style.zIndex  = '';
        });
      }
    });
  });
}

/* ── Cell background colour ──────────────────────────────────────── */
function cellBackground(val) {
  // map 0→#1e1e28, 0.5→#4a4480, 1→#c9a84c
  const lo  = [30,  30,  40 ];
  const mid = [74,  68,  128];
  const hi  = [201, 168, 76 ];

  let r, g, b;
  if (val < 0.5) {
    const t = val * 2;
    r = Math.round(lo[0] + t * (mid[0] - lo[0]));
    g = Math.round(lo[1] + t * (mid[1] - lo[1]));
    b = Math.round(lo[2] + t * (mid[2] - lo[2]));
  } else {
    const t = (val - 0.5) * 2;
    r = Math.round(mid[0] + t * (hi[0] - mid[0]));
    g = Math.round(mid[1] + t * (hi[1] - mid[1]));
    b = Math.round(mid[2] + t * (hi[2] - mid[2]));
  }
  return `rgb(${r},${g},${b})`;
}

function scoreLabel(v) {
  if (v >= 0.65) return 'very high';
  if (v >= 0.50) return 'high';
  if (v >= 0.38) return 'moderate';
  if (v >= 0.25) return 'low';
  return 'very low';
}

/* ── Detail panel ────────────────────────────────────────────────── */
function showDetail(panA, panB, avg) {
  const key     = `${panA}--${panB}`;
  const pairs   = _matData.topPairs[key] || [];
  const detail  = document.getElementById('matrix-detail');
  if (!detail) return;

  detail.style.display = 'block';
  detail.innerHTML = `
    <div class="matrix-detail-title">
      <span style="color:${PANTHEON_COLORS[panA]}">${panA}</span>
      <span style="color:var(--text-3)"> ↔ </span>
      <span style="color:${PANTHEON_COLORS[panB]}">${panB}</span>
      <span style="font-size:12px;color:var(--text-2);margin-left:10px">avg ${avg.toFixed(3)}</span>
    </div>
    <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">
      Top deity pairs by similarity — click any row to explore in the graph
    </div>
    ${pairs.map(p => {
      const cog = getCognate(p.a.id, p.b.id);
      return `
        <div class="matrix-detail-pair" style="cursor:pointer"
             onclick="window._matrixLoadPair('${p.a.id}','${p.b.id}')">
          <span style="color:${PANTHEON_COLORS[p.a.pantheon]};font-weight:500">${p.a.id}</span>
          <span style="color:var(--text-3);font-size:10px">↔</span>
          <span style="color:${PANTHEON_COLORS[p.b.pantheon]};font-weight:500">${p.b.id}</span>
          ${cog ? `<span style="font-size:9px;color:var(--gold);margin-left:4px">PIE ⟡</span>` : ''}
          <span class="matrix-pair-score">${p.score.toFixed(3)}</span>
        </div>`;
    }).join('')}
    <div style="font-size:10px;color:var(--text-3);margin-top:8px">
      Click any pair to switch to Graph view and explore their connection
    </div>
  `;

  // Expose click handler globally for inline onclick
  window._matrixLoadPair = (aId, bId) => {
    _onLoadDeity && _onLoadDeity(aId);
  };

  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
