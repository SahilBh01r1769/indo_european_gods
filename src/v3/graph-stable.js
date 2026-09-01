import { MythGraph as RuntimeGraph } from './graph-runtime.js';
import { deityAccent, deityGlyph } from './model.js';
import { availableClues } from './state.js';

const edgeClass = kind => `edge-kind-${kind || 'model'}`;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashUnit(id) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export class MythGraph extends RuntimeGraph {
  constructor(container, handlers = {}) {
    super(container, handlers);

    this.resizeObserver?.disconnect();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    this.networkPositions = new Map();
    this.networkLayoutKey = null;
    this.resizeFrame = null;
    this.lastObservedSize = this.dimensions();
    this.pendingReveal = null;

    const scheduleResize = () => {
      const next = this.dimensions();
      const previous = this.lastObservedSize;
      if (Math.abs(next.width - previous.width) < 2 && Math.abs(next.height - previous.height) < 2) return;
      this.lastObservedSize = next;
      if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = null;
        if (this.lastState) this.render(this.lastState);
      });
    };

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(scheduleResize);
      this.resizeObserver.observe(container);
    } else {
      this.resizeHandler = scheduleResize;
      window.addEventListener('resize', this.resizeHandler, { passive: true });
    }
  }

  destroy() {
    if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
    super.destroy();
  }

  renderNetwork(discovered, edges, state, width, height) {
    this.clearDecoration();
    this.simulation?.stop();

    const reveal = this.pendingReveal;
    const clues = availableClues(state.selectedNode);
    const deityNodes = discovered.map(deity => ({ type: 'deity', id: deity.id, deity }));
    const clueNodes = clues.map(clue => ({ type: 'clue', id: clue.id, clue }));
    const nodes = [...deityNodes, ...clueNodes];
    const nodeIds = new Set(nodes.map(node => node.id));

    const selected = deityNodes.find(node => node.id === state.selectedNode);
    const selectedRemembered = selected ? this.networkPositions.get(selected.id) || this.positions.get(selected.id) : null;
    const anchor = {
      x: selectedRemembered?.x ?? width * .52,
      y: selectedRemembered?.y ?? height * .48,
    };

    deityNodes.forEach((node, index) => {
      const remembered = this.networkPositions.get(node.id) || this.positions.get(node.id);
      if (remembered) {
        node.x = remembered.x;
        node.y = remembered.y;
        return;
      }
      if (reveal && node.id === reveal.target) {
        node.x = reveal.x;
        node.y = reveal.y;
        return;
      }
      if (node.id === state.selectedNode) {
        node.x = anchor.x;
        node.y = anchor.y;
        return;
      }
      const angle = hashUnit(node.id) * Math.PI * 2;
      const radius = 125 + (index % 4) * 22;
      node.x = anchor.x + Math.cos(angle) * radius;
      node.y = anchor.y + Math.sin(angle) * radius;
    });

    clueNodes.forEach((node, index) => {
      const remembered = this.networkPositions.get(node.id);
      if (remembered) {
        node.x = remembered.x;
        node.y = remembered.y;
        return;
      }
      const spread = Math.max(1, clueNodes.length);
      const angle = -Math.PI / 2 + (index / spread) * Math.PI * 2 + hashUnit(node.id) * .18;
      const radius = 128 + (index % 2) * 18;
      node.x = anchor.x + Math.cos(angle) * radius;
      node.y = anchor.y + Math.sin(angle) * radius;
    });

    const links = [
      ...edges.map(edge => ({
        id: edge.id,
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
        kind: edge.kind,
        type: 'revealed',
      })),
      ...clues.map(clue => ({
        id: clue.id,
        edgeId: null,
        source: clue.from,
        target: clue.id,
        kind: 'mystery',
        type: 'clue',
      })),
    ].filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));

    const edgeSelection = this.edgeLayer
      .selectAll('line.graph-edge')
      .data(links, link => link.id);

    edgeSelection.exit().remove();

    const edgeEntered = edgeSelection.enter()
      .append('line')
      .attr('class', 'graph-edge');

    const edgesMerged = edgeEntered
      .merge(edgeSelection)
      .attr('class', link => `graph-edge ${link.type === 'clue' ? 'edge-mystery' : edgeClass(link.kind)}`)
      .classed('edge-selected', link => link.edgeId === state.selectedEdge)
      .on('click', (_, link) => {
        if (link.type === 'revealed' && link.edgeId) this.handlers.onEdge?.(link.edgeId);
      });

    const nodeSelection = this.nodeLayer
      .selectAll('g.graph-node')
      .data(nodes, node => node.id);

    nodeSelection.exit().remove();

    const entered = nodeSelection.enter()
      .append('g')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .on('click', (_, node) => {
        if (node.type === 'deity') {
          this.handlers.onNode?.(node.deity.id);
        } else {
          this.pendingReveal = {
            clueId: node.id,
            target: node.clue.target,
            from: node.clue.from,
            x: node.x,
            y: node.y,
          };
          this.handlers.onReveal?.(node.clue);
        }
      })
      .on('keydown', (event, node) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (node.type === 'deity') {
          this.handlers.onNode?.(node.deity.id);
        } else {
          this.pendingReveal = {
            clueId: node.id,
            target: node.clue.target,
            from: node.clue.from,
            x: node.x,
            y: node.y,
          };
          this.handlers.onReveal?.(node.clue);
        }
      });

    entered.append('circle').attr('class', 'node-halo');
    entered.append('circle').attr('class', 'node-disc');
    entered.append('text').attr('class', 'node-glyph').attr('text-anchor', 'middle').attr('dy', '.36em');
    entered.append('text').attr('class', 'node-name').attr('text-anchor', 'middle');
    entered.append('text').attr('class', 'node-meta').attr('text-anchor', 'middle');

    const nodesMerged = entered.merge(nodeSelection)
      .attr('class', node => `graph-node graph-node-${node.type}`)
      .classed('is-selected', node => node.type === 'deity' && node.deity.id === state.selectedNode)
      .attr('aria-label', node => node.type === 'deity'
        ? `${node.deity.id}, ${node.deity.pantheon}`
        : `Mystery clue: ${node.clue.label}. ${node.clue.hint}`);

    nodesMerged.select('.node-halo')
      .attr('r', node => node.type === 'deity' ? (node.deity.id === state.selectedNode ? 37 : 31) : 29)
      .style('stroke', node => node.type === 'deity' ? deityAccent(node.deity) : '#aa9877');

    nodesMerged.select('.node-disc')
      .attr('r', node => node.type === 'deity' ? 24 : 21)
      .style('stroke', node => node.type === 'deity' ? deityAccent(node.deity) : '#918575');

    nodesMerged.select('.node-glyph')
      .style('fill', node => node.type === 'deity' ? deityAccent(node.deity) : '#625b52')
      .text(node => node.type === 'deity' ? deityGlyph(node.deity) : '?');

    nodesMerged.select('.node-name')
      .attr('y', node => node.type === 'deity' ? 50 : 48)
      .text(node => node.type === 'deity' ? node.deity.id : node.clue.label);

    nodesMerged.select('.node-meta')
      .attr('y', node => node.type === 'deity' ? 66 : 63)
      .text(node => node.type === 'deity' ? node.deity.pantheon : node.clue.hint);

    const layoutKey = [
      Math.round(width / 8),
      Math.round(height / 8),
      state.selectedNode,
      ...nodes.map(node => node.id).sort(),
      '|',
      ...links.map(link => link.id).sort(),
    ].join(':');

    const hasAllPositions = nodes.every(node => this.networkPositions.has(node.id));

    if (layoutKey !== this.networkLayoutKey || !hasAllPositions) {
      const selectedNode = deityNodes.find(node => node.id === state.selectedNode);
      const revealedNode = reveal ? deityNodes.find(node => node.id === reveal.target) : null;

      if (selectedNode) {
        selectedNode.fx = clamp(anchor.x, 86, width - 86);
        selectedNode.fy = clamp(anchor.y, 86, height - 92);
      }
      if (revealedNode) {
        revealedNode.fx = clamp(reveal.x, 82, width - 82);
        revealedNode.fy = clamp(reveal.y, 84, height - 88);
      }

      this.simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
          .id(node => node.id)
          .distance(link => link.type === 'clue' ? 132 : 166)
          .strength(link => link.type === 'clue' ? .66 : .34))
        .force('charge', d3.forceManyBody().strength(node => node.type === 'clue' ? -330 : -470))
        .force('center', d3.forceCenter(width * .52, height * .48))
        .force('collision', d3.forceCollide().radius(node => node.type === 'clue' ? 74 : 84))
        .alpha(.58)
        .alphaDecay(.085)
        .stop();

      for (let i = 0; i < 72; i++) this.simulation.tick();

      if (selectedNode) {
        selectedNode.x = selectedNode.fx;
        selectedNode.y = selectedNode.fy;
        selectedNode.fx = null;
        selectedNode.fy = null;
      }
      if (revealedNode) {
        revealedNode.x = revealedNode.fx;
        revealedNode.y = revealedNode.fy;
        revealedNode.fx = null;
        revealedNode.fy = null;
      }

      nodes.forEach(node => {
        node.x = clamp(Number.isFinite(node.x) ? node.x : width / 2, 82, width - 82);
        node.y = clamp(Number.isFinite(node.y) ? node.y : height / 2, 84, height - 88);
        this.networkPositions.set(node.id, { x: node.x, y: node.y });
        if (node.type === 'deity') this.positions.set(node.id, { x: node.x, y: node.y });
      });
      this.networkLayoutKey = layoutKey;
    } else {
      nodes.forEach(node => {
        const remembered = this.networkPositions.get(node.id);
        node.x = clamp(remembered.x, 82, width - 82);
        node.y = clamp(remembered.y, 84, height - 88);
      });
    }

    const place = () => {
      const nodeMap = new Map(nodes.map(node => [node.id, node]));
      edgesMerged
        .attr('x1', link => (typeof link.source === 'object' ? link.source : nodeMap.get(link.source))?.x ?? 0)
        .attr('y1', link => (typeof link.source === 'object' ? link.source : nodeMap.get(link.source))?.y ?? 0)
        .attr('x2', link => (typeof link.target === 'object' ? link.target : nodeMap.get(link.target))?.x ?? 0)
        .attr('y2', link => (typeof link.target === 'object' ? link.target : nodeMap.get(link.target))?.y ?? 0);
      nodesMerged.attr('transform', node => `translate(${node.x},${node.y})`);
    };

    place();

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reveal) {
      const revealedNode = nodes.find(node => node.id === reveal.target);
      const revealedRelation = links.find(link => link.type === 'revealed' && link.source && link.target &&
        ((typeof link.source === 'object' ? link.source.id : link.source) === reveal.from) &&
        ((typeof link.target === 'object' ? link.target.id : link.target) === reveal.target));

      if (revealedNode && !reduceMotion) {
        const targetSelection = nodesMerged.filter(node => node.id === reveal.target);
        targetSelection
          .interrupt()
          .style('opacity', .08)
          .attr('transform', `translate(${revealedNode.x},${revealedNode.y}) scale(.28)`)
          .transition()
          .duration(520)
          .ease(d3.easeCubicOut)
          .style('opacity', 1)
          .attr('transform', `translate(${revealedNode.x},${revealedNode.y}) scale(1)`);
      }

      if (revealedRelation && !reduceMotion) {
        const source = typeof revealedRelation.source === 'object' ? revealedRelation.source : nodes.find(node => node.id === reveal.from);
        const target = typeof revealedRelation.target === 'object' ? revealedRelation.target : nodes.find(node => node.id === reveal.target);
        edgeEntered
          .filter(link => link.id === revealedRelation.id)
          .interrupt()
          .attr('x1', source?.x ?? reveal.x)
          .attr('y1', source?.y ?? reveal.y)
          .attr('x2', source?.x ?? reveal.x)
          .attr('y2', source?.y ?? reveal.y)
          .style('opacity', .15)
          .transition()
          .duration(540)
          .ease(d3.easeCubicOut)
          .attr('x2', target?.x ?? reveal.x)
          .attr('y2', target?.y ?? reveal.y)
          .style('opacity', null);
      }

      this.pendingReveal = null;
    }

    nodesMerged.call(d3.drag()
      .on('start', event => {
        event.sourceEvent?.stopPropagation();
      })
      .on('drag', (event, node) => {
        node.x = clamp(event.x, 82, width - 82);
        node.y = clamp(event.y, 84, height - 88);
        this.networkPositions.set(node.id, { x: node.x, y: node.y });
        if (node.type === 'deity') this.positions.set(node.id, { x: node.x, y: node.y });
        place();
      }));

    if (discovered.length && clues.length === 0) {
      this.decor.append('text')
        .attr('class', 'graph-empty-note')
        .attr('x', width / 2)
        .attr('y', height - 32)
        .attr('text-anchor', 'middle')
        .text('No hidden paths remain here. Choose another discovered figure to continue.');
    }
  }
}
