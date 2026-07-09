/* ─────────────────────────────────────────────────────────────────
   app.js — Application state + orchestration
   Wires all views, components, and utilities together
   ───────────────────────────────────────────────────────────────── */

import { DEITIES, PANTHEON_COLORS, TRAITS }  from './data/deities.js';
import { TOURS }                              from './data/tours.js';
import { getCognate }                         from './data/cognates.js';
import { getConnections, getDeityById,
         sharedTraits, computeSimilarity,
         traitVector, findPath }              from './utils/similarity.js';
import { exportJSON, exportSVG }              from './utils/export.js';

import { initGraph, renderGraph, clearGraph,
         highlightByTrait, clearHighlight,
         setLabelsVisible, resetZoom,
         zoomIn, zoomOut, unpinAll,
         updateMinimap, repositionTooltip }   from './views/graph.js';
import { initMatrix, renderMatrix }           from './views/matrix.js';
import { initArchetypes, renderArchetypes }   from './views/archetypes.js';

import { initSidebar, renderSidebar,
         renderDeityCard, renderHeatmap,
         renderConnections, clearSidebar }    from './components/sidebar.js';
import { initTours, renderTourList,
         renderTourNarrative, clearTour }     from './components/tours.js';
import { initSurprising, renderSurprisingCard,
         initMethodologyModal }               from './components/surprising.js';

/* ── Application state ───────────────────────────────────────────── */
const State = {
  // Graph data
  nodes:        [],
  edges:        [],
  centerDeity:  null,

  // UI mode
  view:         'graph',    // 'graph' | 'matrix' | 'archetypes'
  appMode:      'explore',  // 'explore' | 'compare' | 'path'
  linkMode:     'top5',     // 'top5' | 'top10' | 'all'
  metric:       'cosine',   // 'cosine' | 'overlap'
  threshold:    0.35,
  eraMin:       0,

  // Graph options
  showCognates:    false,
  showLabels:      true,
  clusterByPan:    false,
  expandOnClick:   true,
  animateEntrance: true,

  // Interaction state
  activeTraitFilter: null,
  pinnedNodes:       new Set(),

  // Mode-specific
  compareA:   null,
  compareB:   null,
  pathFrom:   null,
  pathTo:     null,
};

/* ── Init ─────────────────────────────────────────────────────────── */
export function init() {
  initGraph({
    state:        State,
    onNodeClick:  handleNodeClick,
    onNodeHover:  handleNodeHover,
    onEdgeHover:  handleEdgeHover,
    hideTooltip:  hideTooltip,
  });

  initMatrix({ onLoadDeity: loadDeity });
  initArchetypes({ onLoadDeity: loadDeityAndSwitchToGraph });
  initSidebar({ onTraitClick: handleTraitClick, onConnClick: loadDeity });
  initTours({ onLoadTour: handleTourLoad });
  initSurprising({ onLoadDeity: loadDeity });
  initMethodologyModal();

  buildLegend();
  buildAutocomplete();
  wireControls();
  renderTourList();

  // Hide loader
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 500);
}

/* ── Core: load a deity ──────────────────────────────────────────── */
export function loadDeity(nameOrId, options = {}) {
  const deity = getDeityById(nameOrId);
  if (!deity) { toast(`"${nameOrId}" not found`); return; }

  const { resetGraph = false } = options;

  if (resetGraph || !State.expandOnClick) {
    State.nodes = [];
    State.edges = [];
  }

  State.centerDeity     = deity;
  State.activeTraitFilter = null;
  clearTour();

  // Close autocomplete
  document.getElementById('autocomplete').style.display = 'none';
  document.getElementById('deity-input').value = deity.id;

  switchView('graph');
  generate();
}

function loadDeityAndSwitchToGraph(id) {
  loadDeity(id, { resetGraph: true });
}

