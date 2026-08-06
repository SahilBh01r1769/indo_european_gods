/* ─────────────────────────────────────────────────────────────────
   views/graph.js — D3 force-directed graph
   ───────────────────────────────────────────────────────────────── */

import { PANTHEON_COLORS } from '../data/deities.js';
import { edgeColor, traitVector, sharedTraits } from '../utils/similarity.js';
import { getCognate } from '../data/cognates.js';

let svg, zoom, gLinks, gNodes, simulation;
let _state, _onNodeClick, _onEdgeHover, _onNodeHover, _hideTooltip;
let currentNodes = [];

/* ── Init ─────────────────────────────────────────────────────────── */
export function initGraph({ state, onNodeClick, onNodeHover, onEdgeHover, hideTooltip }) {
  _state       = state;
  _onNodeClick = onNodeClick;
  _onNodeHover = onNodeHover;
  _onEdgeHover = onEdgeHover;
  _hideTooltip = hideTooltip;

  const el = document.getElementById('graph-svg');
  svg = d3.select(el);

  zoom = d3.zoom()
    .scaleExtent([0.1, 5])
    .on('zoom', e => {
      gLinks.attr('transform', e.transform);
      gNodes.attr('transform', e.transform);
      updateMinimap();
    });

  svg.call(zoom).on('dblclick.zoom', null);
  svg.on('click', () => clearHighlight());

  gLinks = svg.append('g').attr('class', 'g-links');
  gNodes = svg.append('g').attr('class', 'g-nodes');
  gLinks.style('opacity', 1).style('visibility', 'visible');
  gNodes.style('opacity', 1).style('visibility', 'visible');
}

/* ── Dimensions ──────────────────────────────────────────────────── */
function W() { return document.getElementById('graph-view').clientWidth  || 800; }
function H() { return document.getElementById('graph-view').clientHeight || 600; }

