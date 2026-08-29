import {
  getDeityById,
  computeSimilarity,
  sharedTraits,
} from '../utils/similarity.js';
import { workerClient } from '../utils/workerClient.js';
import { STATE_KEYS } from '../utils/store.js';
import { DEITIES, getTraitValue } from '../data/deities.js';
import { getCognate } from '../data/cognates.js';

export class Generator {
  constructor(store, feedback) {
    this.store = store;
    this.feedback = feedback;
    this.currentGenerationId = 0;
  }

  getCandidateDeities() {
    const cutoff = this.store.get(STATE_KEYS.ERA_FILTER);
    return cutoff == null ? DEITIES : DEITIES.filter(d => d.era <= cutoff);
  }

  async loadDeity(nameOrId, options = {}) {
    const deity = getDeityById(nameOrId);
    if (!deity) {
      this.store.set(STATE_KEYS.UI_TOAST, `"${nameOrId}" not found`);
      return;
    }

    const { resetGraph = false } = options;
    if (resetGraph || this.store.get(STATE_KEYS.MODE) !== 'explore') {
      this.store.set(STATE_KEYS.GRAPH_DATA, { nodes: [], edges: [] });
    }

    this.store.set(STATE_KEYS.SELECTED_DEITY, deity.id);
    this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
    this.store.set(STATE_KEYS.CURRENT_VIEW, 'graph');
    await this.generate();
  }

  loadExplicitGraph(deityIds, options = {}) {
    const candidateIds = new Set(this.getCandidateDeities().map(d => d.id));
    const seen = new Set();
    const nodes = deityIds
      .map(id => getDeityById(id))
      .filter(Boolean)
      .filter(d => candidateIds.has(d.id))
      .filter(d => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });

    if (!nodes.length) {
      this.store.set(STATE_KEYS.UI_TOAST, 'No tour deities match the active era filter');
      return false;
    }

    const metric = this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine';
    const threshold = this.store.get(STATE_KEYS.GRAPH_THRESHOLD) ?? 0.35;
    const edges = this.buildEdges(nodes, metric, threshold);
    const requestedCenter = options.centerId && nodes.find(d => d.id === options.centerId);
    const center = requestedCenter || nodes[0];

