/* ─────────────────────────────────────────────────────────────────
   app.js — Application state + orchestration (v2.0)
   Integrated: Pub/Sub Store, Trie Search, Web Workers, Dark Theme
   ───────────────────────────────────────────────────────────────── */

import { DEITIES, PANTHEON_COLORS, TRAITS } from './data/deities.js';
import { TOURS } from './data/tours.js';
import { getCognate } from './data/cognates.js';
import { getDeityById, sharedTraits, traitVector } from './utils/similarity.js';
import { exportJSON, exportSVG } from './utils/export.js';

// New architecture imports
import { store, STATE_KEYS } from './utils/store.js';
import { SearchBar } from './components/search.js';
import { workerClient } from './utils/workerClient.js';

import {
  initGraph, renderGraph, clearGraph,
  highlightByTrait, clearHighlight,
  setLabelsVisible, resetZoom,
  zoomIn, zoomOut, unpinAll,
  updateMinimap, repositionTooltip
} from './views/graph.js';
import { initMatrix, renderMatrix } from './views/matrix.js';
import { initArchetypes, renderArchetypes } from './views/archetypes.js';

import {
  initSidebar, renderSidebar,
  renderDeityCard, renderHeatmap,
  renderConnections, clearSidebar
} from './components/sidebar.js';
import {
  initTours, renderTourList,
  renderTourNarrative, clearTour
} from './components/tours.js';
import {
  initSurprising, renderSurprisingCard,
  initMethodologyModal
} from './components/surprising.js';

/* ── Local mutable state (rendering-only, not pub/sub) ──────────── */
const LocalState = {
  nodes: [],
  edges: [],
  searchBar: null,
};

/* ── Init ─────────────────────────────────────────────────────────── */
export function init() {
  // Seed the store with initial values
  store.set({
    [STATE_KEYS.DEITIES]: DEITIES,
    [STATE_KEYS.TOURS]: TOURS,
    [STATE_KEYS.CURRENT_VIEW]: 'graph',
    [STATE_KEYS.MODE]: 'explore',
    [STATE_KEYS.SIMILARITY_METHOD]: 'cosine',
    [STATE_KEYS.GRAPH_THRESHOLD]: 0.35,
    [STATE_KEYS.SHOW_COGNATES]: false,
    [STATE_KEYS.PINNED_NODES]: new Set(),
    [STATE_KEYS.SELECTED_DEITY]: null,
    [STATE_KEYS.ACTIVE_TRAIT_FILTER]: null,
    [STATE_KEYS.ERA_FILTER]: 0,
    linkMode: 'top5',
    showLabels: true,
    clusterByPan: false,
    expandOnClick: true,
    animateEntrance: true,
    compareA: null,
    compareB: null,
    pathFrom: null,
    pathTo: null,
  });

  initGraph({
    state: store.get(),
    onNodeClick: handleNodeClick,
    onNodeHover: handleNodeHover,
    onEdgeHover: handleEdgeHover,
    hideTooltip: hideTooltip,
  });

  initMatrix({ onLoadDeity: loadDeity });
  initArchetypes({ onLoadDeity: loadDeityAndSwitchToGraph });
  initSidebar({ onTraitClick: handleTraitClick, onConnClick: loadDeity });
  initTours({ onLoadTour: handleTourLoad });
  initSurprising({ onLoadDeity: loadDeity });
  initMethodologyModal();

  // Initialize Trie-powered search bar
  const searchContainer = document.getElementById('search-wrap');
  if (searchContainer) {
    LocalState.searchBar = new SearchBar(searchContainer);
    LocalState.searchBar.buildIndex(DEITIES);
  }

  buildLegend();
  wireControls();
  renderTourList();

  // Subscribe to reactive state changes
 /**  store.subscribe(STATE_KEYS.SELECTED_DEITY, (deityId) => {
    if (deityId) loadDeity(deityId);
  });*/

  store.subscribe(STATE_KEYS.SIMILARITY_METHOD, () => {
    if (store.get(STATE_KEYS.SELECTED_DEITY)) generate();
  });

  store.subscribe(STATE_KEYS.GRAPH_THRESHOLD, () => {
    if (store.get(STATE_KEYS.SELECTED_DEITY)) generate();
  });

  store.subscribe(STATE_KEYS.SHOW_COGNATES, () => {
    if (store.get(STATE_KEYS.SELECTED_DEITY)) generate();
  });

  // Hide loader
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 500);
}