/* ── Main render ─────────────────────────────────────────────────── */
export function renderGraph(nodes, edges, options = {}) {
  
  const {
    animate       = true,
    showLabels    = true,
    cluster       = false,
    activeFilter  = null,
    showCognates  = false,
    centerDeityId = null,
  } = options;


  if (simulation) simulation.stop();
  document.getElementById('empty-state').style.display = 'none';

  currentNodes = nodes;
  
const resolveId = v => (typeof v === 'object' ? v.id : v);

// Only keep edges whose both ends exist in the current nodes
const simEdges = (activeFilter
  ? edges.filter(e => (e.shared || []).includes(activeFilter))
  : edges
).filter(e => {
  const sid = resolveId(e.source);
  const tid = resolveId(e.target);
  return nodes.some(n => n.id === sid) && nodes.some(n => n.id === tid);
});

const link = gLinks.selectAll('line.link').data(simEdges, e => e._key);
console.log('simEdges length:', simEdges.length);
console.log('First edge:', simEdges[0]);
console.log('visEdges / simEdges sample keys:', simEdges.slice(0,3).map(e => e._key));
  link.exit().transition().duration(250).attr('stroke-opacity', 0).remove();

  const linkEnter = link.enter()
    .append('line')
    .attr('class', 'link')
    .attr('stroke-opacity', 0)
    .attr('x1', d => nodeById(nodes, resolveId(d.source))?.x ?? W() / 2)
    .attr('y1', d => nodeById(nodes, resolveId(d.source))?.y ?? H() / 2)
    .attr('x2', d => nodeById(nodes, resolveId(d.target))?.x ?? W() / 2)
    .attr('y2', d => nodeById(nodes, resolveId(d.target))?.y ?? H() / 2);

  const linkAll = linkEnter.merge(link);
  linkAll
  .attr('stroke', d => (showCognates && d.cognate) ? '#fbbf24' : edgeColor(d.weight))
  .attr('stroke-width', d => (showCognates && d.cognate) ? 3.5 : Math.max(2, d.weight * 7))
  .attr('stroke-opacity', 0.9);   // ← force high opacity immediately

  linkAll
    .attr('stroke', d => {
      if (showCognates && d.cognate) return '#fbbf24';
      return edgeColor(d.weight);
    })
    .attr('stroke-width', d => {
      const w = d.weight ?? d.score ?? 0.5; // Fallback prevents NaN
      if (showCognates && d.cognate) return 3;
      return Math.max(1.5, w * 6); 
    })
    .attr('stroke-dasharray', d => showCognates && d.cognate ? '6 4' : null)
    .on('mouseover', (evt, d) => _onEdgeHover && _onEdgeHover(evt, d))
    .on('mouseout',  ()        => _hideTooltip && _hideTooltip());

  linkAll.transition().duration(350).attr('stroke-opacity', activeFilter ? 0.85 : 0.75);
  

  // ── Nodes ────────────────────────────────────────────────────────
  const node = gNodes.selectAll('g.node').data(nodes, d => d.id);
  node.exit().transition().duration(250).style('opacity', 0).remove();

  const nodeEnter = node.enter()
    .append('g')
    .attr('class', d => `node${d.id === centerDeityId ? ' node-center' : ''}`)
    .attr('transform', d => `translate(${d.x ?? W() / 2},${d.y ?? H() / 2})`)
    .style('opacity', animate ? 0 : 1)
    .style('cursor', 'pointer');

  nodeEnter.call(
    d3.drag()
      .on('start', (e, d) => { if (!e.active) simulation?.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end',   (e, d) => {
        if (!e.active) simulation?.alphaTarget(0);
        if (!_state.pinnedNodes.has(d.id)) { d.fx = null; d.fy = null; }
      })
  );

  nodeEnter.append('circle').attr('class', 'pin-ring').attr('r', d => d.id === centerDeityId ? 26 : 18);

  nodeEnter.append('circle')
    .attr('class', 'node-circle')
    .attr('r', d => d.id === centerDeityId ? 20 : 13)
    .attr('fill', d => PANTHEON_COLORS[d.pantheon] || '#888')
    .attr('fill-opacity', 0.9);

  nodeEnter.append('text')
    .attr('class', d => `node-label${d.id === centerDeityId ? ' center' : ''}`)
    .attr('dy', d => (d.id === centerDeityId ? 24 : 16))
    .text(d => d.id)
    .style('display', showLabels ? 'block' : 'none');

  const nodeAll = nodeEnter.merge(node);
  nodeAll.select('.node-circle').attr('r', d => d.id === centerDeityId ? 20 : 13).attr('fill', d => PANTHEON_COLORS[d.pantheon] || '#888');
  nodeAll.select('.node-label').text(d => d.id).style('display', showLabels ? 'block' : 'none');

  if (animate) {
    nodeEnter.transition().delay((_, i) => i * 35).duration(380).style('opacity', 1);
  }

  nodeAll
    .on('mouseover', (evt, d) => {
      applyGlow(evt.currentTarget, d, centerDeityId);
      _onNodeHover && _onNodeHover(evt, d, edges);
    })
    .on('mousemove', evt => {
      const tt = document.getElementById('tooltip');
      if (tt) repositionTooltip(evt, tt);
    })
    .on('mouseout', (evt, d) => {
      removeGlow(evt.currentTarget, d, centerDeityId);
      _hideTooltip && _hideTooltip();
    })
    .on('click', (evt, d) => { evt.stopPropagation(); _onNodeClick && _onNodeClick(d, evt); })
    .on('dblclick', (evt, d) => { evt.stopPropagation(); togglePin(d); });

  updatePinRings();

  const pantheonKeys = Object.keys(PANTHEON_COLORS);

  simulation = d3.forceSimulation(nodes)
    .alphaDecay(0.04)        // CRITICAL: Stops simulation 3x faster, eliminating lag
    .velocityDecay(0.4)     // CRITICAL: Stabilizes nodes quicker, reducing jitter
    .force('link', d3.forceLink(simEdges).id(d => d.id).distance(d => 140 - d.weight * 60).strength(0.65))
    .force('charge', d3.forceManyBody().strength(-320))
    .force('center', d3.forceCenter(W() / 2, H() / 2).strength(0.05))
    .force('x', cluster
      ? d3.forceX(d => {
          const idx = pantheonKeys.indexOf(d.pantheon);
          return (idx / (pantheonKeys.length - 1)) * (W() * 0.72) + W() * 0.14;
        }).strength(0.14)
      : d3.forceX(W() / 2).strength(0.03)
    )
    .force('y', d3.forceY(H() / 2).strength(0.03))
    .force('collision', d3.forceCollide(28))
    .on('tick', tick)               // Uses optimized tick function below
    .on('end', updateMinimap);

  nodes.forEach(d => { if (_state.pinnedNodes.has(d.id)) { d.fx = d.x; d.fy = d.y; } });
}

