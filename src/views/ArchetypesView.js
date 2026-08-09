/* ─────────────────────────────────────────────────────────────────
   views/ArchetypesView.js — Trait index + Museum Dossier (2-column)
   ───────────────────────────────────────────────────────────────── */
import {
  DEITIES, TRAITS, PANTHEON_COLORS,
  TRAIT_ICONS, TRAIT_LORE, normTrait, getTraitValue,
} from '../data/deities.js';
import { STATE_KEYS } from '../utils/store.js';

export class ArchetypesView {
  constructor(store, generator) {
    this.store = store;
    this.generator = generator;
    this.container = null;
  }

  mount(container) { this.container = container; }

  setupSubscriptions() {
    this.store.subscribe(STATE_KEYS.CURRENT_VIEW, view => {
      if (view === 'archetypes') this.render();
    });
    this.store.subscribe(STATE_KEYS.ACTIVE_TRAIT_FILTER, () => {
      if (this.store.get(STATE_KEYS.CURRENT_VIEW) === 'archetypes') this.render();
    });
    if (this.store.get(STATE_KEYS.CURRENT_VIEW) === 'archetypes') this.render();
  }

  render() {
    if (!this.container) return;
    const activeTrait = this.store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);
    if (activeTrait) this.renderDossier(activeTrait);
    else this.renderGrid();
  }

  /* ── Index grid ────────────────────────────────────────────────── */
  renderGrid() {
    let html = `
      <div class="view-inner">
        <div class="view-title">Archetype Explorer</div>
        <div class="view-subtitle">Click any trait to open its dossier — every deity who embodies it, across all pantheons.</div>
        <div class="archetype-grid">`;

    TRAITS.forEach(trait => {
      const deitiesWithTrait = DEITIES.filter(d => getTraitValue(d, trait) > 0);
      html += `
        <div class="archetype-card" data-trait="${trait}">
          <div class="archetype-icon">${TRAIT_ICONS[normTrait(trait)] || '✦'}</div>
          <div class="archetype-name">${trait}</div>
          <div class="archetype-count">${deitiesWithTrait.length} deities</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:6px;">
            ${deitiesWithTrait.slice(0, 8).map(d =>
              `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${PANTHEON_COLORS[d.pantheon]};" title="${d.id}"></span>`
            ).join('')}
            ${deitiesWithTrait.length > 8 ? `<span style="font-size:9px;color:var(--text-3);align-self:center;">+${deitiesWithTrait.length - 8}</span>` : ''}
          </div>
        </div>`;
    });

    html += `</div></div>`;
    this.container.innerHTML = html;

    this.container.querySelectorAll('.archetype-card').forEach(card => {
      card.addEventListener('click', () => {
        this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, card.dataset.trait);
      });
    });
  }

  /* ── Museum Dossier: sticky summary left, spread right ─────────── */
  renderDossier(trait) {
    const icon = TRAIT_ICONS[normTrait(trait)] || '✦';
    const lore = TRAIT_LORE[normTrait(trait)] || '';

    const members = DEITIES
      .map(d => ({ deity: d, value: getTraitValue(d, trait) }))
      .filter(x => x.value > 0)
      .sort((a, b) => b.value - a.value);

    const pantheons = [...new Set(members.map(m => m.deity.pantheon))];
    const heroes = members.slice(0, 3);
    const groups = pantheons.map(p => ({
      pantheon: p,
      members: members.filter(m => m.deity.pantheon === p),
    }));

    let html = `
      <div class="view-inner">
        <div class="dossier">
          <aside class="dossier-aside">
            <div class="dossier-top">
              <button class="btn btn-sm btn-ghost" id="dossier-back">← All</button>
              <button class="btn btn-sm btn-accent" id="dossier-graph">Graph →</button>
            </div>
            <div class="dossier-header">
              <div class="dossier-icon">${icon}</div>
              <div>
                <div class="view-title">${trait}</div>
                <div class="view-subtitle">Archetype dossier</div>
              </div>
            </div>
            <div class="dossier-stats">
              <div class="side-stat"><div class="side-stat-num">${members.length}</div><div class="side-stat-label">deities</div></div>
              <div class="side-stat"><div class="side-stat-num">${pantheons.length}</div><div class="side-stat-label">pantheons</div></div>
              <div class="side-stat"><div class="side-stat-num">${heroes[0] ? Math.round(heroes[0].value * 100) + '%' : '—'}</div><div class="side-stat-label">peak</div></div>
            </div>
            <p class="dossier-lore">${lore}</p>
            <div class="dossier-section-title" style="margin-top:0;">Key figures</div>
            <div class="dossier-heroes-col">
              ${heroes.map(m => this.heroCard(m)).join('')}
            </div>
          </aside>

          <section class="dossier-main">
            <div class="dossier-section-title" style="margin-top:0;">Cultural spread</div>
            <div class="dossier-spread">
              ${groups.map(g => this.groupBlock(g)).join('')}
            </div>
          </section>
        </div>
      </div>`;

    this.container.innerHTML = html;

    this.container.querySelector('#dossier-back').addEventListener('click', () => {
      this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
    });
    this.container.querySelector('#dossier-graph').addEventListener('click', () => {
      this.store.set(STATE_KEYS.CURRENT_VIEW, 'graph');
      this.generator.generate();
    });
    this.container.querySelectorAll('[data-deity]').forEach(el => {
      el.addEventListener('click', () => {
        this.generator.loadDeity(el.dataset.deity, { resetGraph: true });
      });
    });
  }

  heroCard({ deity, value }) {
    const col = PANTHEON_COLORS[deity.pantheon] || '#888';
    const pct = Math.round(value * 100);
    return `
      <div class="dossier-hero" data-deity="${deity.id}">
        <div class="dossier-hero-top">
          <span class="dossier-hero-name">${deity.id}</span>
          <span class="dossier-hero-val" style="color:${col}">${pct}%</span>
        </div>
        <div class="dossier-hero-epithet">${deity.epithet || ''}</div>
        <div class="dossier-bar"><div class="dossier-fill" style="width:${pct}%;background:${col};"></div></div>
      </div>`;
  }

  groupBlock({ pantheon, members }) {
    const col = PANTHEON_COLORS[pantheon] || '#888';
    return `
      <div class="dossier-group">
        <div class="dossier-group-title" style="color:${col};">
          <span class="pantheon-dot" style="background:${col}"></span> ${pantheon}
          <span style="color:var(--text-3);font-weight:400;">· ${members.length}</span>
        </div>
        ${members.map(m => `
          <div class="dossier-row" data-deity="${m.deity.id}" title="${m.deity.epithet || ''}">
            <span class="dossier-row-name">${m.deity.id}</span>
            <div class="dossier-bar"><div class="dossier-fill" style="width:${Math.round(m.value * 100)}%;background:${col};"></div></div>
            <span class="dossier-row-val">${Math.round(m.value * 100)}%</span>
          </div>`).join('')}
      </div>`;
  }
}
