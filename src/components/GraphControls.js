import { STATE_KEYS } from '../utils/store.js';
import { exportJSON, exportSVG } from '../utils/export.js';

export class GraphControls {
  constructor(store, generator, feedback) {
    this.store = store;
    this.generator = generator;
    this.feedback = feedback;
    this.container = null;
    this._regenTimer = null;
  }

  mount(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="controls-bar">
        <div class="control-group">
          <button class="btn btn-sm btn-gold" id="surprise-btn" title="Random deity">✦ Surprise</button>
          <button class="btn btn-sm btn-danger" id="clear-btn" title="Clear network">✕ Clear</button>
        </div>

        <div class="control-group">
          <div class="tab-group" id="link-mode-tabs">
            <button class="tab-btn" data-link="kin" id="link-kin" title="Show only the single closest deity">Kin</button>
            <button class="tab-btn active" data-link="top5">Top 5</button>
            <button class="tab-btn" data-link="top10">Top 10</button>
            <button class="tab-btn" data-link="all">All</button>
          </div>
        </div>

        <div class="control-group">
          <div class="tab-group" id="metric-tabs">
            <button class="tab-btn active" data-metric="cosine">Cosine</button>
            <button class="tab-btn" data-metric="overlap">Overlap</button>
          </div>
        </div>

        <div class="control-group slider-row">
          <span class="slider-label">Threshold</span>
          <input type="range" id="thresh-sl" min="0" max="100" value="35" />
          <span class="slider-val" id="thresh-val">0.35</span>
        </div>

        <div class="control-group">
          <span class="slider-label">Era</span>
          <select id="era-select" class="btn btn-sm" title="Show traditions attested by this period">
            <option value="all">All eras</option>
            <option value="-2000">By 2000 BCE</option>
            <option value="-1500">By 1500 BCE</option>
            <option value="-800">By 800 BCE</option>
            <option value="-100">By 100 BCE</option>
            <option value="800">By 800 CE</option>
            <option value="1200">By 1200 CE</option>
          </select>
        </div>

        <div class="control-group">
          <label class="toggle-row">
            <span class="toggle-label">Cluster</span>
            <div class="toggle"><input type="checkbox" id="cluster-cb" /><span class="toggle-track"></span></div>
          </label>
          <label class="toggle-row">
            <span class="toggle-label">Labels</span>
            <div class="toggle"><input type="checkbox" id="labels-cb" checked /><span class="toggle-track"></span></div>
          </label>
          <label class="toggle-row">
            <span class="toggle-label">Expand</span>
            <div class="toggle"><input type="checkbox" id="expand-cb" checked /><span class="toggle-track"></span></div>
          </label>
        </div>

        <div class="control-group">
          <button class="btn btn-sm" id="compare-btn" title="Compare two deities">⚖ Compare</button>
          <button class="btn btn-sm" id="path-btn" title="Find shortest similarity chain">↝ Path</button>
          <button class="btn btn-sm" id="cognate-btn" title="Toggle cognate highlighting">Cognates</button>
        </div>

        <div class="control-group">
          <button class="btn btn-sm btn-icon" id="zoom-in-btn" title="Zoom in">+</button>
          <button class="btn btn-sm btn-icon" id="zoom-out-btn" title="Zoom out">−</button>
          <button class="btn btn-sm btn-icon" id="reset-zoom-btn" title="Reset zoom">⌂</button>
          <button class="btn btn-sm" id="unpin-btn" title="Unpin all">Unpin</button>
        </div>

        <div class="control-group">
          <button class="btn btn-sm btn-ghost" id="export-json-btn" title="Export JSON">↓ JSON</button>
          <button class="btn btn-sm btn-ghost" id="export-svg-btn" title="Export SVG">↓ SVG</button>
          <button class="btn btn-sm btn-ghost" id="methodology-btn" title="How calculations work">? Methodology</button>
        </div>
      </div>`;

    this.bindEvents();
    this._syncControls();
  }

  setupSubscriptions() {
    this.store.subscribe(STATE_KEYS.SELECTED_DEITY, () => this._updateKinButton());
    this.store.subscribe(STATE_KEYS.GRAPH_DATA, () => {
      this._updateKinButton();
      this._updatePathButton();
    });

    this.store.subscribe(STATE_KEYS.GRAPH_THRESHOLD, v => {
      const sl = this.container?.querySelector('#thresh-sl');
      const val = this.container?.querySelector('#thresh-val');
      if (sl) sl.value = Math.round((v ?? 0.35) * 100);
      if (val) val.textContent = (v ?? 0.35).toFixed(2);
    });

    this.store.subscribe(STATE_KEYS.LINK_MODE, mode => {
      this.container?.querySelectorAll('#link-mode-tabs .tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.link === mode)
      );
    });

    this.store.subscribe(STATE_KEYS.SIMILARITY_METHOD, metric => {
      this.container?.querySelectorAll('#metric-tabs .tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.metric === metric)
      );
    });

    this.store.subscribe(STATE_KEYS.ERA_FILTER, cutoff => {
      const select = this.container?.querySelector('#era-select');
      if (select) select.value = cutoff == null ? 'all' : String(cutoff);
    });
  }

  _syncControls() {
    const threshold = this.store.get(STATE_KEYS.GRAPH_THRESHOLD) ?? 0.35;
    const cutoff = this.store.get(STATE_KEYS.ERA_FILTER);
    const thresholdInput = this.container?.querySelector('#thresh-sl');
    const thresholdValue = this.container?.querySelector('#thresh-val');
    const eraSelect = this.container?.querySelector('#era-select');

    if (thresholdInput) thresholdInput.value = Math.round(threshold * 100);
    if (thresholdValue) thresholdValue.textContent = threshold.toFixed(2);
    if (eraSelect) eraSelect.value = cutoff == null ? 'all' : String(cutoff);

    this._updateKinButton();
    this._updatePathButton();
  }

  _autoRegenerate() {
    const hasDeity = !!this.store.get(STATE_KEYS.SELECTED_DEITY);
    const hasTrait = !!this.store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);
    if (!hasDeity && !hasTrait) return;

    this.store.set(STATE_KEYS.GRAPH_DATA, { nodes: [], edges: [] });
    this.generator.generate();
  }

  _updateKinButton() {
    const btn = this.container?.querySelector('#link-kin');
    if (!btn) return;
    btn.disabled = !this.store.get(STATE_KEYS.SELECTED_DEITY);
  }

  _updatePathButton() {
    const btn = this.container?.querySelector('#path-btn');
    if (!btn) return;
    const n = this.store.get(STATE_KEYS.GRAPH_DATA)?.nodes?.length || 0;
    btn.disabled = n < 2;
  }

  bindEvents() {
    const $ = id => this.container?.querySelector(`#${id}`);

    $('surprise-btn')?.addEventListener('click', () => this.generator.surprise());

    $('clear-btn')?.addEventListener('click', () => {
      this.generator.clearGraph();
      const searchInput = document.querySelector('.search-input');
      if (searchInput) searchInput.value = '';
      const pathStrip = document.getElementById('path-strip');
      const surprisingPanel = document.getElementById('surprising-panel');
      if (pathStrip) pathStrip.style.display = 'none';
      if (surprisingPanel) surprisingPanel.style.display = 'none';
      document.getElementById('path-btn')?.classList.remove('btn-active');
      document.getElementById('compare-btn')?.classList.remove('btn-active');
      this.store.set(STATE_KEYS.MODE, 'explore');
    });

    $('link-mode-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn || btn.disabled) return;
      this.store.set(STATE_KEYS.LINK_MODE, btn.dataset.link);
      this._autoRegenerate();
    });

