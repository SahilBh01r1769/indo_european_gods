/* ─────────────────────────────────────────────────────────────────
   views/archetypes.js — Trait-centric cluster view
   Browse by archetype rather than by deity
   ───────────────────────────────────────────────────────────────── */

import { TRAITS, PANTHEON_COLORS } from '../data/deities.js';
import { getDeitiesByTrait, traitVector, cosineSimilarity } from '../utils/similarity.js';

// Trait metadata: icon + description
const TRAIT_META = {
  'archer':              { icon: '🏹', desc: 'Deities who wield the bow as a primary attribute' },
  'healer':              { icon: '⚕️',  desc: 'Deities associated with medicine, restoration, and curing disease' },
  'disease sender':      { icon: '☣️',  desc: 'Deities who inflict illness, plague, or pestilence' },
  'storm god':           { icon: '⛈️',  desc: 'Deities who command thunder, lightning, and weather' },
  'wilderness':          { icon: '🌲', desc: 'Deities of the wild — forests, animals, untamed nature' },
  'liminal outsider':    { icon: '🌀', desc: 'Boundary-crossers between worlds: tricksters, psychopomps, gatekeepers' },
  'ecstasy / madness':   { icon: '🌊', desc: 'Deities of divine frenzy, ritual ecstasy, and inspired madness' },
  'ascetic / wisdom':    { icon: '🔮', desc: 'Deities of knowledge, cosmic order, and spiritual discipline' },
  'solar':               { icon: '☀️',  desc: 'Sun deities and personifications of light' },
  'war / victory':       { icon: '⚔️',  desc: 'Deities of combat, martial prowess, and battlefield victory' },
  'trickster':           { icon: '🃏', desc: 'Deceivers, shape-shifters, and agents of creative chaos' },
  'smith / craft':       { icon: '⚒️',  desc: 'Deities of craftsmanship, metalworking, and creative skill' },
  'sea / water':         { icon: '🌊', desc: 'Deities of ocean, river, and the primordial waters' },
  'death / underworld':  { icon: '🌑', desc: 'Rulers of the dead and guardians of the underworld' },
  'fertility':           { icon: '🌾', desc: 'Deities of growth, abundance, sexuality, and agricultural life' },
  'fire':                { icon: '🔥', desc: 'Deities of sacred and celestial fire' },
};

let _activeTrait = null;
let _archSimul   = null;
let _onLoadDeity;

/* ── Init ─────────────────────────────────────────────────────────── */
export function initArchetypes({ onLoadDeity }) {
  _onLoadDeity = onLoadDeity;
}

/* ── Render ──────────────────────────────────────────────────────── */
export function renderArchetypes() {
  const container = document.getElementById('archetype-view');
  container.innerHTML = `
    <div class="view-inner">
      <div class="view-title">Archetype Explorer</div>
      <div class="view-subtitle">
        Browse by mythological trait rather than by deity.
        Select an archetype to see all gods who embody it — sized by intensity.
      </div>
      <div class="archetype-grid" id="archetype-grid"></div>
      <div id="archetype-graph" style="display:none">
        <svg id="archetype-svg"></svg>
        <div class="archetype-empty" id="archetype-empty" style="display:none">
          Select an archetype above to visualise its cluster
        </div>
      </div>
      <div id="archetype-detail" style="display:none;width:100%;max-width:900px;margin-top:14px"></div>
    </div>
  `;

  buildTraitGrid();
}

/* ── Trait grid ──────────────────────────────────────────────────── */
function buildTraitGrid() {
  const grid = document.getElementById('archetype-grid');
  if (!grid) return;

  grid.innerHTML = TRAITS.map(t => {
    const meta  = TRAIT_META[t] || { icon: '✦', desc: '' };
    const count = getDeitiesByTrait(t, 0.4).length;
    return `
      <div class="archetype-card" data-trait="${t}" onclick="window._selectArchetype('${t}')">
        <span class="archetype-icon">${meta.icon}</span>
        <div class="archetype-name">${t}</div>
        <div class="archetype-count">${count} deities</div>
      </div>`;
  }).join('');

  window._selectArchetype = (trait) => selectTrait(trait);
}

