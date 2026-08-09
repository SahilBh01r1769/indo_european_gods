import { TRAITS, PANTHEON_COLORS, DEITIES } from '../data/deities.js';
import { getDeityById } from '../utils/similarity.js';
import { getDeityRefs } from '../data/citations.js';
import { STATE_KEYS } from '../utils/store.js';

const TRAIT_COLORS = {
  'archer': '#e87040',
  'healer': '#6bc46d',
  'disease sender': '#d9534f',
  'storm god': '#5ba8e0',
  'wilderness': '#6a9f6a',
  'liminal outsider': '#b07cd8',
  'ecstasy / madness': '#d47bc4',
  'ascetic / wisdom': '#e0a846',
  'solar': '#f0c040',
  'war / victory': '#e85555',
  'trickster': '#9b8fe8',
  'smith / craft': '#c48040',
  'sea / water': '#4a9eff',
  'death / underworld': '#808080',
  'fertility': '#2ec27e',
  'fire': '#f5a623',
};

const TRAIT_ICONS = {
  archer: '🏹', healer: '🩺', 'disease sender': '☠️', 'storm god': '⚡',
  wilderness: '🌲', 'liminal outsider': '🌗', 'ecstasy / madness': '🍷',
  'ascetic / wisdom': '🦉', solar: '☀️', 'war / victory': '⚔️',
  trickster: '🎭', 'smith / craft': '⚒️', 'sea / water': '🌊',
  'death / underworld': '💀', fertility: '🌾', fire: '🔥',
};

const TRAIT_LORE = {
  archer: 'The far-shooter who strikes from afar. The same hand that wounds can also cure.',
  healer: 'The divine physician who restores wholeness, standing at the threshold of death.',
  'disease sender': 'The bringer of plague. In myth, disease was an arrow shot by an offended god.',
  'storm god': 'The thunder-warrior who rides the storm and slays the cosmic serpent.',
  wilderness: 'Lord of the wild places, guarding the boundary between civilization and nature.',
  'liminal outsider': 'The threshold-dweller who crosses between life and death, order and chaos.',
  'ecstasy / madness': 'The god who dissolves the self through wine, dance, and ritual frenzy.',
  'ascetic / wisdom': 'Keeper of sacred knowledge, winning wisdom through sacrifice or suffering.',
  solar: 'The all-seeing eye of the sky, driver of the golden chariot, witness to oaths.',
  'war / victory': 'The god of battle, embodying both the berserker’s fury and the strategist’s calm.',
  trickster: 'The boundary-crosser and culture-hero whose cunning reshapes the cosmic order.',
  'smith / craft': 'The divine craftsman of the forge, transforming raw matter into worlds.',
  'sea / water': 'Ruler of the deep, holding the primordial chaos that surrounds the ordered world.',
  'death / underworld': 'First of the dead and lord of the departed, receiving and judging shades.',
  fertility: 'The giver of increase, binding the community to the cycles of soil and season.',
  fire: 'The messenger flame, hearth and forge, purifier and destroyer—the spark of civilization.',
};

// ── HELPERS FOR CASE-INSENSITIVE TRAIT MATCHING ─────────────────────
const normalizeTrait = (t) => (t || '').toLowerCase().replace(/\s*\/\s*/g, ' / ').trim();

function getTraitValue(deity, traitName) {
  if (!deity || !deity.traits) return 0;
  const tNorm = normalizeTrait(traitName);
  const entry = Object.entries(deity.traits).find(([k]) => normalizeTrait(k) === tNorm);
  return entry ? entry[1] : 0;
}

function getTraitColor(traitName) {
  const tNorm = normalizeTrait(traitName);
  const key = Object.keys(TRAIT_COLORS).find(k => normalizeTrait(k) === tNorm);
  return key ? TRAIT_COLORS[key] : '#888';
}
// ─────────────────────────────────────────────────────────────────────

export class Sidebar {
  constructor(store, generator, feedback) {
    this.store = store;
    this.generator = generator;
    this.feedback = feedback;
  }

  mount() {
    this.render();
  }

  setupSubscriptions() {
    this.store.subscribe(STATE_KEYS.SELECTED_DEITY, () => this.render());
    this.store.subscribe(STATE_KEYS.GRAPH_DATA, () => this.render());
    this.store.subscribe(STATE_KEYS.ACTIVE_TRAIT_FILTER, () => this.render());
    this.store.subscribe(STATE_KEYS.CURRENT_VIEW, () => this.render()); // Added for context-aware rendering
  }

