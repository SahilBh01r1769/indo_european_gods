/* ─────────────────────────────────────────────────────────────────
   core/Generator.js — Graph generation + worker orchestration (v2)
   Matches the actual workerClient API
   ───────────────────────────────────────────────────────────────── */
import { getDeityById, computeSimilarity } from '../utils/similarity.js';
import { workerClient } from '../utils/workerClient.js';
import { STATE_KEYS } from '../utils/store.js';
import { DEITIES } from '../data/deities.js';

export class Generator {
  constructor(store, feedback) {
    this.store = store;
    this.feedback = feedback;
    this.currentGenerationId = 0; // FIX 1: Race condition tracker
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
    this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null); // Clear archetype filter
    this.store.set(STATE_KEYS.CURRENT_VIEW, 'graph');

    await this.generate();
  }

  async generate() {
    const deityId = this.store.get(STATE_KEYS.SELECTED_DEITY);
    const activeTrait = this.store.get(STATE_KEYS.ACTIVE_TRAIT_FILTER);
    
    if (!deityId && !activeTrait) return;

    const genId = ++this.currentGenerationId; // FIX 1: Increment generation ID
    this.store.set(STATE_KEYS.UI_LOADING, true);

    try {
      const metric     = this.store.get(STATE_KEYS.SIMILARITY_METHOD) || 'cosine';
      const threshold  = this.store.get(STATE_KEYS.GRAPH_THRESHOLD)  || 0.35;
      const linkMode   = this.store.get(STATE_KEYS.LINK_MODE)        || 'top5';
      const eraFilter  = this.store.get(STATE_KEYS.ERA_FILTER)       || 0;

      const eraMap = { 5: -2000, 4: -1500, 3: -800, 2: -100, 1: 800 };
      let candidateDeities = DEITIES;
      if (eraFilter > 0) {
        const cutoff = eraMap[eraFilter];
        candidateDeities = DEITIES.filter(d => d.era >= cutoff);
      }

      if (activeTrait) {
        // ── ARCHETYPE MODE (FIX 2) ──
        const tNorm = activeTrait.toLowerCase().replace(/\s*\/\s*/g, ' / ').trim();
        
        const matchingDeities = candidateDeities.filter(d => {
          if (!d.traits) return false;
          return Object.keys(d.traits).some(k => {
            const kNorm = k.toLowerCase().replace(/\s*\/\s*/g, ' / ').trim();
            return kNorm === tNorm && d.traits[k] > 0.2;
          });
        });

        // Abort if a newer request was made while filtering
        if (genId !== this.currentGenerationId) return;

        const nodes = matchingDeities;
        const edges = [];

        // Compute edges between ALL matching deities
        for (let i = 0; i < matchingDeities.length; i++) {
          for (let j = i + 1; j < matchingDeities.length; j++) {
            const a = matchingDeities[i];
            const b = matchingDeities[j];
            const score = computeSimilarity(a, b, metric);
            if (score >= threshold) {
              edges.push({
                source: a.id,
                target: b.id,
                similarity: score,
                shared: [],
              });
            }
          }
        }

        this.store.set(STATE_KEYS.GRAPH_DATA, { nodes, edges });
        this.store.set(STATE_KEYS.UI_STATUS, `${nodes.length} deities · ${edges.length} connections (Archetype: ${activeTrait})`);

      } 
      
      else {
      // ── NORMAL MODE ──
      const deity = getDeityById(deityId);

      const connections = await workerClient.getConnections(
        deity, candidateDeities, metric, threshold
      );

      if (genId !== this.currentGenerationId) return;

      let limited;
      if (linkMode === 'kin')        limited = connections.slice(0, 1);
      else if (linkMode === 'top5')  limited = connections.slice(0, 5);
      else if (linkMode === 'top10') limited = connections.slice(0, 10);
      else                           limited = connections; // "all"

      // Kin mode = always a clean 2-node graph (selected + closest)
      if (linkMode === 'kin') {
        const nodes = [deity, ...limited.map(c => c.deity)];
        const edges = limited.map(c => ({
          source: deity.id,
          target: c.deity.id,
          similarity: c.score,
          shared: c.shared,
        }));

        this.store.set(STATE_KEYS.GRAPH_DATA, { nodes, edges });
        this.store.set(STATE_KEYS.UI_STATUS, `${nodes.length} deities · ${edges.length} connections (Kin)`);
        return;
      }

      // ── Expand / merge for Top 5, Top 10, All ──
      const existing = this.store.get(STATE_KEYS.GRAPH_DATA) || { nodes: [], edges: [] };
      const existingNodeIds = new Set(existing.nodes.map(n => n.id));
      const existingEdgeKeys = new Set(
        existing.edges.map(e => {
          const s = e.source.id || e.source;
          const t = e.target.id || e.target;
          return s < t ? `${s}|${t}` : `${t}|${s}`;
        })
      );

      const nodes = [...existing.nodes];
      if (!existingNodeIds.has(deity.id)) {
        nodes.push(deity);
        existingNodeIds.add(deity.id);
      }
      for (const c of limited) {
        if (!existingNodeIds.has(c.deity.id)) {
          nodes.push(c.deity);
          existingNodeIds.add(c.deity.id);
        }
      }

      const edges = [...existing.edges];
      for (const c of limited) {
        const key = deity.id < c.deity.id
          ? `${deity.id}|${c.deity.id}`
          : `${c.deity.id}|${deity.id}`;
        if (!existingEdgeKeys.has(key)) {
          edges.push({
            source: deity.id,
            target: c.deity.id,
            similarity: c.score,
            shared: c.shared,
          });
          existingEdgeKeys.add(key);
        }
      }

      this.store.set(STATE_KEYS.GRAPH_DATA, { nodes, edges });
      this.store.set(STATE_KEYS.UI_STATUS, `${nodes.length} deities · ${edges.length} connections`);
      }

    } catch (err) {
      console.error('[Generator] Error:', err);
      this.store.set(STATE_KEYS.UI_TOAST, 'Error: ' + err.message);
    } finally {
      this.store.set(STATE_KEYS.UI_LOADING, false);
    }
  }

  clearGraph() {
    this.store.set(STATE_KEYS.GRAPH_DATA, { nodes: [], edges: [] });
    this.store.set(STATE_KEYS.SELECTED_DEITY, null);
    this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null);
    this.store.set(STATE_KEYS.PINNED_NODES, new Set());
    this.store.set(STATE_KEYS.UI_STATUS, '');
  }

  surprise() {
    const d = DEITIES[Math.floor(Math.random() * DEITIES.length)];
    this.loadDeity(d.id, { resetGraph: true });
    this.store.set(STATE_KEYS.UI_TOAST, `✦ ${d.id} — ${d.epithet}`);
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
        // Do NOT leave compare mode — let the user click the Compare button again to exit
        document.getElementById('compare-modal')?.classList.add('open');
      }
      return;
    }

    if (mode === 'path') {
      const from = this.store.get(STATE_KEYS.PATH_FROM);
      if (!from) {
        this.store.set(STATE_KEYS.PATH_FROM, nodeId);
        this.store.set(STATE_KEYS.UI_TOAST, `Path start: ${nodeId}. Pick destination.`);
      } else {
        this.store.set(STATE_KEYS.PATH_TO, nodeId);
        this.store.set(STATE_KEYS.MODE, 'explore');
      }
      return;
    }

    // Explore mode
    if (expandOnClick) {
      this.store.set(STATE_KEYS.SELECTED_DEITY, nodeId);
      this.store.set(STATE_KEYS.ACTIVE_TRAIT_FILTER, null); // Clear archetype filter
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
      const path = await workerClient.findPath(
        fromId, toId, DEITIES,
        this.store.get(STATE_KEYS.SIMILARITY_METHOD),
        this.store.get(STATE_KEYS.GRAPH_THRESHOLD)
      );
      if (path) {
        this.store.set(STATE_KEYS.UI_TOAST, `Path: ${path.join(' → ')}`);
      } else {
        this.store.set(STATE_KEYS.UI_TOAST, 'No path found between those deities.');
      }
    } catch (err) {
      this.store.set(STATE_KEYS.UI_TOAST, 'Path error: ' + err.message);
    } finally {
      this.store.set(STATE_KEYS.UI_LOADING, false);
    }
  }
}


