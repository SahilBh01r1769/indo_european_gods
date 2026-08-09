import { TOURS } from '../data/tours.js';
import { PANTHEON_COLORS } from '../data/deities.js';
import { getDeityById } from '../utils/similarity.js';
import { STATE_KEYS } from '../utils/store.js';

export class Tours {
  constructor(store, generator, feedback) {
    this.store = store;
    this.generator = generator;
    this.feedback = feedback;
    this.container = null;
    this.activeTourId = null;
    this.currentNarrativeIndex = 0;
  }

  mount(container) {
    this.container = container;
    this.renderTourList();
  }

  setupSubscriptions() {}

  renderTourList() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">✦</span> Guided tours</div>
        <div style="font-size:12px;color:var(--text-2);line-height:1.55;margin-bottom:14px;padding:0 2px">
          Each tour loads a curated group of deities that share a deep mythological pattern 
          (e.g. the Thunder Warrior myth that appears from India to Scandinavia). 
          Click a tour to open its network and read the story behind the connections.
        </div>
        <div class="tour-list">
          ${TOURS.map(tour => this.buildTourCard(tour)).join('')}
        </div>
      </div>`;

    this.container.querySelectorAll('.tour-card').forEach(el => {
      el.addEventListener('click', () => {
        const tourId = el.dataset.tourId;
        this.selectTour(TOURS.find(t => t.id === tourId));
      });
    });
  }

  buildTourCard(tour) {
    const isActive = this.activeTourId === tour.id;
    return `
      <div class="tour-card ${isActive ? 'active' : ''}" data-tour-id="${tour.id}">
        <span class="tour-icon">${tour.icon || '✦'}</span>
        <div class="tour-name">${tour.name}</div>
        <div class="tour-tagline">${tour.tagline || tour.description || ''}</div>
        <div class="tour-deities">
          ${(tour.deities || []).slice(0, 5).map(id => {
            const d = getDeityById(id);
            const col = d ? (PANTHEON_COLORS[d.pantheon] || '#888') : '#888';
            return `<span class="tour-deity-chip" style="color:${col}">${id}</span>`;
          }).join('')}
          ${(tour.deities || []).length > 5 ? `<span class="tour-deity-chip">+${tour.deities.length - 5}</span>` : ''}
        </div>
      </div>`;
  }

  async selectTour(tour) {
    if (!tour || !tour.deities || !tour.deities.length) return;
    this.activeTourId = tour.id;
    this.currentNarrativeIndex = 0;
    this.renderTourList();

    const centerId = tour.centerDeity || tour.deities[0];

    // Load center deity first
    await this.generator.loadDeity(centerId, { resetGraph: true });

    // Add all other tour deities to the graph
    for (const deityId of tour.deities) {
      if (deityId !== centerId) {
        this.store.set(STATE_KEYS.SELECTED_DEITY, deityId);
        await this.generator.generate();
      }
    }

    // Re-center on the original center
    this.store.set(STATE_KEYS.SELECTED_DEITY, centerId);
    this.store.set(STATE_KEYS.UI_TOAST, `Tour: ${tour.name} — ${tour.deities.length} deities loaded`);

    this.renderNarrative(tour);
  }

  renderNarrative(tour) {
    const infoPanel = document.getElementById('stab-info-content');
    if (!infoPanel) return;

    const narrative = tour.narrative || [];
    if (!narrative.length) return;

    const section = narrative[this.currentNarrativeIndex];

    const narrativeHTML = `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">${tour.icon}</span> ${tour.name}</div>
        <div class="tour-narrative">
          <div class="tour-narrative-title">${section.heading || ''}</div>
          <div class="tour-narrative-text">
            ${section.text.split('\n\n').map(p => `<p>${p}</p>`).join('')}
          </div>
          <div class="tour-nav">
            <button class="btn btn-sm btn-ghost" id="tour-prev" ${this.currentNarrativeIndex === 0 ? 'disabled' : ''}>← Prev</button>
            <span style="font-size:10px;color:var(--text-3);align-self:center;">${this.currentNarrativeIndex + 1} / ${narrative.length}</span>
            <button class="btn btn-sm btn-accent" id="tour-next" ${this.currentNarrativeIndex === narrative.length - 1 ? 'disabled' : ''}>Next →</button>
          </div>
        </div>
      </div>
      ${infoPanel.innerHTML}`;

    infoPanel.innerHTML = narrativeHTML;

    infoPanel.querySelector('#tour-prev')?.addEventListener('click', () => {
      if (this.currentNarrativeIndex > 0) {
        this.currentNarrativeIndex--;
        this.renderNarrative(tour);
      }
    });
    infoPanel.querySelector('#tour-next')?.addEventListener('click', () => {
      if (this.currentNarrativeIndex < narrative.length - 1) {
        this.currentNarrativeIndex++;
        this.renderNarrative(tour);
      }
    });
  }

  clear() {
    this.activeTourId = null;
    this.currentNarrativeIndex = 0;
    this.renderTourList();
  }
}
