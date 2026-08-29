import { STATE_KEYS } from '../utils/store.js';

export class Router {
  constructor(store) {
    this.store = store;
    this.views = ['graph', 'matrix', 'archetypes', 'map'];
    this.linkModes = ['kin', 'top5', 'top10', 'all'];
    this.metrics = ['cosine', 'overlap'];
    this._writing = false;
  }

  setup() {
    this.store.subscribe(STATE_KEYS.CURRENT_VIEW, view => this.renderView(view));
    this.renderTabs();
    this.bindTabEvents();

    const writeKeys = [
      STATE_KEYS.SELECTED_DEITY,
      STATE_KEYS.LINK_MODE,
      STATE_KEYS.SIMILARITY_METHOD,
      STATE_KEYS.GRAPH_THRESHOLD,
      STATE_KEYS.ERA_FILTER,
      STATE_KEYS.CURRENT_VIEW,
    ];
    writeKeys.forEach(key => this.store.subscribe(key, () => this.writeHash()));

    // Subscriptions in App are registered before setup(), so restoring state here
    // can safely trigger the correct view/component render on first load.
    this.readHash();
    this.renderView(this.store.get(STATE_KEYS.CURRENT_VIEW));
    this.renderTabs();

    window.addEventListener('hashchange', () => {
      if (!this._writing) this.readHash();
    });
  }

  parseHash() {
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return {};

    const params = {};
    raw.split('&').forEach(part => {
      const [k, v] = part.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return params;
  }

  readHash() {
    const p = this.parseHash();

    if (p.view && this.views.includes(p.view)) {
      this.store.set(STATE_KEYS.CURRENT_VIEW, p.view);
    }

    if (p.mode && this.linkModes.includes(p.mode)) {
      this.store.set(STATE_KEYS.LINK_MODE, p.mode);
    }

    if (p.metric && this.metrics.includes(p.metric)) {
      this.store.set(STATE_KEYS.SIMILARITY_METHOD, p.metric);
    }

    if (p.t) {
      const threshold = Number(p.t);
      if (Number.isFinite(threshold) && threshold >= 0 && threshold <= 1) {
        this.store.set(STATE_KEYS.GRAPH_THRESHOLD, threshold);
      }
    }

    if (p.era) {
      const cutoff = Number(p.era);
      if (Number.isFinite(cutoff)) this.store.set(STATE_KEYS.ERA_FILTER, cutoff);
    } else {
      this.store.set(STATE_KEYS.ERA_FILTER, null);
    }

    if (p.deity) {
      window.dispatchEvent(new CustomEvent('router:loadDeity', { detail: p.deity }));
    }

    this.renderTabs();
  }

  writeHash() {
    this._writing = true;

    const deity = this.store.get(STATE_KEYS.SELECTED_DEITY);
    const mode = this.store.get(STATE_KEYS.LINK_MODE) || 'top5';
    const metric = this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine';
    const threshold = this.store.get(STATE_KEYS.GRAPH_THRESHOLD) ?? 0.35;
    const cutoff = this.store.get(STATE_KEYS.ERA_FILTER);
    const view = this.store.get(STATE_KEYS.CURRENT_VIEW) || 'graph';

    const parts = [
      `view=${encodeURIComponent(view)}`,
      `mode=${encodeURIComponent(mode)}`,
      `metric=${encodeURIComponent(metric)}`,
      `t=${threshold}`,
    ];

    if (cutoff != null) parts.push(`era=${cutoff}`);
    if (deity) parts.unshift(`deity=${encodeURIComponent(deity)}`);

    const next = '#' + parts.join('&');
    if (location.hash !== next) history.replaceState(null, '', next);
    this._writing = false;
  }

  renderTabs() {
    const container = document.getElementById('view-tabs');
    if (!container) return;

    const current = this.store.get(STATE_KEYS.CURRENT_VIEW);
    container.innerHTML = this.views.map(view => `
      <button class="header-tab ${view === current ? 'active' : ''}" data-view="${view}">
        ${view.charAt(0).toUpperCase() + view.slice(1)}
      </button>
    `).join('');
  }

  bindTabEvents() {
    const container = document.getElementById('view-tabs');
    if (!container) return;

    container.addEventListener('click', e => {
      const btn = e.target.closest('.header-tab');
      if (!btn) return;
      this.store.set(STATE_KEYS.CURRENT_VIEW, btn.dataset.view);
      this.renderTabs();
    });
  }

  renderView(viewName) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`${viewName}-view`);
    if (target) target.classList.add('active');
    this.renderTabs();
  }
}