/* ── Core: load a deity ──────────────────────────────────────────── */
export function loadDeity(nameOrId, options = {}) {
  const deity = getDeityById(nameOrId);
  if (!deity) {
    toast(`"${nameOrId}" not found`);
    return;
  }

  const { resetGraph = false } = options;

  if (resetGraph || store.get(STATE_KEYS.MODE) !== 'explore') {
    LocalState.nodes = [];
    LocalState.edges = [];
  }

  store.set(STATE_KEYS.SELECTED_DEITY, deity.id);
  store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
  clearTour();

  // Close search dropdown
  if (LocalState.searchBar) LocalState.searchBar.close();

  // Sync input (supports new SearchBar component or legacy)
  const input = LocalState.searchBar?.input || document.querySelector('.search-input') || document.getElementById('deity-input');
  if (input) input.value = deity.id;

  switchView('graph');
  generate();
}

function loadDeityAndSwitchToGraph(id) {
  loadDeity(id, { resetGraph: true });
}

/* ── Core: generate network (Web Worker) ─────────────────────────── */
async function generate() {
  const deityId = store.get(STATE_KEYS.SELECTED_DEITY);
  const deity = getDeityById(deityId);
  if (!deity) return;

  const metric = store.get(STATE_KEYS.SIMILARITY_METHOD);
  const threshold = store.get(STATE_KEYS.GRAPH_THRESHOLD);
  const eraMin = store.get(STATE_KEYS.ERA_FILTER) || 0;
  const linkMode = store.get('linkMode') || 'top5';

  showLoading(true);

  try {
    let connections = await workerClient.getConnections(
      deity, DEITIES, metric, threshold
    );

    // Era filter
    if (eraMin > 0) {
      connections = connections.filter(c => c.deity.era >= eraMin);
    }

    // Link mode cap
    if (linkMode === 'top5') connections = connections.slice(0, 5);
    if (linkMode === 'top10') connections = connections.slice(0, 10);

    // Merge nodes (expand mode)
    const existingIds = new Set(LocalState.nodes.map(n => n.id));
    const W = () => document.getElementById('view-area')?.clientWidth || 800;
    const H = () => document.getElementById('view-area')?.clientHeight || 600;

    if (!existingIds.has(deity.id)) {
      LocalState.nodes.push({ ...deity, x: W() / 2, y: H() / 2 });
      existingIds.add(deity.id);
    }

    connections.forEach(c => {
      if (!existingIds.has(c.deity.id)) {
        LocalState.nodes.push({
          ...c.deity,
          x: W() / 2 + (Math.random() - 0.5) * 160,
          y: H() / 2 + (Math.random() - 0.5) * 120,
        });
        existingIds.add(c.deity.id);
      }
    });

    // Build edges (deduplicate)
    const existingEdgeKeys = new Set(LocalState.edges.map(e => e._key));
    connections.forEach(c => {
      const key1 = `${deity.id}--${c.deity.id}`;
      const key2 = `${c.deity.id}--${deity.id}`;
      if (!existingEdgeKeys.has(key1) && !existingEdgeKeys.has(key2)) {
        LocalState.edges.push({
          _key: key1,
          source: deity.id,
          target: c.deity.id,
          weight: c.score,
          shared: c.shared,
          cognate: getCognate(deity.id, c.deity.id),
        });
        existingEdgeKeys.add(key1);
      }
    });

    renderGraph(LocalState.nodes, LocalState.edges, {
      animate: store.get('animateEntrance') ?? true,
      showLabels: store.get('showLabels') ?? true,
      cluster: store.get('clusterByPan') ?? false,
      activeFilter: store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER) || null,
      showCognates: store.get(STATE_KEYS.SHOW_COGNATES),
      centerDeityId: deity.id,
    });

    renderSidebar(deity, connections, store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER));
    renderSurprisingCard(deity, metric);
    setStatusBar(
      `${deity.id} · ${connections.length} connection${connections.length !== 1 ? 's' : ''} · ${metric}`
    );
  } catch (error) {
    console.error('[generate]', error);
    toast('Error generating network');
  } finally {
    showLoading(false);
  }
}

