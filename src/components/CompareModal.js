import { getDeityById, traitVector, computeSimilarity, sharedTraits } from '../utils/similarity.js';
import { TRAITS, PANTHEON_COLORS } from '../data/deities.js';
import { getCognate } from '../data/cognates.js';
import { STATE_KEYS } from '../utils/store.js';

export class CompareModal {
  constructor(store) {
    this.store = store;
    this.container = null;
  }

  mount(container) {
    this.container = container;
    this.bindEvents();

    // Subscribe to compare state
    this.store.subscribe(STATE_KEYS.COMPARE_B, () => {
      const a = this.store.get(STATE_KEYS.COMPARE_A);
      const b = this.store.get(STATE_KEYS.COMPARE_B);
      if (a && b) this.render(a, b);
    });
  }

  bindEvents() {
    this.container?.querySelector('#compare-close')?.addEventListener('click', () => {
      this.container.classList.remove('open');
      this.store.set(STATE_KEYS.COMPARE_A, null);
      this.store.set(STATE_KEYS.COMPARE_B, null);
    });

    this.container?.addEventListener('click', e => {
      if (e.target === this.container) {
        this.container.classList.remove('open');
        this.store.set(STATE_KEYS.COMPARE_A, null);
        this.store.set(STATE_KEYS.COMPARE_B, null);
      }
    });
  }

  render(idA, idB) {
    const a = getDeityById(idA);
    const b = getDeityById(idB);
    if (!a || !b) return;

    const content = this.container.querySelector('#compare-content');
    if (!content) return;

    const va = traitVector(a);
    const vb = traitVector(b);
    const colA = PANTHEON_COLORS[a.pantheon] || '#888';
    const colB = PANTHEON_COLORS[b.pantheon] || '#888';

    // similarity + shared traits + cognate
    const score = computeSimilarity(a, b, this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine');
    const shared = sharedTraits(a, b);
    const cog = getCognate(a.id, b.id);
    const metric = this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine';

    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;margin-bottom:16px;align-items:start">
        <div>
          <div style="font-family:var(--font-serif);font-size:16px;color:${colA}">${a.id}</div>
          <div style="font-size:11px;color:var(--text-2)">${a.pantheon} · ${a.epithet || ''}</div>
          ${a.originalScript ? `<div style="font-size:13px;margin-top:2px;opacity:.7">${a.originalScript}</div>` : ''}
        </div>
        <div style="text-align:center;padding-top:4px">
          <div style="font-size:14px;color:var(--text-3);font-family:var(--font-serif)">vs</div>
          <div style="font-size:20px;font-weight:700;color:var(--gold-bright);margin-top:2px">${score.toFixed(3)}</div>
          <div style="font-size:10px;color:var(--text-3)">${metric} similarity</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--font-serif);font-size:16px;color:${colB}">${b.id}</div>
          <div style="font-size:11px;color:var(--text-2)">${b.pantheon} · ${b.epithet || ''}</div>
          ${b.originalScript ? `<div style="font-size:13px;margin-top:2px;opacity:.7">${b.originalScript}</div>` : ''}
        </div>
      </div>

      ${cog ? `
        <div class="card" style="border-color:rgba(245,158,11,.3);padding:9px 12px;font-size:11px;color:var(--gold);margin-bottom:12px">
          ⟡ Known PIE cognate: ${cog.note}
          <span style="color:var(--text-3)">(${cog.confidence} · ${cog.source})</span>
        </div>` : ''}

      ${shared.length ? `
        <div style="margin-bottom:14px">
          <div style="font-size:10px;color:var(--text-3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Shared traits (${shared.length})</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px">
            ${shared.map(t => `<span class="badge">${t}</span>`).join('')}
          </div>
        </div>` : ''}

      <div style="font-size:10px;color:var(--text-3);margin-bottom:8px;text-align:center">
        ← ${a.id} · trait · ${b.id} →
      </div>
      ${TRAITS.map((t, i) => {
        if ((va[i] || 0) === 0 && (vb[i] || 0) === 0) return '';
        return `
          <div class="compare-trait-row">
            <div class="compare-bar-wrap">
              <div class="compare-bar" style="width:${((va[i] || 0) * 100).toFixed(0)}%;background:${colA};float:right"></div>
            </div>
            <div class="compare-trait-name">${t}</div>
            <div class="compare-bar-wrap">
              <div class="compare-bar" style="width:${((vb[i] || 0) * 100).toFixed(0)}%;background:${colB}"></div>
            </div>
          </div>`;
      }).join('')}
    `;

    this.container.classList.add('open');
  }
}