  render() {
    const infoPanel = document.getElementById('stab-info-content');
    if (!infoPanel) return;

    const view = this.store.get(STATE_KEYS.CURRENT_VIEW) || 'graph';

    // ── Context-aware routing ──
    if (view === 'archetypes') return this.renderArchetypePanel(infoPanel);
    if (view === 'map')        return this.renderMapPanel(infoPanel);
    if (view === 'matrix')     return this.renderMatrixPanel(infoPanel);

    // ── Default: Graph view ──
    return this.renderGraphPanel(infoPanel);
  }

  /* ── ARCHETYPES VIEW PANELS ─────────────────────────────────────── */
  renderArchetypePanel(panel) {
    const trait = this.store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);

    if (!trait) {
      panel.innerHTML = `
        <div class="panel">
          <div class="panel-title"><span class="panel-icon">✦</span> Archetype index</div>
          <div class="card" style="padding:10px 12px; max-height: 600px; overflow-y: auto;">
            <p class="side-blurb">Sixteen archetypal traits weave through the Indo-European pantheons. Select one to open its dossier.</p>
            ${TRAITS.map(t => {
              const count = DEITIES.filter(d => getTraitValue(d, t) > 0).length;
              return `
                <div class="side-arch-row" data-arch="${t}">
                  <span class="side-arch-icon">${TRAIT_ICONS[normalizeTrait(t)] || '✦'}</span>
                  <span class="side-arch-name">${t}</span>
                  <span class="side-arch-count">${count}</span>
                </div>`;
            }).join('')}
          </div>
        </div>`;
      panel.querySelectorAll('[data-arch]').forEach(el => {
        el.addEventListener('click', () => this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, el.dataset.arch));
      });
      return;
    }

    const members = DEITIES
      .map(d => ({ deity: d, value: getTraitValue(d, trait) }))
      .filter(x => x.value > 0)
      .sort((a, b) => b.value - a.value);
    const pantheons = [...new Set(members.map(m => m.deity.pantheon))];
    const top = members[0];

    panel.innerHTML = `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">${TRAIT_ICONS[normalizeTrait(trait)] || '✦'}</span> ${trait}</div>
        <div class="card">
          <p class="side-blurb" style="font-style:italic;">${TRAIT_LORE[normalizeTrait(trait)] || ''}</p>
          <div class="side-stat-row">
            <div class="side-stat"><div class="side-stat-num">${members.length}</div><div class="side-stat-label">deities</div></div>
            <div class="side-stat"><div class="side-stat-num">${pantheons.length}</div><div class="side-stat-label">pantheons</div></div>
            <div class="side-stat"><div class="side-stat-num">${top ? Math.round(top.value * 100) + '%' : '—'}</div><div class="side-stat-label">peak</div></div>
          </div>
          ${top ? `<div class="side-topline">Strongest expression: <strong style="color:var(--text-1)">${top.deity.id}</strong> · ${top.deity.pantheon}</div>` : ''}
        </div>
      </div>
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">⬡</span> Bearers (${members.length})</div>
        <div class="card" style="padding:8px 10px;max-height:340px;overflow-y:auto;">
          ${members.map(m => `
            <div class="dossier-row side-bearer" data-deity="${m.deity.id}">
              <span class="conn-dot" style="background:${PANTHEON_COLORS[m.deity.pantheon] || '#888'}"></span>
              <span class="dossier-row-name">${m.deity.id}</span>
              <div class="dossier-bar"><div class="dossier-fill" style="width:${Math.round(m.value * 100)}%;background:${PANTHEON_COLORS[m.deity.pantheon] || '#888'};"></div></div>
              <span class="dossier-row-val">${Math.round(m.value * 100)}%</span>
            </div>`).join('')}
        </div>
      </div>`;

    panel.querySelectorAll('[data-deity]').forEach(el => {
      el.addEventListener('click', () => this.generator.loadDeity(el.dataset.deity, { resetGraph: true }));
    });
  }

  /* ── MAP VIEW PANEL ─────────────────────────────────────────────── */
  renderMapPanel(panel) {
    const counts = {};
    DEITIES.forEach(d => { counts[d.pantheon] = (counts[d.pantheon] || 0) + 1; });

    panel.innerHTML = `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">🗺️</span> Migration map</div>
        <div class="card">
          <p class="side-blurb">Each marker is a deity placed in the homeland of its tradition. Click a marker to open that god in the graph.</p>
          ${Object.entries(counts).map(([p, n]) => `
            <div class="side-legend-row">
              <span class="conn-dot" style="background:${PANTHEON_COLORS[p] || '#888'}"></span>
              <span class="side-legend-name">${p}</span>
              <span class="side-arch-count">${n}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ── MATRIX VIEW PANEL ──────────────────────────────────────────── */
  renderMatrixPanel(panel) {
    panel.innerHTML = `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">▦</span> Similarity matrix</div>
        <div class="card">
          <p class="side-blurb">Every cell averages the trait-vector similarity of all deity pairs between two pantheons. Brighter cells mean deeper archetypal overlap.</p>
          <p class="side-blurb">Click any cell to reveal the top deity pairs driving that score.</p>
          <div class="side-stat-row">
            <div class="side-stat"><div class="side-stat-num">${new Set(DEITIES.map(d => d.pantheon)).size}</div><div class="side-stat-label">pantheons</div></div>
            <div class="side-stat"><div class="side-stat-num">${DEITIES.length}</div><div class="side-stat-label">deities</div></div>
          </div>
        </div>
      </div>`;
  }

  /* ── GRAPH VIEW PANEL (Your exact original logic) ───────────────── */
  renderGraphPanel(panel) {
    const deityId = this.store.get(STATE_KEYS.SELECTED_DEITY);

    if (!deityId) {
      panel.innerHTML = `
        <div class="panel">
          <div class="panel-title"><span class="panel-icon">☽</span> Explore</div>
          <div class="card" style="padding:14px 12px;">
            <p style="font-size:12px;color:var(--text-2);line-height:1.55;margin:0 0 12px;">
              Select a deity from search or the graph to see traits, domains, sources, and connections.
            </p>
            <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">
              Try a tour
            </div>
            <p style="font-size:11px;color:var(--text-2);margin:0;line-height:1.5;">
              Open the <strong style="color:var(--text-1)">Guided Tours</strong> tab for curated paths through storm gods, psychopomps, and solar deities.
            </p>
          </div>
        </div>`;
      return;
    }

    const deity = getDeityById(deityId);
    if (!deity) return;

    const col = PANTHEON_COLORS[deity.pantheon] || '#888';
    const refs = getDeityRefs(deity.id);
    const { edges } = this.store.get(STATE_KEYS.GRAPH_DATA);
    const activeFilter = this.store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);

    const connections = (edges || [])
      .filter(e => {
        const src = e.source.id || e.source;
        const tgt = e.target.id || e.target;
        return src === deityId || tgt === deityId;
      })
      .map(e => {
        const src = e.source.id || e.source;
        const tgt = e.target.id || e.target;
        const otherId = src === deityId ? tgt : src;
        const otherDeity = getDeityById(otherId);
        return {
          id: otherId,
          similarity: e.similarity,
          pantheon: otherDeity?.pantheon || 'Unknown',
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    panel.innerHTML = `
      ${this.renderDeityCard(deity, col, refs)}
      ${this.renderRadar(deity)}
      ${this.renderHeatmap(deity, activeFilter)}
      ${this.renderConnections(connections)}`;

    this.bindEvents(panel);
  }

  renderDeityCard(deity, col, refs) {
    return `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">⟁</span> Selected deity</div>
        <div class="card">
          <div class="pantheon-badge" style="background:${col}20;color:${col};border:1px solid ${col}44">
            <span class="pantheon-dot" style="background:${col}"></span>
            ${deity.pantheon}
          </div>
          <div class="deity-card-name">${deity.id}</div>
          ${deity.originalScript ? `<div class="original-script">${deity.originalScript}</div>` : ''}
          <div class="deity-card-epithet">${deity.epithet || ''}</div>

          ${deity.desc ? `
            <div class="deity-desc" style="font-size:12px;color:var(--text-2);line-height:1.55;margin:8px 0 10px;">
              ${deity.desc}
            </div>` : ''}

          ${(deity.domains || []).length ? `
            <div class="deity-domains" style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">
              ${deity.domains.map(d => `<span class="domain-tag">${d}</span>`).join('')}
            </div>` : ''}

          ${(deity.symbols || []).length ? `
            <div style="margin-bottom:8px;">
              <div class="meta-label">Symbols</div>
              <div class="meta-value" style="font-size:11px;color:var(--text-2);">${deity.symbols.join(' · ')}</div>
            </div>` : ''}

          <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
            <span class="era-badge">📅 ${this.eraLabel(deity.era)}</span>
          </div>

          ${refs.length ? `
            <div class="deity-refs">
              <div class="refs-title">📜 Primary sources</div>
              ${refs.map(r => `
                <div class="ref-item">
                  <div class="ref-note">${r.note || ''}</div>
                  <div class="ref-src" style="font-size:10px;color:var(--text-3);margin-top:2px;">
                    ${r.bib ? `${r.bib.author} (${r.bib.year}) <em>${r.bib.title}</em>` : (r.ref || '')}
                    ${r.pages ? ` · ${r.pages}` : ''}
                  </div>
                </div>`).join('')}
            </div>` : ''}
        </div>
      </div>`;
  }

  renderRadar(deity) {
    const traitData = TRAITS.map(t => ({
      trait: t,
      value: getTraitValue(deity, t)
    })).sort((a, b) => b.value - a.value).slice(0, 8);

    if (!traitData.some(t => t.value > 0)) return '';

    const size = 200, cx = size / 2, cy = size / 2, r = 70;
    const angleStep = (2 * Math.PI) / traitData.length;

    let gridCircles = '';
    [0.33, 0.66, 1.0].forEach(frac => {
      gridCircles += `<circle cx="${cx}" cy="${cy}" r="${r * frac}" fill="none" stroke="var(--border-1)" stroke-width="0.5" opacity="0.3"/>`;
    });

    let axes = '';
    traitData.forEach((t, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      axes += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="var(--border-1)" stroke-width="0.5" opacity="0.3"/>`;
    });

    let pts = '';
    traitData.forEach((t, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + t.value * r * Math.cos(angle);
      const y = cy + t.value * r * Math.sin(angle);
      pts += `${x},${y} `;
    });

    let points = '';
    traitData.forEach((t, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + t.value * r * Math.cos(angle);
      const y = cy + t.value * r * Math.sin(angle);
      points += `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent-bright)" stroke="white" stroke-width="1.5"/>`;
      const labelR = r + 15;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);
      const shortName = t.trait.length > 12 ? t.trait.split(' ')[0] : t.trait;
      const anchor = Math.cos(angle) > 0.3 ? 'start' : (Math.cos(angle) < -0.3 ? 'end' : 'middle');
      points += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle"
                       font-size="8" fill="var(--text-2)" font-weight="500">${shortName}</text>`;
    });

    return `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">◈</span> Top traits</div>
        <div class="card" style="text-align:center;padding:12px;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;">
            ${gridCircles}
            ${axes}
            <polygon points="${pts.trim()}" fill="var(--accent-glow)" fill-opacity="0.4" stroke="var(--accent)" stroke-width="1.5"/>
            ${points}
          </svg>
        </div>
      </div>`;
  }

  renderHeatmap(deity, activeFilter) {
    const sortedTraits = [...TRAITS].sort((a, b) => {
      const va = getTraitValue(deity, a);
      const vb = getTraitValue(deity, b);
      return vb - va;
    });

    return `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">▦</span> Trait heatmap</div>
        <div class="card" style="padding:10px 12px;">
          ${sortedTraits.map(t => {
            const val = getTraitValue(deity, t);
            const color = getTraitColor(t);
            const pct = (val * 100).toFixed(0);
            return `
              <div class="hm-row">
                <span class="hm-label ${activeFilter === t ? 'active-filter' : ''}" data-trait="${t}">${t}</span>
                <div class="hm-bar">
                  <div class="hm-fill" style="width:${pct}%;background:${color};"></div>
                </div>
                <span class="hm-val">${pct}%</span>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  renderConnections(connections) {
    if (!connections.length) return '';

    return `
      <div class="panel">
        <div class="panel-title"><span class="panel-icon">⬡</span> Top connections</div>
        <div class="card" style="padding:8px 10px;">
          ${connections.map(c => {
            const pantheonColor = PANTHEON_COLORS[c.pantheon] || '#888';
            return `
              <div class="conn-item" data-deity="${c.id}">
                <span class="conn-dot" style="background:${pantheonColor}"></span>
                <div class="conn-info">
                  <div class="conn-name">${c.id}</div>
                  <div class="conn-pan">${c.pantheon}</div>
                </div>
                <span class="conn-score">${(c.similarity * 100).toFixed(0)}%</span>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  bindEvents(panel) {
    panel.querySelectorAll('.hm-label').forEach(label => {
      label.addEventListener('click', () => {
        this.generator.handleTraitClick(label.dataset.trait);
      });
    });

    panel.querySelectorAll('.conn-item').forEach(item => {
      item.addEventListener('click', () => {
        this.generator.loadDeity(item.dataset.deity);
      });
    });
  }

  eraLabel(era) {
    if (era >= -2000 && era < -1500) return '~2000–1500 BCE';
    if (era >= -1500 && era < -800) return '~1500–800 BCE';
    if (era >= -800 && era < -100) return '~800–200 BCE';
    if (era >= -100 && era < 500) return '~200 BCE–500 CE';
    if (era >= 500) return '~500 CE+';
    return 'Classical period';
  }

  clear() {
    const p = document.getElementById('stab-info-content');
    if (p) p.innerHTML = '';
  }
}