function tick() {
  const w = W(), h = H();

  gLinks.selectAll('line.link')
    .attr('x1', d => {
      const s = typeof d.source === 'object' ? d.source : nodeById(currentNodes, d.source);
      return s?.x ?? 0;
    })
    .attr('y1', d => {
      const s = typeof d.source === 'object' ? d.source : nodeById(currentNodes, d.source);
      return s?.y ?? 0;
    })
    .attr('x2', d => {
      const t = typeof d.target === 'object' ? d.target : nodeById(currentNodes, d.target);
      return t?.x ?? 0;
    })
    .attr('y2', d => {
      const t = typeof d.target === 'object' ? d.target : nodeById(currentNodes, d.target);
      return t?.y ?? 0;
    });

  gNodes.selectAll('g.node')
    .attr('transform', d =>
      `translate(${Math.max(22, Math.min(w - 22, d.x ?? w / 2))},${Math.max(22, Math.min(h - 22, d.y ?? h / 2))})`
    );
}

/* ── Highlight / dim ─────────────────────────────────────────────── */
export function highlightByTrait(trait, edges) {
  if (!trait) { clearHighlight(); return; }
  const resolveId = v => (typeof v === 'object' ? v.id : v);
  const activeEdges = new Set(), activeNodes = new Set();

  edges.forEach(e => {
    if ((e.shared || []).includes(trait)) {
      activeEdges.add(e._key);
      activeNodes.add(resolveId(e.source));
      activeNodes.add(resolveId(e.target));
    }
  });

  gLinks.selectAll('line.link')
  .attr('stroke-opacity', d => activeEdges.has(d._key) ? 0.9 : 0.08)
  .attr('stroke-width', d => activeEdges.has(d._key) ? Math.max(2, d.weight * 7) : 1);
 gNodes.selectAll('g.node').style('opacity', d => activeNodes.has(d.id) ? 1 : 0.15);
}

export function clearHighlight() {
  gLinks.selectAll('line.link')
  .attr('stroke-opacity', 0.75)
  .attr('stroke-width', d => Math.max(1.5, d.weight * 6));
  gNodes.selectAll('g.node').style('opacity', 1);
}

