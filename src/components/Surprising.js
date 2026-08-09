import { getDeityById, getMostSurprisingConnection } from '../utils/similarity.js';
import { PANTHEON_COLORS } from '../data/deities.js';
import { STATE_KEYS } from '../utils/store.js';

export class Surprising {
  constructor(store, generator, feedback) {
    this.store = store;
    this.generator = generator;
    this.feedback = feedback;
    this.container = null;
  }

  mount(container) {
    this.container = container;
  }

  /** Show the most surprising cross-pantheon link for this deity */
  render(deityId) {
    if (!this.container || !deityId) return;

    const deity = getDeityById(deityId);
    if (!deity) {
      this.hide();
      return;
    }

    const metric = this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine';
    const conn = getMostSurprisingConnection(deity, metric);

    if (!conn) {
      this.hide();
      return;
    }

    const colA = PANTHEON_COLORS[deity.pantheon] || '#888';
    const colB = PANTHEON_COLORS[conn.deity.pantheon] || '#888';
    const other = conn.deity;

    this.container.style.display = 'block';
    this.container.innerHTML = `
      <div class="panel-title">
        <span class="panel-icon">⟡</span> Most surprising connection
        <button class="btn btn-sm btn-ghost" id="surprising-close" style="margin-left:auto;padding:2px 6px;">✕</button>
      </div>
      <div class="surprise-card">
        <div class="surprise-score">${conn.score.toFixed(2)}</div>
        <div class="surprise-pair">
          <span style="color:${colA}">${deity.id}</span>
          <span style="color:var(--text-3)"> ↔ </span>
          <span style="color:${colB}">${other.id}</span>
        </div>
        <div style="font-size:10px;color:var(--text-3);margin-bottom:6px;">
          ${deity.pantheon} → ${other.pantheon} · cross-pantheon
        </div>
        ${conn.cognate
          ? `<div class="surprise-note" style="color:var(--gold);">⟡ Cognate: ${conn.cognate.note}</div>`
          : `<div class="surprise-note">
               Shared: ${(conn.shared || []).slice(0, 4).map(t =>
                 `<span class="domain-tag" style="margin:1px 2px;">${t}</span>`
               ).join('') || 'trait profile overlap'}
             </div>`
        }
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="btn btn-sm btn-accent" id="surprising-load">Explore ${other.id} →</button>
        </div>
      </div>
    `;

    this.container.querySelector('#surprising-load')?.addEventListener('click', () => {
      this.generator.loadDeity(other.id, { resetGraph: false });
    });

    this.container.querySelector('#surprising-close')?.addEventListener('click', () => {
      this.hide();
    });
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      this.container.innerHTML = '';
    }
  }
}