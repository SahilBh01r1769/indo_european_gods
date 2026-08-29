import { PANTHEON_COLORS } from '../data/deities.js';

export class Legend {
  constructor(store, generator) {
    this.store = store;
    this.generator = generator;
    this.container = null;
  }

  mount(parentContainer) {
    const el = document.createElement('div');
    el.id = 'pantheon-legend';
    el.className = 'pantheon-legend';
    parentContainer.appendChild(el);
    this.container = el;
    this.render();
  }

  render() {
    if (!this.container) return;

    const comparative = new Set(['Egyptian', 'Mesopotamian']);
    const entries = Object.entries(PANTHEON_COLORS);
    const inherited = entries.filter(([name]) => !comparative.has(name));
    const outgroups = entries.filter(([name]) => comparative.has(name));

    const renderItems = items => items.map(([pantheon, color]) => `
      <span class="legend-item" title="${pantheon} tradition">
        <span class="legend-dot" style="background:${color}"></span>
        <span class="legend-name">${pantheon}</span>
      </span>`).join('');

    this.container.innerHTML = `
      <div class="legend-group">
        <span class="legend-group-title">Indo-European</span>
        <div class="legend-items">${renderItems(inherited)}</div>
      </div>
      ${outgroups.length ? `
        <div class="legend-divider" aria-hidden="true"></div>
        <div class="legend-group legend-group-secondary">
          <span class="legend-group-title">Comparative</span>
          <div class="legend-items">${renderItems(outgroups)}</div>
        </div>` : ''}`;
  }
}