/* ── Core: generate network ──────────────────────────────────────── */
function generate() {
  const deity = State.centerDeity;
  if (!deity) return;

  let connections = getConnections(deity, State.metric, State.threshold, State.eraMin);

  if (State.linkMode === 'top5')  connections = connections.slice(0, 5);
  if (State.linkMode === 'top10') connections = connections.slice(0, 10);

  // Merge nodes (expand mode)
  const existingIds = new Set(State.nodes.map(n => n.id));
  const W = () => document.getElementById('view-area').clientWidth  || 800;
  const H = () => document.getElementById('view-area').clientHeight || 600;

  // Add center if not present
  if (!existingIds.has(deity.id)) {
    State.nodes.push({ ...deity, x: W() / 2, y: H() / 2 });
    existingIds.add(deity.id);
  }

  // Add connection nodes
  connections.forEach(c => {
    if (!existingIds.has(c.deity.id)) {
      State.nodes.push({
        ...c.deity,
        x: W() / 2 + (Math.random() - 0.5) * 160,
        y: H() / 2 + (Math.random() - 0.5) * 120,
      });
      existingIds.add(c.deity.id);
    }
  });

  // Add edges (deduplicate)
  const existingEdgeKeys = new Set(State.edges.map(e => e._key));
  connections.forEach(c => {
    const key1 = `${deity.id}--${c.deity.id}`;
    const key2 = `${c.deity.id}--${deity.id}`;
    if (!existingEdgeKeys.has(key1) && !existingEdgeKeys.has(key2)) {
      State.edges.push({
        _key:   key1,
        source: deity.id,
        target: c.deity.id,
        weight: c.score,
        shared: c.shared,
        cognate: getCognate(deity.id, c.deity.id),
      });
      existingEdgeKeys.add(key1);
    }
  });

  renderGraph(State.nodes, State.edges, {
    animate:       State.animateEntrance,
    showLabels:    State.showLabels,
    cluster:       State.clusterByPan,
    activeFilter:  State.activeTraitFilter,
    showCognates:  State.showCognates,
    centerDeityId: deity.id,
  });

  renderSidebar(deity, connections, State.activeTraitFilter);
  renderSurprisingCard(deity, State.metric);
  setStatusBar(`${deity.id} · ${connections.length} connection${connections.length !== 1 ? 's' : ''} · ${State.metric}`);
}

/* ── Node click handler ──────────────────────────────────────────── */
function handleNodeClick(d, evt) {
  if (State.appMode === 'compare') {
    if (!State.compareA) {
      State.compareA = d;
      toast(`Compare: ${d.id} selected — now click another deity`);
      return;
    }
    State.compareB = d;
    showCompareModal(State.compareA, State.compareB);
    State.compareA = null;
    State.compareB = null;
    return;
  }

  if (State.appMode === 'path') {
    if (!State.pathFrom) {
      State.pathFrom = d;
      toast(`Path: ${d.id} → click destination deity`);
      return;
    }
    State.pathTo = d;
    runPathFind(State.pathFrom, State.pathTo);
    State.pathFrom = null;
    State.pathTo   = null;
    return;
  }

  // Explore mode
  const deity = getDeityById(d.id);
  if (!deity) return;
  State.centerDeity = deity;
  document.getElementById('deity-input').value = deity.id;
  generate();
}

