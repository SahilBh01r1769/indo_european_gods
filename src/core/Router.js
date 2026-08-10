import { STATE_KEYS } from '../utils/store.js';

export class Router {
  constructor(store) {
    this.store = store;
    this.views = ['graph', 'matrix', 'archetypes', 'map'];
    this._writing = false; // prevent feedback loops
  }

  setup() {
    this.store.subscribe(STATE_KEYS.CURRENT_VIEW, view => this.renderView(view));
    this.renderTabs();
    this.bindTabEvents();

    // Restore from URL on load
    this.readHash();

    // Write URL when key state changes
    const writeKeys = [
      STATE_KEYS.SELECTED_DEITY,
      STATE_KEYS.LINK_MODE,
      STATE_KEYS.SIMILARITY_METHOD,
      STATE_KEYS.GRAPH_THRESHOLD,
      STATE_KEYS.CURRENT_VIEW,
    ];
    writeKeys.forEach(key => {
      this.store.subscribe(key, () => this.writeHash());
    });

    this.renderView(this.store.get(STATE_KEYS.CURRENT_VIEW));

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
      this.renderTabs();
    }
    if (p.mode) this.store.set(STATE_KEYS.LINK_MODE, p.mode);
    if (p.metric) this.store.set(STATE_KEYS.SIMILARITY_METHOD, p.metric);
    if (p.t) {
      const t = parseFloat(p.t);
      if (!Number.isNaN(t)) this.store.set(STATE_KEYS.GRAPH_THRESHOLD, t);
    }
    if (p.deity) {
      // Let App/generator load after boot — dispatch event
      window.dispatchEvent(new CustomEvent('router:loadDeity', { detail: p.deity }));
    }
  }

  writeHash() {
    this._writing = true;
    const deity = this.store.get(STATE_KEYS.SELECTED_DEITY);
    const mode = this.store.get(STATE_KEYS.LINK_MODE) || 'top5';
    const metric = this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine';
    const t = this.store.get(STATE_KEYS.GRAPH_THRESHOLD) ?? 0.35;
    const view = this.store.get(STATE_KEYS.CURRENT_VIEW) || 'graph';

    const parts = [`view=${view}`, `mode=${mode}`, `metric=${metric}`, `t=${t}`];
    if (deity) parts.unshift(`deity=${encodeURIComponent(deity)}`);

    const next = '#' + parts.join('&');
    if (location.hash !== next) {
      history.replaceState(null, '', next);
    }
    this._writing = false;
  }

  renderTabs() {
    const container = document.getElementById('view-tabs');
    if (!container) return;
    container.innerHTML = this.views.map(v => `
      <button class="header-tab ${v === this.store.get(STATE_KEYS.CURRENT_VIEW) ? 'active' : ''}"
              data-view="${v}">
        ${v.charAt(0).toUpperCase() + v.slice(1)}
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
  }
}