/* ── Pin, Glow, Zoom, Clear, Minimap, Helpers ──────────────────── */
// (Keep your existing togglePin, unpinAll, updatePinRings, applyGlow, removeGlow, 
// setLabelsVisible, resetZoom, zoomIn, zoomOut, clearGraph, updateMinimap, 
// clearMinimap, nodeById, and repositionTooltip functions exactly as they were)
function togglePin(d) {
  if (_state.pinnedNodes.has(d.id)) { _state.pinnedNodes.delete(d.id); d.fx = null; d.fy = null; } 
  else { _state.pinnedNodes.add(d.id); d.fx = d.x; d.fy = d.y; }
  updatePinRings();
  if (simulation) simulation.alpha(0.1).restart();
}
export function unpinAll(nodes) {
  _state.pinnedNodes.clear();
  nodes.forEach(d => { d.fx = null; d.fy = null; });
  updatePinRings();
  if (simulation) simulation.alpha(0.3).restart();
}
function updatePinRings() {
  gNodes.selectAll('g.node').each(function(d) {
    d3.select(this).select('.pin-ring').style('display', _state.pinnedNodes.has(d.id) ? 'block' : 'none');
  });
}
function applyGlow(el, d, centerId) {
  const col = PANTHEON_COLORS[d.pantheon] || '#fff';
  d3.select(el).select('.node-circle').transition().duration(120).attr('filter', `drop-shadow(0 0 10px ${col}99)`).attr('r', d.id === centerId ? 23 : 15);
}
function removeGlow(el, d, centerId) {
  d3.select(el).select('.node-circle').transition().duration(180).attr('filter', null).attr('r', d.id === centerId ? 20 : 13);
}
export function setLabelsVisible(visible) { gNodes.selectAll('.node-label').style('display', visible ? 'block' : 'none'); }
export function resetZoom() { d3.select(document.getElementById('graph-svg')).transition().duration(500).call(zoom.transform, d3.zoomIdentity); }
export function zoomIn() { d3.select(document.getElementById('graph-svg')).transition().duration(300).call(zoom.scaleBy, 1.4); }
export function zoomOut() { d3.select(document.getElementById('graph-svg')).transition().duration(300).call(zoom.scaleBy, 0.7); }
export function clearGraph() {
  if (simulation) { simulation.stop(); simulation = null; }
  gLinks.selectAll('*').remove(); gNodes.selectAll('*').remove(); clearMinimap();
  document.getElementById('empty-state').style.display = 'flex';
}
export function updateMinimap(nodes = [], edges = []) {
  const canvas = document.getElementById('minimap-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); const mw = canvas.width, mh = canvas.height;
  ctx.clearRect(0, 0, mw, mh);
  const liveNodes = []; gNodes.selectAll('g.node').each(function(d) { if (d.x != null && d.y != null) liveNodes.push(d); });
  if (!liveNodes.length) return;
  const xs = liveNodes.map(n => n.x), ys = liveNodes.map(n => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const sc = Math.min(maxX > minX ? (mw - 10) / (maxX - minX) : 1, maxY > minY ? (mh - 10) / (maxY - minY) : 1) * 0.88;
  const tx = n => 5 + (n.x - minX) * sc, ty = n => 5 + (n.y - minY) * sc;
  gLinks.selectAll('line.link').each(function(e) {
    const src = typeof e.source === 'object' ? e.source : liveNodes.find(n => n.id === e.source);
    const tgt = typeof e.target === 'object' ? e.target : liveNodes.find(n => n.id === e.target);
    if (!src || !tgt) return;
    ctx.beginPath(); ctx.moveTo(tx(src), ty(src)); ctx.lineTo(tx(tgt), ty(tgt));
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
  });
  liveNodes.forEach(n => {
    ctx.beginPath(); ctx.arc(tx(n), ty(n), 3, 0, Math.PI * 2);
    ctx.fillStyle = PANTHEON_COLORS[n.pantheon] || '#888'; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
  });
}
function clearMinimap() {
  const canvas = document.getElementById('minimap-canvas'); if (!canvas) return;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}
function nodeById(nodes, id) { return nodes.find(n => n.id === (typeof id === 'object' ? id.id : id)); }
function repositionTooltip(evt, tt) {
  const rect = document.getElementById('view-area').getBoundingClientRect();
  let x = evt.clientX - rect.left + 14, y = evt.clientY - rect.top + 14;
  if (x + 260 > rect.width) x = evt.clientX - rect.left - 264;
  if (y + 220 > rect.height) y = evt.clientY - rect.top - 180;
  tt.style.left = x + 'px'; tt.style.top = y + 'px';
}
export { repositionTooltip };