/* ── Tooltip handlers ────────────────────────────────────────────── */
function handleNodeHover(evt, d, edges) {
  const edge = edges.find(e => {
    const sid = typeof e.source === 'object' ? e.source.id : e.source;
    const tid = typeof e.target === 'object' ? e.target.id : e.target;
    return sid === d.id || tid === d.id;
  });

  const isCenter = State.centerDeity && d.id === State.centerDeity.id;
  const col = PANTHEON_COLORS[d.pantheon] || '#888';

  let html = `
    <div class="tt-title">${d.id}</div>
    <div class="tt-sub" style="color:${col}">
      ${d.pantheon} pantheon · ${d.epithet}
    </div>
    <div class="tt-desc">${d.desc.slice(0, 120)}${d.desc.length > 120 ? '…' : ''}</div>
  `;

  if (edge && !isCenter) {
    html += `<div class="tt-score">Similarity: <strong>${edge.weight.toFixed(3)}</strong></div>`;
    if (edge.shared?.length) {
      html += `<div class="tt-traits">
        ${edge.shared.map(t =>
          `<span class="tt-trait${State.activeTraitFilter === t ? ' active-trait' : ''}">${t}</span>`
        ).join('')}
      </div>`;
    }
    if (edge.cognate) {
      html += `<div class="tt-cognate">⟡ PIE cognate: ${edge.cognate.note}</div>`;
    }
  }

  html += `<div class="tt-hint">${
    isCenter
      ? 'Center node'
      : State.appMode === 'explore'
        ? 'Click to expand · Double-click to pin'
        : State.appMode === 'compare'
          ? 'Click to select for comparison'
          : 'Click to select as path endpoint'
  }</div>`;

  showTooltip(html, evt);
}

function handleEdgeHover(evt, d) {
  const sid = typeof d.source === 'object' ? d.source.id : d.source;
  const tid = typeof d.target === 'object' ? d.target.id : d.target;
  let html = `
    <div class="tt-title">${sid} ↔ ${tid}</div>
    <div class="tt-score">Similarity: <strong>${d.weight.toFixed(3)}</strong></div>
  `;
  if (d.shared?.length) {
    html += `<div class="tt-traits">
      ${d.shared.map(t => `<span class="tt-trait${State.activeTraitFilter === t ? ' active-trait' : ''}">${t}</span>`).join('')}
    </div>`;
  }
  if (d.cognate) html += `<div class="tt-cognate">⟡ PIE cognate: ${d.cognate.note}</div>`;
  showTooltip(html, evt);
}

function showTooltip(html, evt) {
  const tt = document.getElementById('tooltip');
  if (!tt) return;
  tt.innerHTML = html;
  tt.style.display = 'block';
  requestAnimationFrame(() => { tt.style.opacity = '1'; });
  repositionTooltip(evt, tt);
}

function hideTooltip() {
  const tt = document.getElementById('tooltip');
  if (!tt) return;
  tt.style.opacity = '0';
  setTimeout(() => { if (tt.style.opacity === '0') tt.style.display = 'none'; }, 120);
}

/* ── Trait filter ────────────────────────────────────────────────── */
function handleTraitClick(trait) {
  State.activeTraitFilter = State.activeTraitFilter === trait ? null : trait;
  const af = State.activeTraitFilter;

  if (af) {
    highlightByTrait(af, State.edges);
    toast(`Filtering edges by trait: ${af}`);
  } else {
    clearHighlight();
  }

  if (State.centerDeity) renderHeatmap(State.centerDeity, af);
}

/* ── Tour load ───────────────────────────────────────────────────── */
function handleTourLoad(tour) {
  // Build a pre-baked network from the tour's deity list
  State.nodes = [];
  State.edges = [];
  State.activeTraitFilter = null;
  clearHighlight();

  const center = getDeityById(tour.centerDeity);
  if (!center) return;

  State.centerDeity = center;
  document.getElementById('deity-input').value = center.id;

  const W = document.getElementById('view-area').clientWidth  || 800;
  const H = document.getElementById('view-area').clientHeight || 600;
  const tourDeities = tour.deities.map(id => getDeityById(id)).filter(Boolean);

  // Place center
  State.nodes.push({ ...center, x: W / 2, y: H / 2 });

  // Place other deities in a ring
  tourDeities.filter(d => d.id !== center.id).forEach((d, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2;
    State.nodes.push({
      ...d,
      x: W / 2 + Math.cos(angle) * 160,
      y: H / 2 + Math.sin(angle) * 120,
    });
  });

  // Build all edges between tour deities
  const nodeIds = new Set(State.nodes.map(n => n.id));
  for (let i = 0; i < State.nodes.length; i++) {
    for (let j = i + 1; j < State.nodes.length; j++) {
      const a = State.nodes[i];
      const b = State.nodes[j];
      const score = computeSimilarity(a, b, State.metric);
      if (score >= 0.25) {
        const key = `${a.id}--${b.id}`;
        State.edges.push({
          _key: key, source: a.id, target: b.id,
          weight: score,
          shared: sharedTraits(a, b),
          cognate: getCognate(a.id, b.id),
        });
      }
    }
  }

  switchView('graph');

  renderGraph(State.nodes, State.edges, {
    animate: true, showLabels: State.showLabels,
    cluster: false, showCognates: true,
    centerDeityId: center.id,
  });

  renderTourNarrative(tour);
  renderSidebar(center, getConnections(center, State.metric, 0.25), null);
  setStatusBar(`Tour: ${tour.name} · ${State.nodes.length} deities`);
}