/* ── Node click handler ──────────────────────────────────────────── */
function handleNodeClick(d, evt) {
  const mode = store.get(STATE_KEYS.MODE);

  if (mode === 'compare') {
    if (!store.get('compareA')) {
      store.set('compareA', d);
      toast(`Compare: ${d.id} selected — now click another deity`);
      return;
    }
    store.set('compareB', d);
    showCompareModal(store.get('compareA'), store.get('compareB'));
    store.set('compareA', null);
    store.set('compareB', null);
    return;
  }

  if (mode === 'path') {
    if (!store.get('pathFrom')) {
      store.set('pathFrom', d);
      toast(`Path: ${d.id} → click destination deity`);
      return;
    }
    store.set('pathTo', d);
    runPathFind(store.get('pathFrom'), store.get('pathTo'));
    store.set('pathFrom', null);
    store.set('pathTo', null);
    return;
  }

  // Explore mode
  const deity = getDeityById(d.id);
  if (!deity) return;
  store.set(STATE_KEYS.SELECTED_DEITY, deity.id);
  const input = LocalState.searchBar?.input || document.querySelector('.search-input') || document.getElementById('deity-input');
  if (input) input.value = deity.id;
  generate();
}

/* ── Tooltip handlers ────────────────────────────────────────────── */
function handleNodeHover(evt, d, edges) {
  const edge = edges.find(e => {
    const sid = typeof e.source === 'object' ? e.source.id : e.source;
    const tid = typeof e.target === 'object' ? e.target.id : e.target;
    return sid === d.id || tid === d.id;
  });

  const centerId = store.get(STATE_KEYS.SELECTED_DEITY);
  const isCenter = centerId && d.id === centerId;
  const col = PANTHEON_COLORS[d.pantheon] || '#888';
  const activeFilter = store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);

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
          `<span class="tt-trait${activeFilter === t ? ' active-trait' : ''}">${t}</span>`
        ).join('')}
      </div>`;
    }
    if (edge.cognate) {
      html += `<div class="tt-cognate">⟡ PIE cognate: ${edge.cognate.note}</div>`;
    }
  }

  const mode = store.get(STATE_KEYS.MODE);
  html += `<div class="tt-hint">${
    isCenter
      ? 'Center node'
      : mode === 'explore'
        ? 'Click to expand · Double-click to pin'
        : mode === 'compare'
          ? 'Click to select for comparison'
          : 'Click to select as path endpoint'
  }</div>`;

  showTooltip(html, evt);
}

function handleEdgeHover(evt, d) {
  const sid = typeof d.source === 'object' ? d.source.id : d.source;
  const tid = typeof d.target === 'object' ? d.target.id : d.target;
  const activeFilter = store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);

  let html = `
    <div class="tt-title">${sid} ↔ ${tid}</div>
    <div class="tt-score">Similarity: <strong>${d.weight.toFixed(3)}</strong></div>
  `;
  if (d.shared?.length) {
    html += `<div class="tt-traits">
      ${d.shared.map(t =>
        `<span class="tt-trait${activeFilter === t ? ' active-trait' : ''}">${t}</span>`
      ).join('')}
    </div>`;
  }
  if (d.cognate) {
    html += `<div class="tt-cognate">⟡ PIE cognate: ${d.cognate.note}</div>`;
  }
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
  setTimeout(() => {
    if (tt.style.opacity === '0') tt.style.display = 'none';
  }, 120);
}

/* ── Trait filter ────────────────────────────────────────────────── */
function handleTraitClick(trait) {
  const current = store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);
  const next = current === trait ? null : trait;
  store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, next);

  if (next) {
    highlightByTrait(next, LocalState.edges);
    toast(`Filtering edges by trait: ${next}`);
  } else {
    clearHighlight();
  }

  const centerId = store.get(STATE_KEYS.SELECTED_DEITY);
  if (centerId) {
    const deity = getDeityById(centerId);
    if (deity) renderHeatmap(deity, next);
  }
}

/* ── Tour load ───────────────────────────────────────────────────── */
async function handleTourLoad(tour) {
  LocalState.nodes = [];
  LocalState.edges = [];
  store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
  clearHighlight();

  const center = getDeityById(tour.centerDeity);
  if (!center) return;

  store.set(STATE_KEYS.SELECTED_DEITY, center.id);
  const input = LocalState.searchBar?.input || document.querySelector('.search-input') || document.getElementById('deity-input');
  if (input) input.value = center.id;

  const W = document.getElementById('view-area')?.clientWidth || 800;
  const H = document.getElementById('view-area')?.clientHeight || 600;
  const tourDeities = tour.deities.map(id => getDeityById(id)).filter(Boolean);

  // Place center
  LocalState.nodes.push({ ...center, x: W / 2, y: H / 2 });

  // Ring layout for other deities
  tourDeities.filter(d => d.id !== center.id).forEach((d, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2;
    LocalState.nodes.push({
      ...d,
      x: W / 2 + Math.cos(angle) * 160,
      y: H / 2 + Math.sin(angle) * 120,
    });
  });

  // Build all pairwise edges within the tour
  const metric = store.get(STATE_KEYS.SIMILARITY_METHOD);
  for (let i = 0; i < LocalState.nodes.length; i++) {
    for (let j = i + 1; j < LocalState.nodes.length; j++) {
      const a = LocalState.nodes[i];
      const b = LocalState.nodes[j];
      const score = await workerClient.computeSimilarity(a, b, metric);
      if (score >= 0.25) {
        LocalState.edges.push({
          _key: `${a.id}--${b.id}`,
          source: a.id,
          target: b.id,
          weight: score,
          shared: sharedTraits(a, b),
          cognate: getCognate(a.id, b.id),
        });
      }
    }
  }

  switchView('graph');

  renderGraph(LocalState.nodes, LocalState.edges, {
    animate: true,
    showLabels: store.get('showLabels') ?? true,
    cluster: false,
    showCognates: true,
    centerDeityId: center.id,
  });

  renderTourNarrative(tour);

  const centerConns = await workerClient.getConnections(center, DEITIES, metric, 0.25);
  renderSidebar(center, centerConns, null);
  setStatusBar(`Tour: ${tour.name} · ${LocalState.nodes.length} deities`);
}

/* ── Path finder (Web Worker) ────────────────────────────────────── */
async function runPathFind(from, to) {
  const metric = store.get(STATE_KEYS.SIMILARITY_METHOD);
  const threshold = store.get(STATE_KEYS.GRAPH_THRESHOLD);

  showLoading(true);
  toast('Finding path...');

  try {
    const path = await workerClient.findPath(
      from.id, to.id, DEITIES, metric, Math.max(0.2, threshold - 0.1)
    );

    if (!path) {
      toast(`No path found between ${from.id} and ${to.id} — try lowering the threshold`);
      return;
    }

    LocalState.nodes = [];
    LocalState.edges = [];

    const W = document.getElementById('view-area')?.clientWidth || 800;
    const H = document.getElementById('view-area')?.clientHeight || 600;

    for (let i = 0; i < path.length; i++) {
      const d = path[i];
      LocalState.nodes.push({
        ...d,
        x: W * 0.1 + (i / (path.length - 1)) * W * 0.8,
        y: H / 2 + (Math.random() - 0.5) * 80,
      });
      if (i > 0) {
        const score = await workerClient.computeSimilarity(path[i - 1], path[i], metric);
        LocalState.edges.push({
          _key: `${path[i - 1].id}--${path[i].id}`,
          source: path[i - 1].id,
          target: path[i].id,
          weight: score,
          shared: sharedTraits(path[i - 1], path[i]),
          cognate: getCognate(path[i - 1].id, path[i].id),
        });
      }
    }

    store.set(STATE_KEYS.SELECTED_DEITY, path[0].id);

    // Render path strip
    const strip = document.getElementById('path-strip');
    if (strip) {
      strip.style.display = 'flex';
      document.getElementById('path-content').innerHTML = path.map((d, i) =>
        `${i > 0 ? '<span class="path-arrow">→</span>' : ''}
         <span class="path-node" onclick="window._app.loadDeity('${d.id}')"
               style="border-color:${PANTHEON_COLORS[d.pantheon]}">${d.id}</span>`
      ).join('');
    }

    renderGraph(LocalState.nodes, LocalState.edges, {
      animate: true,
      showLabels: true,
      showCognates: store.get(STATE_KEYS.SHOW_COGNATES),
      centerDeityId: from.id,
    });

    toast(`Path: ${path.map(d => d.id).join(' → ')}`);
  } catch (error) {
    console.error('[runPathFind]', error);
    toast('Error finding path');
  } finally {
    showLoading(false);
  }
}

/* ── Compare modal (Web Worker) ──────────────────────────────────── */
async function showCompareModal(a, b) {
  const modal = document.getElementById('compare-modal');
  if (!modal) return;

  const metric = store.get(STATE_KEYS.SIMILARITY_METHOD);
  const score = await workerClient.computeSimilarity(a, b, metric);
  const shared = sharedTraits(a, b);
  const cog = getCognate(a.id, b.id);
  const colA = PANTHEON_COLORS[a.pantheon] || '#888';
  const colB = PANTHEON_COLORS[b.pantheon] || '#888';

  const va = traitVector(a);
  const vb = traitVector(b);

  document.getElementById('compare-content').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;margin-bottom:16px;align-items:start">
      <div>
        <div style="font-family:var(--font-display);font-size:16px;color:${colA}">${a.id}</div>
        <div style="font-size:11px;color:var(--text-secondary)">${a.pantheon} · ${a.epithet}</div>
      </div>
      <div style="text-align:center;padding-top:6px">
        <div style="font-size:22px;color:var(--text-muted);font-family:var(--font-display)">vs</div>
        <div style="font-size:18px;font-weight:700;color:var(--gold-bright);margin-top:3px">${score.toFixed(3)}</div>
        <div style="font-size:10px;color:var(--text-muted)">${metric} similarity</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:var(--font-display);font-size:16px;color:${colB}">${b.id}</div>
        <div style="font-size:11px;color:var(--text-secondary)">${b.pantheon} · ${b.epithet}</div>
      </div>
    </div>

    ${cog ? `
      <div class="card" style="border-color:rgba(212,165,116,.3);padding:9px 12px;font-size:11px;color:var(--gold);margin-bottom:12px">
        ⟡ Known PIE cognate: ${cog.note}
        <span style="color:var(--text-muted)">(${cog.confidence} · ${cog.source})</span>
      </div>` : ''}

    ${shared.length ? `
      <div style="margin-bottom:12px">
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">Shared traits (${shared.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${shared.map(t => `<span class="badge">${t}</span>`).join('')}
        </div>
      </div>` : ''}

    <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">
      ← ${a.id} intensity · trait · ${b.id} intensity →
    </div>
    ${TRAITS.map((t, i) => {
      if (va[i] === 0 && vb[i] === 0) return '';
      return `
        <div class="compare-trait-row">
          <div class="compare-bar-wrap">
            <div class="compare-bar" style="width:${(va[i] * 100).toFixed(0)}%;background:${colA};float:right"></div>
          </div>
          <div class="compare-trait-name">${t}</div>
          <div class="compare-bar-wrap">
            <div class="compare-bar" style="width:${(vb[i] * 100).toFixed(0)}%;background:${colB}"></div>
          </div>
        </div>`;
    }).join('')}
  `;

  modal.classList.add('open');
}