    $('metric-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      this.store.set(STATE_KEYS.SIMILARITY_METHOD, btn.dataset.metric);
      this._autoRegenerate();
    });

    $('thresh-sl')?.addEventListener('input', e => {
      const value = Number(e.target.value) / 100;
      this.store.set(STATE_KEYS.GRAPH_THRESHOLD, value);
      clearTimeout(this._regenTimer);
      this._regenTimer = setTimeout(() => this._autoRegenerate(), 400);
    });

    $('era-select')?.addEventListener('change', e => {
      const cutoff = e.target.value === 'all' ? null : Number(e.target.value);
      this.store.set(STATE_KEYS.ERA_FILTER, cutoff);
      this._autoRegenerate();
    });

    $('cluster-cb')?.addEventListener('change', e => {
      this.store.set(STATE_KEYS.CLUSTER_BY_PAN, e.target.checked);
    });

    $('labels-cb')?.addEventListener('change', e => {
      this.store.set(STATE_KEYS.SHOW_LABELS, e.target.checked);
    });

    $('expand-cb')?.addEventListener('change', e => {
      this.store.set(STATE_KEYS.EXPAND_ON_CLICK, e.target.checked);
    });

    $('compare-btn')?.addEventListener('click', () => {
      const mode = this.store.get(STATE_KEYS.MODE);
      if (mode === 'compare') {
        this.store.set(STATE_KEYS.MODE, 'explore');
        $('compare-btn').classList.remove('btn-active');
        this.store.set(STATE_KEYS.UI_TOAST, 'Compare mode off');
        return;
      }

      this.store.set(STATE_KEYS.MODE, 'compare');
      $('compare-btn').classList.add('btn-active');
      $('path-btn')?.classList.remove('btn-active');
      this.store.set(STATE_KEYS.COMPARE_A, null);
      this.store.set(STATE_KEYS.COMPARE_B, null);
      this.store.set(STATE_KEYS.PATH_FROM, null);
      this.store.set(STATE_KEYS.PATH_TO, null);
      this.store.set(STATE_KEYS.ACTIVE_PATH, []);
      this.store.set(STATE_KEYS.UI_TOAST, 'Compare mode: click two deities');
    });

    $('path-btn')?.addEventListener('click', () => {
      const mode = this.store.get(STATE_KEYS.MODE);
      if (mode === 'path') {
        this.store.set(STATE_KEYS.MODE, 'explore');
        $('path-btn').classList.remove('btn-active');
        this.store.set(STATE_KEYS.PATH_FROM, null);
        this.store.set(STATE_KEYS.PATH_TO, null);
        this.store.set(STATE_KEYS.ACTIVE_PATH, []);
        window.dispatchEvent(new CustomEvent('path:found', { detail: null }));
        this.store.set(STATE_KEYS.UI_TOAST, 'Path mode off');
        return;
      }

      this.store.set(STATE_KEYS.MODE, 'path');
      $('compare-btn')?.classList.remove('btn-active');
      $('path-btn').classList.add('btn-active');
      this.store.set(STATE_KEYS.COMPARE_A, null);
      this.store.set(STATE_KEYS.COMPARE_B, null);
      this.store.set(STATE_KEYS.PATH_FROM, null);
      this.store.set(STATE_KEYS.PATH_TO, null);
      this.store.set(STATE_KEYS.ACTIVE_PATH, []);
      this.store.set(STATE_KEYS.UI_TOAST, 'Path mode: click start, then destination');
    });

    $('cognate-btn')?.addEventListener('click', () => {
      const next = !this.store.get(STATE_KEYS.SHOW_COGNATES);
      this.store.set(STATE_KEYS.SHOW_COGNATES, next);
      $('cognate-btn').classList.toggle('btn-active', next);
      this.store.set(
        STATE_KEYS.UI_TOAST,
        next ? 'Cognate pairs highlighted in gold' : 'Cognate highlighting off',
      );
    });

    $('zoom-in-btn')?.addEventListener('click', () =>
      window.dispatchEvent(new CustomEvent('graph:zoomIn'))
    );
    $('zoom-out-btn')?.addEventListener('click', () =>
      window.dispatchEvent(new CustomEvent('graph:zoomOut'))
    );
    $('reset-zoom-btn')?.addEventListener('click', () =>
      window.dispatchEvent(new CustomEvent('graph:resetZoom'))
    );
    $('unpin-btn')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('graph:unpinAll'));
      this.store.set(STATE_KEYS.UI_TOAST, 'All nodes unpinned');
    });

    $('export-json-btn')?.addEventListener('click', () => {
      const data = this.store.get(STATE_KEYS.GRAPH_DATA);
      const filename = exportJSON({
        nodes: data.nodes,
        edges: data.edges,
        centerDeity: this.store.get(STATE_KEYS.SELECTED_DEITY),
        metric: this.store.get(STATE_KEYS.SIMILARITY_METHOD),
        threshold: this.store.get(STATE_KEYS.GRAPH_THRESHOLD),
      });
      this.store.set(
        STATE_KEYS.UI_TOAST,
        filename ? `Exported: ${filename}` : 'Generate a network first',
      );
    });

    $('export-svg-btn')?.addEventListener('click', () => {
      const filename = exportSVG();
      this.store.set(STATE_KEYS.UI_TOAST, filename ? `Exported: ${filename}` : 'Nothing to export');
    });

    $('methodology-btn')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('methodology:open'));
    });
  }
}