/* ── Path finder ─────────────────────────────────────────────────── */
function runPathFind(from, to) {
  const path = findPath(from.id, to.id, State.metric, Math.max(0.2, State.threshold - 0.1));
  if (!path) { toast(`No path found between ${from.id} and ${to.id} — try lowering the threshold`); return; }

  State.nodes = [];
  State.edges = [];

  const W = document.getElementById('view-area').clientWidth  || 800;
  const H = document.getElementById('view-area').clientHeight || 600;

  path.forEach((d, i) => {
    State.nodes.push({
      ...d,
      x: W * 0.1 + (i / (path.length - 1)) * W * 0.8,
      y: H / 2 + (Math.random() - 0.5) * 80,
    });
    if (i > 0) {
      const score = computeSimilarity(path[i - 1], path[i], State.metric);
      State.edges.push({
        _key:   `${path[i-1].id}--${path[i].id}`,
        source: path[i-1].id,
        target: path[i].id,
        weight: score,
        shared: sharedTraits(path[i-1], path[i]),
        cognate: getCognate(path[i-1].id, path[i].id),
      });
    }
  });

  State.centerDeity = path[0];

  // Show path strip
  const strip = document.getElementById('path-strip');
  if (strip) {
    strip.style.display = 'flex';
    document.getElementById('path-content').innerHTML = path.map((d, i) =>
      `${i > 0 ? '<span class="path-arrow">→</span>' : ''}
       <span class="path-node" onclick="window._app.loadDeity('${d.id}')"
             style="border-color:${PANTHEON_COLORS[d.pantheon]}">${d.id}</span>`
    ).join('');
  }

  renderGraph(State.nodes, State.edges, {
    animate: true, showLabels: true,
    showCognates: State.showCognates,
    centerDeityId: from.id,
  });

  toast(`Path: ${path.map(d => d.id).join(' → ')}`);
}

