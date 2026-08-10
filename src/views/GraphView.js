import { PANTHEON_COLORS } from '../data/deities.js';
import { edgeColor } from '../utils/similarity.js';
import { getCognate } from '../data/cognates.js';
import { STATE_KEYS } from '../utils/store.js';

export class GraphView {
  constructor(store, generator, feedback) {
    this.store = store;
    this.generator = generator;
    this.feedback = feedback;
    this.svg = null;
    this.zoom = null;
    this.gLinks = null;
    this.gNodes = null;
    this.simulation = null;
    this.tooltip = null;
    this.currentNodes = [];
    this._minimapLast = 0;
    this._idleTimer = null;
  }

  mount(svgElement) {
    this.svg = d3.select(svgElement);

    this.zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', e => {
        this.gLinks.attr('transform', e.transform);
        this.gNodes.attr('transform', e.transform);
        this.updateMinimap();
      });

    this.svg.call(this.zoom).on('dblclick.zoom', null);
    this.svg.on('click', () => this.clearHighlight());

    this.gLinks = this.svg.append('g').attr('class', 'g-links');
    this.gNodes = this.svg.append('g').attr('class', 'g-nodes');

    this.tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    document.querySelectorAll('.empty-tag').forEach(tag => {
      tag.addEventListener('click', () =>
        this.generator.loadDeity(tag.dataset.deity, { resetGraph: true })
      );
    });
  }

  setupSubscriptions() {
    this.store.subscribe(STATE_KEYS.GRAPH_DATA, data => {
      this.render(data.nodes, data.edges);
    });

    this.store.subscribe(STATE_KEYS.SHOW_LABELS, show => {
      this.setLabelsVisible(show);
    });

    this.store.subscribe(STATE_KEYS.SHOW_COGNATES, () => {
      const data = this.store.get(STATE_KEYS.GRAPH_DATA);
      this.render(data.nodes, data.edges);
    });

    window.addEventListener('path:found', (e) => {
      this.highlightPath(e.detail);
    });
  }

  W() { return document.getElementById('graph-view')?.clientWidth || 800; }
  H() { return document.getElementById('graph-view')?.clientHeight || 600; }

  render(nodes, edges, options = {}) {
    if (!this.svg) return;
    const empty = document.getElementById('empty-state');
    this._stopIdleMotion();
    if (empty) empty.style.display = nodes.length ? 'none' : 'flex';
    this.currentNodes = nodes;
    if (this.simulation) this.simulation.stop();

    const activePath = this.store.get(STATE_KEYS.ACTIVE_PATH) || [];

    const {
      animate = this.store.get(STATE_KEYS.ANIMATE_ENTRANCE),
      showLabels = this.store.get(STATE_KEYS.SHOW_LABELS),
      cluster = this.store.get(STATE_KEYS.CLUSTER_BY_PAN),
      showCognates = this.store.get(STATE_KEYS.SHOW_COGNATES),
      centerDeityId = this.store.get(STATE_KEYS.SELECTED_DEITY),
    } = options;

    if (!nodes.length) {
      this.gLinks.selectAll('*').remove();
      this.gNodes.selectAll('*').remove();
      this.updateMinimap();
      return;
    }

    const W = this.W(), H = this.H();

    // ── Links with smooth transitions ──
    const link = this.gLinks.selectAll('line.link')
      .data(edges, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

    link.exit()
      .transition()
      .duration(animate ? 800 : 0)
      .ease(d3.easeCubicInOut)
      .attr('stroke-opacity', 0)
      .remove();

    const linkEnter = link.enter().append('line')
      .attr('class', 'link')
      .attr('stroke-opacity', 0)
      .attr('stroke-width', 0);

    const linkMerge = linkEnter.merge(link)
      .attr('stroke', d => {
        if (d.isPathEdge) return '#fbbf24';
        return edgeColor(d.similarity);
      })
      .attr('class', d => {
        if (d.isPathEdge) return 'link link-path';
        const src = d.source.id || d.source;
        const tgt = d.target.id || d.target;
        if (showCognates && getCognate(src, tgt)) return 'link link-cognate';
        if ((d.similarity || 0) >= 0.7) return 'link link-strong';
        if ((d.similarity || 0) >= 0.45) return 'link link-medium';
        return 'link link-weak';
      });

    linkMerge.transition()
      .duration(animate ? 800 : 0)
      .ease(d3.easeCubicInOut)
      .attr('stroke-width', d => d.isPathEdge ? 4 : Math.max(1, (d.similarity || 0) * 4))
      .attr('stroke-opacity', d => d.isPathEdge ? 1 : (0.25 + (d.similarity || 0) * 0.55));


    // ── Nodes with smooth transitions ──
    const node = this.gNodes.selectAll('g.node')
      .data(nodes, d => d.id);

    node.exit()
      .transition()
      .duration(animate ? 800 : 0)
      .ease(d3.easeCubicInOut)
      .attr('opacity', 0)
      .attr('transform', d => `translate(${d.x || 0},${d.y || 0}) scale(0)`)
      .remove();

    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('opacity', 0)
      .call(d3.drag()
        .on('start', (e, d) => this.dragstarted(e, d))
        .on('drag', (e, d) => this.dragged(e, d))
        .on('end', (e, d) => this.dragended(e, d))
      );

    nodeEnter.append('circle')
      .attr('class', 'node-circle')
      .attr('r', 0)
      .attr('fill', d => PANTHEON_COLORS[d.pantheon] || '#888')
      .attr('stroke', d => {
        if (activePath.includes(d.id)) return '#fbbf24';
        return d.id === centerDeityId ? '#fff' : 'rgba(255,255,255,0.2)';
      })
      .attr('stroke-width', d => {
        if (activePath.includes(d.id)) return 3;
        return d.id === centerDeityId ? 2.5 : 1.5;
      })
      .style('color', d => PANTHEON_COLORS[d.pantheon] || '#888');


    nodeEnter.append('circle')
      .attr('class', 'pin-ring')
      .attr('r', d => d.id === centerDeityId ? 18 : 14)
      .attr('fill', 'none')
      .attr('stroke', 'var(--gold)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .style('display', 'none')
      .style('pointer-events', 'none');

    nodeEnter.append('text')
      .attr('class', 'node-label')
      .attr('dx', 14)
      .attr('dy', 4)
      .text(d => d.id)
      .style('display', showLabels ? 'block' : 'none');

    const nodeMerge = nodeEnter.merge(node);
    
    nodeMerge.classed('node-center', d => d.id === centerDeityId);

    if (animate) {
      nodeEnter
        .transition()
        .delay((_, i) => i * 40)
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1);

      nodeEnter.select('circle.node-circle')
        .transition()
        .delay((_, i) => i * 40)
        .duration(600)
        .ease(d3.easeElasticOut.amplitude(1).period(0.4))
        .attr('r', d => d.id === centerDeityId ? 14 : 8);

      // existing nodes stay visible immediately
      nodeMerge.filter(function () {
        return !this.__enter__;   // only non-enter
      }).attr('opacity', 1)
        .select('circle.node-circle').attr('r', d => d.id === centerDeityId ? 14 : 8);
    } else {
      nodeMerge.attr('opacity', 1);
      nodeMerge.select('circle').attr('r', d => d.id === centerDeityId ? 14 : 8);
    }

    nodeMerge
      .on('click', (e, d) => {
        e.stopPropagation();
        this.generator.handleNodeClick(d.id);
      })
      .on('dblclick', (e, d) => {
        e.stopPropagation();
        this.togglePin(d);
      })
      .on('mouseover', (e, d) => this.onNodeHover(e, d))
      .on('mouseout', () => this.hideTooltip());

    linkMerge
      .on('mouseover', (e, d) => this.onEdgeHover(e, d))
      .on('mouseout', () => this.hideTooltip());

    // ── Simulation with smooth clustering ──
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => d.id)
        .distance(d => {
          const s = d.similarity || 0;
          return 40 + (1 - s) * 140;
        })
        .strength(d => 0.3 + (d.similarity || 0) * 0.7)
      )
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(20));

    if (cluster) {
      const pantheons = [...new Set(nodes.map(n => n.pantheon))];
      const angleStep = (2 * Math.PI) / pantheons.length;
      const clusterCenters = {};
      pantheons.forEach((p, i) => {
        clusterCenters[p] = {
          x: W / 2 + Math.cos(i * angleStep) * 150,
          y: H / 2 + Math.sin(i * angleStep) * 150,
        };
      });
      this.simulation
        .force('cluster', d3.forceX(d => clusterCenters[d.pantheon]?.x || W / 2).strength(0.2))
        .force('clusterY', d3.forceY(d => clusterCenters[d.pantheon]?.y || H / 2).strength(0.2));
    }

    this.simulation.alpha(0.45).restart();

    this.simulation.on('tick', () => {
      linkMerge
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeMerge
        .attr('transform', d => `translate(${d.x},${d.y})`);

      this.updateMinimap();
    });

    // One idle start only
    this.simulation.on('end', () => this._startIdleMotion());
  }

  dragstarted(event, d) {
    this._stopIdleMotion();
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  dragended(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    const pinned = this.store.get(STATE_KEYS.PINNED_NODES);
    if (!pinned.has(d.id)) {
      d.fx = null;
      d.fy = null;
    }
    // restart idle after drag settles
    if (this.simulation) {
      this.simulation.on('end', () => this._startIdleMotion());
    }
  }

  togglePin(d) {
    const pinned = new Set(this.store.get(STATE_KEYS.PINNED_NODES));
    if (pinned.has(d.id)) {
      pinned.delete(d.id);
      d.fx = null;
      d.fy = null;
    } else {
      pinned.add(d.id);
      d.fx = d.x;
      d.fy = d.y;
    }
    this.store.set(STATE_KEYS.PINNED_NODES, pinned);
    this.updatePinRings();
    this.store.set(STATE_KEYS.UI_TOAST,
      pinned.has(d.id) ? `Pinned ${d.id}` : `Unpinned ${d.id}`);
  }

  updatePinRings() {
    const pinned = this.store.get(STATE_KEYS.PINNED_NODES);
    this.gNodes.selectAll('g.node').each(function (d) {
      d3.select(this).select('.pin-ring')
        .style('display', pinned.has(d.id) ? 'block' : 'none');
    });
  }

  onNodeHover(event, d) {
    const topTraits = Object.entries(d.traits || {})
      .filter(([, v]) => v > 0.4)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k, v]) => `${k} (${Math.round(v * 100)}%)`)
      .join(' · ');

    this.tooltip
      .style('opacity', 1)
      .html(`
        <div class="tt-name">${d.id}</div>
        <div class="tt-pantheon" style="color:${PANTHEON_COLORS[d.pantheon]}">${d.pantheon}</div>
        <div class="tt-epithet">${d.epithet || ''}</div>
        ${d.originalScript ? `<div style="font-size:12px;opacity:.7;margin:2px 0">${d.originalScript}</div>` : ''}
        <div class="tt-traits" style="margin-top:6px">${topTraits || 'No strong traits'}</div>
      `)
      .style('left', (event.pageX + 14) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  onEdgeHover(event, d) {
    const srcId = d.source.id || d.source;
    const tgtId = d.target.id || d.target;
    const sim = d.similarity ?? d.weight ?? 0;
    const shared = d.shared || d._shared || [];

    this.tooltip
      .style('opacity', 1)
      .html(`
        <div class="tt-name">${srcId} ↔ ${tgtId}</div>
        <div class="tt-sim">${(sim * 100).toFixed(1)}% similarity</div>
        <div class="tt-traits">Shared: ${shared.length ? shared.join(', ') : '—'}</div>
      `)
      .style('left', (event.pageX + 14) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  hideTooltip() {
    this.tooltip.style('opacity', 0);
  }

  highlightByTrait(trait) {
    this.gNodes.selectAll('g.node')
      .attr('opacity', d => (d.traits && d.traits[trait] > 0) ? 1 : 0.15);
  }

  clearHighlight() {
    this.gNodes.selectAll('g.node').attr('opacity', 1);
    this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
  }

  setLabelsVisible(show) {
    this.gNodes.selectAll('.node-label')
      .style('display', show ? 'block' : 'none');
  }

  resetZoom() {
    this.svg.transition().duration(400)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  zoomIn() {
    this.svg.transition().duration(200)
      .call(this.zoom.scaleBy, 1.3);
  }

  zoomOut() {
    this.svg.transition().duration(200)
      .call(this.zoom.scaleBy, 0.7);
  }

  unpinAll(nodes) {
    nodes.forEach(n => { n.fx = null; n.fy = null; });
    this.store.set(STATE_KEYS.PINNED_NODES, new Set());
    this.updatePinRings();
    if (this.simulation) this.simulation.alpha(0.3).restart();
  }

  updateMinimap() {
    const now = performance.now();
    if (now - this._minimapLast < 100) return; // ~10 fps max
    this._minimapLast = now;

    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!this.currentNodes || !this.currentNodes.length) return;

    const gw = this.W() || 1, gh = this.H() || 1;
    this.currentNodes.forEach(n => {
      if (n.x == null) return;
      ctx.fillStyle = PANTHEON_COLORS[n.pantheon] || '#888';
      ctx.beginPath();
      ctx.arc((n.x / gw) * W, (n.y / gh) * H, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  _startIdleMotion() {
    if (this._idleTimer) return;
    this._idleTimer = setInterval(() => {
      this.gNodes.selectAll('g.node:not(.node-center) circle.node-circle')
        .transition().duration(1800)
        .attr('r', 8.8)
        .transition().duration(1800)
        .attr('r', 8);
    }, 4000);
  }

  _stopIdleMotion() {
    if (this._idleTimer) {
      clearInterval(this._idleTimer);
      this._idleTimer = null;
    }
  }

  clearGraph() {
    this._stopIdleMotion();
    if (this.simulation) this.simulation.stop();
    this.gLinks.selectAll('*').remove();
    this.gNodes.selectAll('*').remove();
    this.updateMinimap();
  }

  highlightPath(path) {
  // clear previous
  this.gNodes.selectAll('g.node').classed('node-dimmed', false).classed('node-highlighted', false);
  this.gLinks.selectAll('line.link').classed('link-dimmed', false).classed('link-path', false);

  if (!path || path.length < 2) return;

  const inPath = new Set(path);
  const edgeSet = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    edgeSet.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }

  this.gNodes.selectAll('g.node')
    .classed('node-dimmed', d => !inPath.has(d.id))
    .classed('node-highlighted', d => inPath.has(d.id));

  this.gLinks.selectAll('line.link')
    .classed('link-dimmed', d => {
      const s = d.source.id || d.source;
      const t = d.target.id || d.target;
      const key = s < t ? `${s}|${t}` : `${t}|${s}`;
      return !edgeSet.has(key);
    })
    .classed('link-path', d => {
      const s = d.source.id || d.source;
      const t = d.target.id || d.target;
      const key = s < t ? `${s}|${t}` : `${t}|${s}`;
      return edgeSet.has(key);
    });
}
}