/* ── View switching ──────────────────────────────────────────────── */
export function switchView(view) {
  store.set(STATE_KEYS.CURRENT_VIEW, view);

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.header-tab[data-view]').forEach(el =>
    el.classList.toggle('active', el.dataset.view === view)
  );

  const viewEl = document.getElementById(`${view}-view`);
  if (viewEl) viewEl.classList.add('active');

  if (view === 'matrix') {
    renderMatrix(store.get(STATE_KEYS.SIMILARITY_METHOD));
  } else if (view === 'archetypes') {
    renderArchetypes();
  }
}

/* ── Wire all UI controls ────────────────────────────────────────── */
function wireControls() {
  // Generate button (supports new SearchBar component or legacy)
  document.getElementById('gen-btn')?.addEventListener('click', () => {
    const input = LocalState.searchBar?.input || document.querySelector('.search-input') || document.getElementById('deity-input');
    const name = input?.value.trim();
    if (name) loadDeity(name, { resetGraph: true });
  });

  // Enter key listener for the search wrap
  document.getElementById('search-wrap')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = LocalState.searchBar?.input || document.querySelector('.search-input') || document.getElementById('deity-input');
      const name = input?.value.trim();
      // Only trigger if the dropdown isn't already handling the Enter key
      if (name && LocalState.searchBar && !LocalState.searchBar.isOpen) {
        loadDeity(name, { resetGraph: true });
        LocalState.searchBar.close();
      }
    }
  });

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
      store.set(STATE_KEYS.MODE, btn.dataset.mode);
      document.querySelectorAll('.header-tab[data-mode]').forEach(b =>
        b.classList.toggle('active', b.dataset.mode === store.get(STATE_KEYS.MODE))
      );
      const mode = store.get(STATE_KEYS.MODE);
      if (mode === 'compare') toast('Compare: click two nodes');
      if (mode === 'path') toast('Path: click start → then destination');
    });
  });

  // Link mode
  document.querySelectorAll('.tab-btn[data-link]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.set('linkMode', btn.dataset.link);
      document.querySelectorAll('.tab-btn[data-link]').forEach(b =>
        b.classList.toggle('active', b.dataset.link === store.get('linkMode'))
      );
      if (store.get(STATE_KEYS.SELECTED_DEITY)) {
        LocalState.nodes = [];
        LocalState.edges = [];
        generate();
      }
    });
  });

  // Metric
  document.querySelectorAll('.tab-btn[data-metric]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.set(STATE_KEYS.SIMILARITY_METHOD, btn.dataset.metric);
      document.querySelectorAll('.tab-btn[data-metric]').forEach(b =>
        b.classList.toggle('active', b.dataset.metric === store.get(STATE_KEYS.SIMILARITY_METHOD))
      );
    });
  });

  // Threshold slider
  const thSlider = document.getElementById('thresh-sl');
  const thVal = document.getElementById('thresh-val');
  thSlider?.addEventListener('input', () => {
    const value = parseFloat(thSlider.value) / 100;
    store.set(STATE_KEYS.GRAPH_THRESHOLD, value);
    if (thVal) thVal.textContent = value.toFixed(2);
  });

  // Era slider
  const eraSlider = document.getElementById('era-sl');
  const eraVal = document.getElementById('era-val');
  const eraLabels = ['All', '500 CE', '200 BCE', '800 BCE', '1500 BCE', '2000 BCE'];
  eraSlider?.addEventListener('input', () => {
    const value = parseInt(eraSlider.value);
    store.set(STATE_KEYS.ERA_FILTER, value);
    if (eraVal) eraVal.textContent = eraLabels[value];
  });

  // Toggle: cluster
  document.getElementById('cluster-cb')?.addEventListener('change', e => {
    store.set('clusterByPan', e.target.checked);
    if (store.get(STATE_KEYS.SELECTED_DEITY)) generate();
  });

  // Toggle: expand on click
  document.getElementById('expand-cb')?.addEventListener('change', e => {
    store.set('expandOnClick', e.target.checked);
  });

  // Toggle: labels
  document.getElementById('labels-cb')?.addEventListener('change', e => {
    store.set('showLabels', e.target.checked);
    setLabelsVisible(e.target.checked);
  });

  // Toggle: animate
  document.getElementById('anim-cb')?.addEventListener('change', e => {
    store.set('animateEntrance', e.target.checked);
  });

  // Cognates button
  document.getElementById('cognate-btn')?.addEventListener('click', () => {
    const next = !store.get(STATE_KEYS.SHOW_COGNATES);
    store.set(STATE_KEYS.SHOW_COGNATES, next);
    document.getElementById('cognate-btn')?.classList.toggle('btn-active', next);
    toast(next ? 'Cognate pairs highlighted in gold' : 'Cognate highlighting off');
  });

  // Graph controls
  document.getElementById('zoom-in-btn')?.addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn')?.addEventListener('click', zoomOut);
  document.getElementById('reset-zoom-btn')?.addEventListener('click', resetZoom);

  document.getElementById('clear-btn')?.addEventListener('click', () => {
    LocalState.nodes = [];
    LocalState.edges = [];
    store.set(STATE_KEYS.SELECTED_DEITY, null);
    store.set(STATE_KEYS.PINNED_NODES, new Set());
    clearGraph();
    clearSidebar();
    clearTour();
    const input = LocalState.searchBar?.input || document.querySelector('.search-input') || document.getElementById('deity-input');
    if (input) input.value = '';
    const pathStrip = document.getElementById('path-strip');
    if (pathStrip) pathStrip.style.display = 'none';
    const surprisingPanel = document.getElementById('surprising-panel');
    if (surprisingPanel) surprisingPanel.style.display = 'none';
    setStatusBar('');
  });

  document.getElementById('unpin-btn')?.addEventListener('click', () => {
    unpinAll(LocalState.nodes);
    store.set(STATE_KEYS.PINNED_NODES, new Set());
    toast('All nodes unpinned');
  });

  // Path strip close
  document.getElementById('path-strip-close')?.addEventListener('click', () => {
    const strip = document.getElementById('path-strip');
    if (strip) strip.style.display = 'none';
  });

  // Compare modal close
  document.getElementById('compare-close')?.addEventListener('click', () => {
    document.getElementById('compare-modal')?.classList.remove('open');
  });
  document.getElementById('compare-modal')?.addEventListener('click', e => {
    if (e.target.id === 'compare-modal') {
      document.getElementById('compare-modal')?.classList.remove('open');
    }
  });

  // Export
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    const filename = exportJSON({
      nodes: LocalState.nodes,
      edges: LocalState.edges,
      centerDeity: store.get(STATE_KEYS.SELECTED_DEITY),
      metric: store.get(STATE_KEYS.SIMILARITY_METHOD),
      threshold: store.get(STATE_KEYS.GRAPH_THRESHOLD),
    });
    if (filename) toast(`Exported: ${filename}`);
    else toast('Generate a network first');
  });

  document.getElementById('export-svg-btn')?.addEventListener('click', () => {
    const filename = exportSVG();
    if (filename) toast(`Exported: ${filename}`);
  });
}

/* ── Legend ───────────────────────────────────────────────────────── */
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

/* ── Loading indicator ───────────────────────────────────────────── */
function showLoading(visible) {
  const el = document.getElementById('loading-indicator');
  if (el) el.style.display = visible ? 'block' : 'none';
}

/* ── Public API (exposed to window for inline handlers) ──────────── */
window._app = {
  loadDeity: (id) => loadDeity(id),
  loadDeityFromPantheon: (pantheon) => {
    const matches = DEITIES.filter(d => d.pantheon === pantheon);
    if (matches.length) {
      loadDeity(matches[Math.floor(Math.random() * matches.length)].id, { resetGraph: true });
    }
  },
  switchView,
  toast,
};
