import { STATE_KEYS } from '../utils/store.js';

export class Router {
  constructor(store) {
    this.store = store;
    this.views = ['graph', 'matrix', 'archetypes', 'map'];
  }

  setup() {
    this.store.subscribe(STATE_KEYS.CURRENT_VIEW, view => this.renderView(view));
    this.renderTabs();
    this.bindTabEvents();
    this.renderView(this.store.get(STATE_KEYS.CURRENT_VIEW));
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