/* ── Select trait ────────────────────────────────────────────────── */
function selectTrait(trait) {
  _activeTrait = trait;

  // Update card states
  document.querySelectorAll('.archetype-card').forEach(el => {
    el.classList.toggle('active', el.dataset.trait === trait);
  });

  const graphEl = document.getElementById('archetype-graph');
  graphEl.style.display = 'block';

  renderArchetypeGraph(trait);
  renderArchetypeDetail(trait);

  graphEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── D3 archetype graph ──────────────────────────────────────────── */
function renderArchetypeGraph(trait) {
  const meta    = TRAIT_META[trait] || { icon: '✦' };
  const entries = getDeitiesByTrait(trait, 0.35);

  if (_archSimul) { _archSimul.stop(); _archSimul = null; }

  const svg = d3.select('#archetype-svg');
  svg.selectAll('*').remove();

  const W = document.getElementById('archetype-graph').clientWidth  || 860;
  const H = document.getElementById('archetype-graph').clientHeight || 420;

  svg.attr('viewBox', `0 0 ${W} ${H}`);

  // Build nodes + edges
  const nodes = entries.map(({ deity, value }) => ({
    ...deity,
    traitVal: value,
    x: W / 2 + (Math.random() - 0.5) * 200,
    y: H / 2 + (Math.random() - 0.5) * 150,
  }));

  // Edge: connect pairs that share the trait above 0.5
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const va = traitVector(nodes[i]);
      const vb = traitVector(nodes[j]);
      const sim = cosineSimilarity(va, vb);
      if (sim >= 0.42) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight: sim,
          _key: `${nodes[i].id}--${nodes[j].id}`,
        });
      }
    }
  }

  // Trait index for sizing
  const traitIdx = TRAITS.indexOf(trait);

  // Zoom
  const zoomBeh = d3.zoom().scaleExtent([0.4, 3])
    .on('zoom', e => {
      gL.attr('transform', e.transform);
      gN.attr('transform', e.transform);
    });
  svg.call(zoomBeh);

  const gL = svg.append('g');
  const gN = svg.append('g');

  // Links
  gL.selectAll('line').data(edges).join('line')
    .attr('stroke', '#3a3850')
    .attr('stroke-opacity', 0.45)
    .attr('stroke-width', d => Math.max(1, d.weight * 4));

  // Nodes
  const nodeG = gN.selectAll('g').data(nodes).join('g')
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) _archSimul?.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end',   (e, d) => { if (!e.active) _archSimul?.alphaTarget(0); d.fx = null; d.fy = null; })
    )
    .on('click', (_, d) => _onLoadDeity && _onLoadDeity(d.id))
    .on('mouseover', function(_, d) {
      const vec = traitVector(d);
      d3.select(this).select('circle')
        .transition().duration(120)
        .attr('filter', `drop-shadow(0 0 8px ${PANTHEON_COLORS[d.pantheon]}99)`);
      showArchTooltip(d, vec[traitIdx]);
    })
    .on('mouseout', function() {
      d3.select(this).select('circle').transition().duration(150).attr('filter', null);
      hideArchTooltip();
    });

  nodeG.append('circle')
    .attr('r', d => Math.max(8, d.traitVal * 28))
    .attr('fill', d => PANTHEON_COLORS[d.pantheon] || '#888')
    .attr('fill-opacity', 0.8)
    .attr('stroke', 'rgba(255,255,255,0.12)')
    .attr('stroke-width', 1);

  // Trait intensity ring
  nodeG.append('circle')
    .attr('r', d => Math.max(8, d.traitVal * 28) + 3)
    .attr('fill', 'none')
    .attr('stroke', d => PANTHEON_COLORS[d.pantheon] || '#888')
    .attr('stroke-opacity', 0.25)
    .attr('stroke-width', 1.5);

  nodeG.append('text')
    .text(d => d.id)
    .attr('text-anchor', 'middle')
    .attr('dy', d => Math.max(8, d.traitVal * 28) + 14)
    .attr('font-size', '10px')
    .attr('fill', 'rgba(200,196,224,0.75)');

  // Simulation
  _archSimul = d3.forceSimulation(nodes)
    .force('link',      d3.forceLink(edges).id(d => d.id).distance(d => 110 - d.weight * 40).strength(0.5))
    .force('charge',    d3.forceManyBody().strength(-220))
    .force('center',    d3.forceCenter(W / 2, H / 2).strength(0.06))
    .force('collision', d3.forceCollide(d => Math.max(12, d.traitVal * 32)))
    .on('tick', () => {
      gL.selectAll('line')
        .attr('x1', d => (typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source))?.x ?? 0)
        .attr('y1', d => (typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source))?.y ?? 0)
        .attr('x2', d => (typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target))?.x ?? 0)
        .attr('y2', d => (typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target))?.y ?? 0);

      gN.selectAll('g')
        .attr('transform', d =>
          `translate(${Math.max(30, Math.min(W - 30, d.x ?? W / 2))},${Math.max(30, Math.min(H - 30, d.y ?? H / 2))})`
        );
    });
}

