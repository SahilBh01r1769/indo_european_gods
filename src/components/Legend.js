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
    this.container.innerHTML = Object.entries(PANTHEON_COLORS).map(([p, c]) => `
      <div class="legend-item" data-pantheon="${p}">
        <span class="legend-dot" style="background:${c}"></span>
        <span class="legend-name">${p}</span>
      </div>`).join('');

    this.container.querySelectorAll('.legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const pantheon = item.dataset.pantheon;
        const { DEITIES } = this.store.get('deities') ? { DEITIES: this.store.get('deities') } : {};
        // Load random deity from pantheon
        this.loadFromPantheon(pantheon);
      });
    });
  }

  loadFromPantheon(pantheon) {
    const deities = this.store.get('deities') || [];
    const matches = deities.filter(d => d.pantheon === pantheon);
    if (matches.length) {
      const random = matches[Math.floor(Math.random() * matches.length)];
      this.generator.loadDeity(random.id, { resetGraph: true });
    }
  }
}