/* ── Compare modal ───────────────────────────────────────────────── */
function showCompareModal(a, b) {
  const modal = document.getElementById('compare-modal');
  if (!modal) return;

  const score  = computeSimilarity(a, b, State.metric);
  const shared = sharedTraits(a, b);
  const cog    = getCognate(a.id, b.id);
  const colA   = PANTHEON_COLORS[a.pantheon] || '#888';
  const colB   = PANTHEON_COLORS[b.pantheon] || '#888';

  // TRAITS and traitVector are available via static top-level imports
  (() => {
    const va = traitVector(a);
    const vb = traitVector(b);

    document.getElementById('compare-content').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;margin-bottom:16px;align-items:start">
        <div>
          <div style="font-family:var(--font-serif);font-size:16px;color:${colA}">${a.id}</div>
          <div style="font-size:11px;color:var(--text-2)">${a.pantheon} · ${a.epithet}</div>
        </div>
        <div style="text-align:center;padding-top:6px">
          <div style="font-size:22px;color:var(--text-3);font-family:var(--font-serif)">vs</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent-bright);margin-top:3px">${score.toFixed(3)}</div>
          <div style="font-size:10px;color:var(--text-3)">${State.metric} similarity</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--font-serif);font-size:16px;color:${colB}">${b.id}</div>
          <div style="font-size:11px;color:var(--text-2)">${b.pantheon} · ${b.epithet}</div>
        </div>
      </div>

      ${cog ? `
        <div style="background:var(--gold-glow);border:1px solid rgba(201,168,76,.3);border-radius:var(--r-md);padding:9px 12px;font-size:11px;color:var(--gold);margin-bottom:12px">
          ⟡ Known PIE cognate: ${cog.note} <span style="color:var(--text-3)">(${cog.confidence} · ${cog.source})</span>
        </div>` : ''}

      ${shared.length ? `
        <div style="margin-bottom:12px">
          <div style="font-size:10px;color:var(--text-3);margin-bottom:6px">Shared traits (${shared.length})</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${shared.map(t => `<span class="trait-pill trait-pill-accent">${t}</span>`).join('')}
          </div>
        </div>` : ''}

      <div style="font-size:10px;color:var(--text-3);margin-bottom:8px">
        ← ${a.id} intensity · trait · ${b.id} intensity →
      </div>
      ${TRAITS.map((t, i) => {
        if (va[i] === 0 && vb[i] === 0) return '';
        return `
          <div class="compare-trait-row">
            <div class="compare-bar-wrap">
              <div class="compare-bar" style="width:${(va[i]*100).toFixed(0)}%;background:${colA};float:right"></div>
            </div>
            <div class="compare-trait-name">${t}</div>
            <div class="compare-bar-wrap">
              <div class="compare-bar" style="width:${(vb[i]*100).toFixed(0)}%;background:${colB}"></div>
            </div>
          </div>`;
      }).join('')}
    `;

    modal.classList.add('open');
  })();
}

/* ── View switching ──────────────────────────────────────────────── */
export function switchView(view) {
  State.view = view;

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.header-tab[data-view]').forEach(el =>
    el.classList.toggle('active', el.dataset.view === view)
  );

  const viewEl = document.getElementById(`${view}-view`);
  if (viewEl) viewEl.classList.add('active');

  if (view === 'matrix') {
    renderMatrix(State.metric);
  } else if (view === 'archetypes') {
    renderArchetypes();
  }
}

/* ── Autocomplete ────────────────────────────────────────────────── */
function buildAutocomplete() {
  const inp = document.getElementById('deity-input');
  const ac  = document.getElementById('autocomplete');
  let acIdx = -1;

  inp.addEventListener('input', () => {
    const q = inp.value.toLowerCase().trim();
    acIdx = -1;
    if (!q) { ac.style.display = 'none'; return; }

    const matches = DEITIES.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.pantheon.toLowerCase().includes(q) ||
      d.epithet.toLowerCase().includes(q)
    ).slice(0, 9);

    if (!matches.length) { ac.style.display = 'none'; return; }

    ac.innerHTML = matches.map((d, i) => {
      const col = PANTHEON_COLORS[d.pantheon] || '#888';
      return `
        <div class="ac-item" data-idx="${i}" data-id="${d.id}">
          <span class="ac-name">${highlight(d.id, q)}</span>
          <span class="ac-pan" style="background:${col}22;color:${col}">${d.pantheon}</span>
        </div>`;
    }).join('');
    ac.style.display = 'block';

    ac.querySelectorAll('.ac-item').forEach(el => {
      el.addEventListener('click', () => {
        loadDeity(el.dataset.id, { resetGraph: true });
        ac.style.display = 'none';
      });
    });
  });

  inp.addEventListener('keydown', e => {
    const items = ac.querySelectorAll('.ac-item');
    if (e.key === 'ArrowDown') { acIdx = Math.min(acIdx + 1, items.length - 1); highlightAC(items, acIdx); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { acIdx = Math.max(acIdx - 1, -1); highlightAC(items, acIdx); e.preventDefault(); }
    else if (e.key === 'Enter') {
      if (acIdx >= 0 && items[acIdx]) { items[acIdx].click(); }
      else { triggerGenerate(); }
      ac.style.display = 'none';
    }
    else if (e.key === 'Escape') ac.style.display = 'none';
  });

  document.addEventListener('click', e => {
    if (!inp.contains(e.target) && !ac.contains(e.target)) ac.style.display = 'none';
  });
}

function highlight(text, q) {
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return `${text.slice(0, idx)}<strong>${text.slice(idx, idx + q.length)}</strong>${text.slice(idx + q.length)}`;
}

function highlightAC(items, idx) {
  items.forEach((el, i) => el.classList.toggle('focused', i === idx));
  if (idx >= 0) items[idx].scrollIntoView({ block: 'nearest' });
}

function triggerGenerate() {
  const name = document.getElementById('deity-input').value.trim();
  if (!name) return;
  loadDeity(name, { resetGraph: true });
}

/* ── Wire all UI controls ────────────────────────────────────────── */
function wireControls() {
  // Generate button
  document.getElementById('gen-btn')?.addEventListener('click', () =>
    triggerGenerate()
  );

  // Surprise me
  document.getElementById('surprise-btn')?.addEventListener('click', () => {
    const d = DEITIES[Math.floor(Math.random() * DEITIES.length)];
    loadDeity(d.id, { resetGraph: true });
    toast(`✦ ${d.id} — ${d.epithet}`);
  });

  // View tabs
  document.querySelectorAll('.header-tab[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // App mode tabs
  document.querySelectorAll('.header-tab[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      State.appMode = btn.dataset.mode;
      document.querySelectorAll('.header-tab[data-mode]').forEach(b =>
        b.classList.toggle('active', b.dataset.mode === State.appMode)
      );
      if (State.appMode === 'compare') toast('Compare: click two nodes');
      if (State.appMode === 'path')    toast('Path: click start → then destination');
    });
  });

  // Link mode
  document.querySelectorAll('.tab-btn[data-link]').forEach(btn => {
    btn.addEventListener('click', () => {
      State.linkMode = btn.dataset.link;
      document.querySelectorAll('.tab-btn[data-link]').forEach(b =>
        b.classList.toggle('active', b.dataset.link === State.linkMode)
      );
      if (State.centerDeity) { State.nodes = []; State.edges = []; generate(); }
    });
  });

  // Metric
  document.querySelectorAll('.tab-btn[data-metric]').forEach(btn => {
    btn.addEventListener('click', () => {
      State.metric = btn.dataset.metric;
      document.querySelectorAll('.tab-btn[data-metric]').forEach(b =>
        b.classList.toggle('active', b.dataset.metric === State.metric)
      );
      if (State.centerDeity) { State.nodes = []; State.edges = []; generate(); }
    });
  });

  // Threshold slider
  const thSlider = document.getElementById('thresh-sl');
  const thVal    = document.getElementById('thresh-val');
  thSlider?.addEventListener('input', () => {
    State.threshold = parseFloat(thSlider.value) / 100;
    if (thVal) thVal.textContent = State.threshold.toFixed(2);
    if (State.centerDeity) { State.nodes = []; State.edges = []; generate(); }
  });

  // Era slider
  const eraSlider = document.getElementById('era-sl');
  const eraVal    = document.getElementById('era-val');
  const eraLabels = ['All', '500 CE', '200 BCE', '800 BCE', '1500 BCE', '2000 BCE'];
  eraSlider?.addEventListener('input', () => {
    State.eraMin = parseInt(eraSlider.value);
    if (eraVal) eraVal.textContent = eraLabels[State.eraMin];
    if (State.centerDeity) { State.nodes = []; State.edges = []; generate(); }
  });

  // Toggle: cluster
  document.getElementById('cluster-cb')?.addEventListener('change', e => {
    State.clusterByPan = e.target.checked;
    if (State.centerDeity) generate();
  });

  // Toggle: expand on click
  document.getElementById('expand-cb')?.addEventListener('change', e => {
    State.expandOnClick = e.target.checked;
  });

  // Toggle: labels
  document.getElementById('labels-cb')?.addEventListener('change', e => {
    State.showLabels = e.target.checked;
    setLabelsVisible(State.showLabels);
  });

  // Toggle: animate
  document.getElementById('anim-cb')?.addEventListener('change', e => {
    State.animateEntrance = e.target.checked;
  });

  // Cognates button
  document.getElementById('cognate-btn')?.addEventListener('click', () => {
    State.showCognates = !State.showCognates;
    const btn = document.getElementById('cognate-btn');
    btn?.classList.toggle('btn-active', State.showCognates);
    if (State.centerDeity) generate();
    toast(State.showCognates ? 'Cognate pairs highlighted in gold' : 'Cognate highlighting off');
  });

  // Graph controls
  document.getElementById('zoom-in-btn')?.addEventListener('click',    zoomIn);
  document.getElementById('zoom-out-btn')?.addEventListener('click',   zoomOut);
  document.getElementById('reset-zoom-btn')?.addEventListener('click', resetZoom);
  document.getElementById('clear-btn')?.addEventListener('click', () => {
    State.nodes = []; State.edges = [];
    State.centerDeity = null;
    State.pinnedNodes.clear();
    clearGraph();
    clearSidebar();
    clearTour();
    document.getElementById('deity-input').value = '';
    document.getElementById('path-strip').style.display = 'none';
    document.getElementById('surprising-panel').style.display = 'none';
    setStatusBar('');
  });
  document.getElementById('unpin-btn')?.addEventListener('click', () => {
    unpinAll(State.nodes);
    toast('All nodes unpinned');
  });

  // Path strip close
  document.getElementById('path-strip-close')?.addEventListener('click', () => {
    document.getElementById('path-strip').style.display = 'none';
  });

  // Compare modal close
  document.getElementById('compare-close')?.addEventListener('click', () => {
    document.getElementById('compare-modal').classList.remove('open');
  });
  document.getElementById('compare-modal')?.addEventListener('click', e => {
    if (e.target.id === 'compare-modal')
      document.getElementById('compare-modal').classList.remove('open');
  });

  // Export
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    const filename = exportJSON(State);
    if (filename) toast(`Exported: ${filename}`);
    else toast('Generate a network first');
  });
  document.getElementById('export-svg-btn')?.addEventListener('click', () => {
    const filename = exportSVG();
    if (filename) toast(`Exported: ${filename}`);
  });
}

/* ── Legend ──────────────────────────────────────────────────────── */
function buildLegend() {
  const el = document.getElementById('pantheon-legend');
  if (!el) return;
  el.innerHTML = Object.entries(PANTHEON_COLORS).map(([p, c]) => `
    <div class="legend-item" onclick="window._app.loadDeityFromPantheon('${p}')">
      <span class="legend-dot" style="background:${c}"></span>
      <span class="legend-name">${p}</span>
    </div>`).join('');
}

/* ── Status bar ──────────────────────────────────────────────────── */
function setStatusBar(msg) {
  const el = document.getElementById('status-bar');
  if (el) el.textContent = msg;
}

/* ── Toast ───────────────────────────────────────────────────────── */
let _toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── Public API (exposed to window for inline handlers) ──────────── */
window._app = {
  loadDeity: (id) => loadDeity(id),
  loadDeityFromPantheon: (pantheon) => {
    const matches = DEITIES.filter(d => d.pantheon === pantheon);
    if (matches.length) loadDeity(matches[Math.floor(Math.random() * matches.length)].id, { resetGraph: true });
  },
  switchView,
  toast,
};
