/* ─────────────────────────────────────────────────────────────────
   components/sidebar.js — Deity info card, radar chart,
   trait heatmap, top connections list
   ───────────────────────────────────────────────────────────────── */

import { TRAITS, PANTHEON_COLORS } from '../data/deities.js';
import { traitVector, traitFillColor } from '../utils/similarity.js';
import { getDeityRefs } from '../data/citations.js';

let _onTraitClick;
let _onConnClick;

/* ── Init ─────────────────────────────────────────────────────────── */
export function initSidebar({ onTraitClick, onConnClick }) {
  _onTraitClick = onTraitClick;
  _onConnClick  = onConnClick;
}

/* ── Render full sidebar for a deity ────────────────────────────── */
export function renderSidebar(deity, connections, activeFilter = null) {
  renderDeityCard(deity);
  renderRadar(deity);
  renderHeatmap(deity, activeFilter);
  renderConnections(connections, deity);
}

/* ── Deity info card ─────────────────────────────────────────────── */
export function renderDeityCard(deity) {
  const panel = document.getElementById('deity-info');
  if (!panel) return;

  const col  = PANTHEON_COLORS[deity.pantheon] || '#888';
  const refs = getDeityRefs(deity.id);

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="panel-title"><span class="panel-icon">⟁</span> Selected deity</div>
    <div class="card">
      <div class="pantheon-badge" style="background:${col}20;color:${col};border:1px solid ${col}44">
        <span class="pantheon-dot" style="background:${col}"></span>
        ${deity.pantheon}
      </div>
      <div class="deity-card-name">${deity.id}</div>
      <div class="deity-card-epithet">${deity.epithet}</div>
      <div class="deity-card-desc">${deity.desc}</div>

      ${refs.length ? `
        <div class="collapsible-trigger" id="refs-trigger" style="margin-top:10px">
          <span class="collapsible-label">Academic references (${refs.length})</span>
          <span class="collapsible-arrow">▾</span>
        </div>
        <div class="collapsible-body" id="refs-body">
          <div style="padding-top:6px">
            ${refs.map(r => `
              <div class="ref-item">
                <span class="ref-author">${r.bib.author}</span>
                <span class="ref-year"> (${r.bib.year})</span>
                ${r.pages ? `<span style="color:var(--text-3)"> · ${r.pages}</span>` : ''}
                <br/>
                <span class="ref-title">${r.bib.title}</span>
                <br/>
                <span style="font-size:10px;color:var(--text-2)">${r.note}</span>
              </div>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Collapsible toggle
  const trigger = document.getElementById('refs-trigger');
  const body    = document.getElementById('refs-body');
  if (trigger && body) {
    trigger.addEventListener('click', () => {
      const open = body.classList.toggle('open');
      trigger.classList.toggle('open', open);
    });
  }
}

/* ── Radar chart ─────────────────────────────────────────────────── */
export function renderRadar(deity) {
  const panel = document.getElementById('radar-panel');
  if (!panel) return;
  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="panel-title"><span class="panel-icon">◎</span> Trait radar</div>
    <canvas id="radar-canvas" width="258" height="190" style="display:block;margin:0 auto"></canvas>
    <div style="font-size:10px;color:var(--text-3);text-align:center;margin-top:4px">
      Click a trait in the profile below to filter graph edges
    </div>
  `;

  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const CW  = canvas.width, CH = canvas.height;
  ctx.clearRect(0, 0, CW, CH);

  const vec  = traitVector(deity);
  const top8 = TRAITS.map((t, i) => ({ t, i, v: vec[i] }))
    .filter(x => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 8);

  if (!top8.length) return;

  const cx = CW / 2, cy = CH / 2 + 4;
  const r  = Math.min(cx, cy) - 32;
  const n  = top8.length;
  const col = PANTHEON_COLORS[deity.pantheon] || '#7c6fcc';

  // Grid rings
  [0.25, 0.5, 0.75, 1].forEach(ring => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * r * ring;
      const y = cy + Math.sin(a) * r * ring;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    // Ring label
    if (ring === 0.5 || ring === 1) {
      ctx.fillStyle  = 'rgba(255,255,255,0.18)';
      ctx.font       = '8px Inter,sans-serif';
      ctx.textAlign  = 'center';
      ctx.fillText((ring * 100).toFixed(0) + '%', cx, cy - r * ring - 3);
    }
  });

  // Spokes & labels
  top8.forEach(({ t }, i) => {
    const a  = (i / n) * Math.PI * 2 - Math.PI / 2;
    const lx = cx + Math.cos(a) * (r + 18);
    const ly = cy + Math.sin(a) * (r + 18);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.fillStyle    = 'rgba(255,255,255,0.4)';
    ctx.font         = '8.5px Inter,sans-serif';
    ctx.textAlign    = lx > cx + 4 ? 'left' : lx < cx - 4 ? 'right' : 'center';
    ctx.textBaseline = ly > cy + 4 ? 'top'  : ly < cy - 4 ? 'bottom' : 'middle';
    const label      = t.length > 11 ? t.slice(0, 10) + '…' : t;
    ctx.fillText(label, lx, ly);
  });

  // Data polygon
  ctx.beginPath();
  top8.forEach(({ v }, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r * v;
    const y = cy + Math.sin(a) * r * v;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle   = col + '2e';
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth   = 1.8;
  ctx.stroke();

  // Dot per point
  top8.forEach(({ v }, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v, 3, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });
}

/* ── Trait heatmap ───────────────────────────────────────────────── */
export function renderHeatmap(deity, activeFilter = null) {
  const panel = document.getElementById('heatmap-panel');
  if (!panel) return;

  panel.style.display = 'block';
  const vec    = traitVector(deity);
  const sorted = TRAITS.map((t, i) => ({ t, v: vec[i] }))
    .filter(x => x.v > 0)
    .sort((a, b) => b.v - a.v);

  panel.innerHTML = `
    <div class="panel-title"><span class="panel-icon">▤</span> Trait profile</div>
    <div id="heatmap-rows">
      ${sorted.map(({ t, v }) => {
        const pct      = (v * 100).toFixed(0);
        const isActive = activeFilter === t;
        return `
          <div class="hm-row">
            <div class="hm-label${isActive ? ' active-filter' : ''}"
                 data-trait="${t}">${t}</div>
            <div class="hm-bar">
              <div class="hm-fill"
                   style="width:${pct}%;background:${traitFillColor(v)}${isActive ? ';box-shadow:0 0 5px ' + traitFillColor(v) : ''}">
              </div>
            </div>
            <div class="hm-val">${pct}%</div>
          </div>`;
      }).join('')}
    </div>
    <div style="font-size:10px;color:var(--text-3);margin-top:6px">
      Click a trait to highlight matching edges in the graph
    </div>
  `;

  // Trait click listeners
  panel.querySelectorAll('.hm-label').forEach(el => {
    el.addEventListener('click', () => {
      const trait = el.dataset.trait;
      _onTraitClick && _onTraitClick(trait);
    });
  });
}

/* ── Connections list ────────────────────────────────────────────── */
export function renderConnections(connections, centerDeity) {
  const panel = document.getElementById('connections-panel');
  if (!panel) return;

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="panel-title"><span class="panel-icon">◈</span> Strongest connections</div>
    <div id="conn-list">
      ${connections.slice(0, 12).map(c => {
        const col = PANTHEON_COLORS[c.deity.pantheon] || '#888';
        const cog = c.cognate;
        return `
          <div class="conn-item" data-id="${c.deity.id}">
            <span class="conn-dot" style="background:${col}"></span>
            <div class="conn-info">
              <div class="conn-name">${c.deity.id}</div>
              <div class="conn-pan">${c.deity.pantheon}</div>
            </div>
            ${cog ? `<span class="conn-cognate-badge" title="${cog.note}">PIE ⟡</span>` : ''}
            <span class="conn-score">${c.score.toFixed(2)}</span>
          </div>`;
      }).join('')}
    </div>
  `;

  // Click listeners
  panel.querySelectorAll('.conn-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      _onConnClick && _onConnClick(id);
    });
  });
}

/* ── Clear sidebar ───────────────────────────────────────────────── */
export function clearSidebar() {
  ['deity-info', 'radar-panel', 'heatmap-panel', 'connections-panel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