/* ── Archetype tooltip ───────────────────────────────────────────── */
function showArchTooltip(d, traitVal) {
  const tt = document.getElementById('tooltip');
  if (!tt) return;
  const pct = (traitVal * 100).toFixed(0);
  tt.innerHTML = `
    <div class="tt-title">${d.id}</div>
    <div class="tt-sub">${d.pantheon} · ${d.epithet}</div>
    <div class="tt-score">Trait intensity: <strong>${pct}%</strong></div>
    <div class="tt-desc">${d.desc}</div>
    <div class="tt-hint">Click to explore in graph view</div>
  `;
  tt.style.display = 'block';
  tt.style.opacity = '1';
  tt.style.left = '20px';
  tt.style.top  = '20px';
}

function hideArchTooltip() {
  const tt = document.getElementById('tooltip');
  if (tt) { tt.style.opacity = '0'; setTimeout(() => { if (tt.style.opacity === '0') tt.style.display = 'none'; }, 120); }
}

/* ── Archetype detail panel ──────────────────────────────────────── */
function renderArchetypeDetail(trait) {
  const meta    = TRAIT_META[trait] || { icon: '✦', desc: '' };
  const entries = getDeitiesByTrait(trait, 0.35);
  const detail  = document.getElementById('archetype-detail');
  if (!detail) return;

  detail.style.display = 'block';
  detail.innerHTML = `
    <div class="card" style="width:100%">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-size:24px">${meta.icon}</span>
        <div>
          <div style="font-family:var(--font-serif);font-size:15px;color:var(--gold-bright)">${trait}</div>
          <div style="font-size:12px;color:var(--text-2)">${meta.desc}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:7px">
        ${entries.map(({ deity, value }) => {
          const col = PANTHEON_COLORS[deity.pantheon] || '#888';
          const pct = (value * 100).toFixed(0);
          return `
            <div class="card-sm" style="cursor:pointer;border-color:${col}33"
                 onclick="window._archLoadDeity('${deity.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:12px;font-weight:500;color:${col}">${deity.id}</span>
                <span style="font-size:10px;font-family:var(--font-mono);color:var(--accent-bright)">${pct}%</span>
              </div>
              <div style="font-size:10px;color:var(--text-3)">${deity.pantheon}</div>
              <div style="margin-top:5px;height:4px;border-radius:2px;background:var(--bg-5)">
                <div style="width:${pct}%;height:100%;border-radius:2px;background:${col};opacity:0.7"></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>
  `;

  window._archLoadDeity = (id) => _onLoadDeity && _onLoadDeity(id);
}