    this.currentGenerationId++;
    this.store.set(STATE_KEYS.SELECTED_DEITY, center.id);
    this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
    this.store.set(STATE_KEYS.CURRENT_VIEW, 'graph');
    // GRAPH_DATA is set after SELECTED_DEITY so GraphView reads the correct center.
    this.store.set(STATE_KEYS.GRAPH_DATA, { nodes, edges });
    this.store.set(STATE_KEYS.UI_STATUS, `${nodes.length} curated deities · ${edges.length} connections`);
    return true;
  }

  async generate() {
    const deityId = this.store.get(STATE_KEYS.SELECTED_DEITY);
    const activeTrait = this.store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);
    if (!deityId && !activeTrait) return;

    const genId = ++this.currentGenerationId;
    this.store.set(STATE_KEYS.UI_LOADING, true);

    try {
      const metric = this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine';
      const threshold = this.store.get(STATE_KEYS.GRAPH_THRESHOLD) ?? 0.35;
      const linkMode = this.store.get(STATE_KEYS.LINK_MODE) || 'top5';
      const candidateDeities = this.getCandidateDeities();

      if (activeTrait) {
        this.generateArchetypeGraph(activeTrait, candidateDeities, metric, threshold, genId);
        return;
      }

      const deity = getDeityById(deityId);
      if (!deity) return;

      if (!candidateDeities.some(d => d.id === deity.id)) {
        this.store.set(STATE_KEYS.GRAPH_DATA, { nodes: [], edges: [] });
        this.store.set(STATE_KEYS.UI_STATUS, 'Selected deity is outside the active era filter');
        this.store.set(STATE_KEYS.UI_TOAST, `${deity.id} is outside the active era filter`);
        return;
      }

      const connections = await workerClient.getConnections(
        deity,
        candidateDeities,
        metric,
        threshold,
      );

      if (genId !== this.currentGenerationId) return;

      let limited;
      if (linkMode === 'kin') limited = connections.slice(0, 1);
      else if (linkMode === 'top5') limited = connections.slice(0, 5);
      else if (linkMode === 'top10') limited = connections.slice(0, 10);
      else limited = connections;

      if (linkMode === 'kin') {
        const nodes = [deity, ...limited.map(c => c.deity)];
        const edges = limited.map(c => this.connectionToEdge(deity, c));
        this.store.set(STATE_KEYS.GRAPH_DATA, { nodes, edges });
        this.store.set(STATE_KEYS.UI_STATUS, `${nodes.length} deities · ${edges.length} connections (Kin)`);
        return;
      }

      const existing = this.store.get(STATE_KEYS.GRAPH_DATA) || { nodes: [], edges: [] };
      const nodes = [...existing.nodes].filter(n => candidateDeities.some(d => d.id === n.id));
      const existingNodeIds = new Set(nodes.map(n => n.id));
      const validNodeIds = new Set(nodes.map(n => n.id));
      const edges = existing.edges.filter(e => {
        const source = e.source?.id || e.source;
        const target = e.target?.id || e.target;
        return validNodeIds.has(source) && validNodeIds.has(target);
      });
      const existingEdgeKeys = new Set(edges.map(e => this.edgeKey(e.source, e.target)));

      if (!existingNodeIds.has(deity.id)) {
        nodes.push(deity);
        existingNodeIds.add(deity.id);
      }

      for (const connection of limited) {
        if (!existingNodeIds.has(connection.deity.id)) {
          nodes.push(connection.deity);
          existingNodeIds.add(connection.deity.id);
        }
      }

      for (const connection of limited) {
        const key = this.edgeKey(deity.id, connection.deity.id);
        if (!existingEdgeKeys.has(key)) {
          edges.push(this.connectionToEdge(deity, connection));
          existingEdgeKeys.add(key);
        }
      }

      this.store.set(STATE_KEYS.GRAPH_DATA, { nodes, edges });
      this.store.set(STATE_KEYS.UI_STATUS, `${nodes.length} deities · ${edges.length} connections`);
    } catch (err) {
      console.error('[Generator] Error:', err);
      this.store.set(STATE_KEYS.UI_TOAST, 'Error: ' + err.message);
    } finally {
      if (genId === this.currentGenerationId) {
        this.store.set(STATE_KEYS.UI_LOADING, false);
      }
    }
  }

  buildEdges(nodes, metric, threshold) {
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const score = computeSimilarity(a, b, metric);
        if (score < threshold) continue;

        edges.push({
          source: a.id,
          target: b.id,
          similarity: score,
          shared: sharedTraits(a, b),
          cognate: getCognate(a.id, b.id) || null,
        });
      }
    }
    return edges;
  }

  generateArchetypeGraph(activeTrait, candidateDeities, metric, threshold, genId) {
    const nodes = candidateDeities.filter(d => getTraitValue(d, activeTrait) > 0.2);
    if (genId !== this.currentGenerationId) return;

    const edges = this.buildEdges(nodes, metric, threshold);
    this.store.set(STATE_KEYS.GRAPH_DATA, { nodes, edges });
    this.store.set(
      STATE_KEYS.UI_STATUS,
      `${nodes.length} deities · ${edges.length} connections (Archetype: ${activeTrait})`,
    );
  }

  edgeKey(source, target) {
    const s = source?.id || source;
    const t = target?.id || target;
    return s < t ? `${s}|${t}` : `${t}|${s}`;
  }

  connectionToEdge(deity, connection) {
    return {
      source: deity.id,
      target: connection.deity.id,
      similarity: connection.score,
      shared: connection.shared || [],
      cognate: connection.cognate || null,
    };
  }

  clearGraph() {
    this.currentGenerationId++;
    this.store.set(STATE_KEYS.GRAPH_DATA, { nodes: [], edges: [] });
    this.store.set(STATE_KEYS.SELECTED_DEITY, null);
    this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
    this.store.set(STATE_KEYS.PINNED_NODES, new Set());
    this.store.set(STATE_KEYS.ACTIVE_PATH, []);
    this.store.set(STATE_KEYS.PATH_FROM, null);
    this.store.set(STATE_KEYS.PATH_TO, null);
    this.store.set(STATE_KEYS.UI_LOADING, false);
    this.store.set(STATE_KEYS.UI_STATUS, '');
  }

  surprise() {
    const candidates = this.getCandidateDeities();
    if (!candidates.length) return;
    const deity = candidates[Math.floor(Math.random() * candidates.length)];
    this.loadDeity(deity.id, { resetGraph: true });
    this.store.set(STATE_KEYS.UI_TOAST, `✦ ${deity.id} — ${deity.epithet}`);
  }

  handleNodeClick(nodeId) {
    const mode = this.store.get(STATE_KEYS.MODE);
    const expandOnClick = this.store.get(STATE_KEYS.EXPAND_ON_CLICK);

    if (mode === 'compare') {
      const a = this.store.get(STATE_KEYS.COMPARE_A);
      if (!a) {
        this.store.set(STATE_KEYS.COMPARE_A, nodeId);
        this.store.set(STATE_KEYS.UI_TOAST, `Selected ${nodeId}. Pick a second deity.`);
      } else {
        this.store.set(STATE_KEYS.COMPARE_B, nodeId);
        document.getElementById('compare-modal')?.classList.add('open');
      }
      return;
    }

    if (mode === 'path') {
      const from = this.store.get(STATE_KEYS.PATH_FROM);
      if (!from) {
        this.store.set(STATE_KEYS.PATH_FROM, nodeId);
        this.store.set(STATE_KEYS.UI_TOAST, `Path start: ${nodeId}. Pick destination.`);
      } else if (from === nodeId) {
        this.store.set(STATE_KEYS.UI_TOAST, 'Pick a different destination.');
      } else {
        this.store.set(STATE_KEYS.PATH_TO, nodeId);
        this.findPath(from, nodeId);
      }
      return;
    }

    if (expandOnClick) {
      this.store.set(STATE_KEYS.SELECTED_DEITY, nodeId);
      this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
      this.generate();
    } else {
      this.store.set(STATE_KEYS.SELECTED_DEITY, nodeId);
    }
  }

  handleTraitClick(trait) {
    this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, trait);
    this.generate();
  }

  async findPath(fromId, toId) {
    this.store.set(STATE_KEYS.UI_LOADING, true);

    try {
      const candidates = this.getCandidateDeities();
      const metric = this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine';
      const threshold = this.store.get(STATE_KEYS.GRAPH_THRESHOLD) ?? 0.35;
      const pathIds = await workerClient.findPath(fromId, toId, candidates, metric, threshold);

      if (!pathIds?.length) {
        this.store.set(STATE_KEYS.ACTIVE_PATH, []);
        this.store.set(STATE_KEYS.UI_TOAST, 'No path found between those deities.');
        window.dispatchEvent(new CustomEvent('path:found', { detail: null }));
        return;
      }

      this.store.set(STATE_KEYS.ACTIVE_PATH, pathIds);
      const nodes = pathIds.map(id => candidates.find(d => d.id === id)).filter(Boolean);
      const edges = [];

      for (let i = 0; i < pathIds.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        const similarity = a && b ? computeSimilarity(a, b, metric) : 0;
        edges.push({
          source: pathIds[i],
          target: pathIds[i + 1],
          similarity,
          shared: a && b ? sharedTraits(a, b) : [],
          cognate: a && b ? getCognate(a.id, b.id) || null : null,
          isPathEdge: true,
        });
      }

      this.store.set(STATE_KEYS.GRAPH_DATA, { nodes, edges });
      this.store.set(STATE_KEYS.CURRENT_VIEW, 'graph');
      this.store.set(STATE_KEYS.UI_STATUS, `${nodes.length} deities · ${edges.length} path steps`);
      this.store.set(STATE_KEYS.UI_TOAST, `Path: ${pathIds.join(' → ')}`);
      this.store.set(STATE_KEYS.MODE, 'explore');
      document.getElementById('path-btn')?.classList.remove('btn-active');
      window.dispatchEvent(new CustomEvent('path:found', { detail: pathIds }));
    } catch (err) {
      this.store.set(STATE_KEYS.ACTIVE_PATH, []);
      this.store.set(STATE_KEYS.UI_TOAST, 'Path error: ' + err.message);
      window.dispatchEvent(new CustomEvent('path:found', { detail: null }));
    } finally {
      this.store.set(STATE_KEYS.UI_LOADING, false);
    }
  }
}
