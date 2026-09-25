import { TRADITION_POSITIONS } from "./config.js";
import {
  deityAccent,
  deityGlyph,
  eraLabel,
  getDeity,
  relationshipPassesEvidence,
} from "./model.js";
import { availableClues } from "./state.js";

const edgeClass = (kind) => `edge-kind-${kind || "model"}`;

function jitter(id, amount = 24) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 1000) / 999 - 0.5) * amount;
}

export class MythGraph {
  constructor(container, handlers = {}) {
    this.container = container;
    this.handlers = handlers;
    this.positions = new Map();
    this.lastState = null;
    this.lastMode = null;
    this.simulation = null;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("class", "myth-graph")
      .attr("role", "img")
      .attr("aria-label", "Your discovered mythology network");

    this.decor = this.svg.append("g").attr("class", "graph-decoration");
    this.edgeLayer = this.svg.append("g").attr("class", "graph-edges");
    this.nodeLayer = this.svg.append("g").attr("class", "graph-nodes");

    this.zoomRoot = this.svg.append("g").attr("class", "zoom-proxy");
    this.zoom = d3
      .zoom()
      .scaleExtent([0.55, 2.2])
      .on("zoom", (event) => {
        const transform = event.transform;
        this.decor.attr("transform", transform);
        this.edgeLayer.attr("transform", transform);
        this.nodeLayer.attr("transform", transform);
        this.nodeLayer.selectAll(".node-name").style("opacity", transform.k < 0.72 ? 0 : 1);
        this.nodeLayer.selectAll(".node-meta").style("opacity", transform.k < 1.05 ? 0 : 1);
      });
    this.svg.call(this.zoom);

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() =>
        this.render(this.lastState),
      );
      this.resizeObserver.observe(container);
    } else {
      this.resizeHandler = () => this.render(this.lastState);
      window.addEventListener("resize", this.resizeHandler);
    }
  }

  destroy() {
    this.simulation?.stop();
    this.resizeObserver?.disconnect();
    if (this.resizeHandler)
      window.removeEventListener("resize", this.resizeHandler);
    this.svg.remove();
  }

  dimensions() {
    const box = this.container.getBoundingClientRect();
    return {
      width: Math.max(320, box.width || 900),
      height: Math.max(420, box.height || 620),
    };
  }

  render(state) {
    if (!state) return;
    const modeChanged = this.lastMode !== state.mode;
    this.lastMode = state.mode;
    this.lastState = state;
    const { width, height } = this.dimensions();
    this.svg.attr("viewBox", `0 0 ${width} ${height}`);
    this.container.dataset.mode = state.mode;

    const discovered = state.discoveredNodes.map(getDeity).filter(Boolean);
    const edges = state.discoveredEdges
      .filter((edge) =>
        relationshipPassesEvidence(edge, state.evidenceLevel),
      )
      .map((edge) => ({
        ...edge,
        sourceDeity: getDeity(edge.source),
        targetDeity: getDeity(edge.target),
      }))
      .filter((edge) => edge.sourceDeity && edge.targetDeity);

    this.svg.call(this.zoom).classed("is-static-mode", state.mode !== "network");
    if (modeChanged) {
      this.svg.call(this.zoom.transform, d3.zoomIdentity);
    }

    if (state.mode === "time")
      return this.renderTime(discovered, edges, state, width, height);
    if (state.mode === "geography")
      return this.renderGeography(discovered, edges, state, width, height);
    return this.renderNetwork(discovered, edges, state, width, height);
  }

  clearDecoration() {
    this.decor.selectAll("*").remove();
  }

  resetZoomSilently() {
    this.decor.attr("transform", null);
    this.edgeLayer.attr("transform", null);
    this.nodeLayer.attr("transform", null);
  }

  renderNetwork(discovered, edges, state, width, height) {
    this.clearDecoration();
    this.simulation?.stop();

    const clues = availableClues(state.selectedNode);
    const deityNodes = discovered.map((deity) => ({
      type: "deity",
      id: deity.id,
      deity,
    }));
    const clueNodes = clues.map((clue) => ({
      type: "clue",
      id: clue.id,
      clue,
    }));
    const nodes = [...deityNodes, ...clueNodes];
    const nodeIds = new Set(nodes.map((node) => node.id));

    for (const node of deityNodes) {
      const remembered = this.positions.get(node.id);
      if (remembered) Object.assign(node, remembered);
    }

    const center = deityNodes.find((node) => node.id === state.selectedNode);
    if (center && !Number.isFinite(center.x)) {
      center.x = width * 0.52;
      center.y = height * 0.48;
    }

    // These are the exact link objects passed to d3.forceLink. forceLink mutates
    // source/target from ids into node objects, and the SVG edge join uses the
    // same objects, so tick positions stay valid.
    const links = [
      ...edges.map((edge) => ({
        id: edge.id,
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
        kind: edge.kind,
        type: "revealed",
      })),
      ...clues.map((clue) => ({
        id: clue.id,
        edgeId: null,
        source: clue.from,
        target: clue.id,
        kind: "mystery",
        type: "clue",
      })),
    ].filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target));

    const edgeSelection = this.edgeLayer
      .selectAll("line.graph-edge")
      .data(links, (link) => link.id);

    edgeSelection.exit().remove();

    const edgesMerged = edgeSelection
      .enter()
      .append("line")
      .attr("class", "graph-edge")
      .merge(edgeSelection)
      .attr(
        "class",
        (link) =>
          `graph-edge ${link.type === "clue" ? "edge-mystery" : edgeClass(link.kind)}`,
      )
      .classed("edge-selected", (link) => link.edgeId === state.selectedEdge)
      .on("click", (_, link) => {
        if (link.type === "revealed" && link.edgeId)
          this.handlers.onEdge?.(link.edgeId);
      });

    const edgeHits = this.edgeLayer.selectAll("line.graph-edge-hit")
      .data(links.filter((link) => link.type === "revealed"), (link) => link.id);
    edgeHits.exit().remove();
    const edgeHitsMerged = edgeHits.enter().append("line")
      .attr("class", "graph-edge-hit").attr("tabindex", 0).attr("role", "button")
      .merge(edgeHits)
      .attr("aria-label", (link) => `Inspect relationship between ${link.source.id || link.source} and ${link.target.id || link.target}`)
      .on("click", (_, link) => this.handlers.onEdge?.(link.edgeId))
      .on("keydown", (event, link) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.handlers.onEdge?.(link.edgeId);
        }
      });

    const nodeSelection = this.nodeLayer
      .selectAll("g.graph-node")
      .data(nodes, (node) => node.id);

    nodeSelection
      .exit()
      .transition()
      .duration(160)
      .style("opacity", 0)
      .remove();

    const entered = nodeSelection
      .enter()
      .append("g")
      .style("opacity", 0)
      .attr("tabindex", 0)
      .attr("role", "button")
      .on("click", (_, node) => {
        if (node.type === "deity") this.handlers.onNode?.(node.deity.id);
        else this.handlers.onReveal?.(node.clue);
      })
      .on("keydown", (event, node) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (node.type === "deity") this.handlers.onNode?.(node.deity.id);
        else this.handlers.onReveal?.(node.clue);
      });

    entered.append("circle").attr("class", "node-halo");
    entered.append("circle").attr("class", "node-disc");
    entered
      .append("text")
      .attr("class", "node-glyph")
      .attr("text-anchor", "middle")
      .attr("dy", ".36em");
    entered
      .append("text")
      .attr("class", "node-name")
      .attr("text-anchor", "middle");
    entered
      .append("text")
      .attr("class", "node-meta")
      .attr("text-anchor", "middle");

    const nodesMerged = entered
      .merge(nodeSelection)
      .attr("class", (node) => `graph-node graph-node-${node.type}`)
      .classed(
        "is-selected",
        (node) => node.type === "deity" && node.deity.id === state.selectedNode,
      )
      .attr("aria-label", (node) =>
        node.type === "deity"
          ? `${node.deity.id}, ${node.deity.pantheon}`
          : `Mystery clue: ${node.clue.label}. ${node.clue.hint}`,
      );

    nodesMerged
      .select(".node-halo")
      .attr("r", (node) =>
        node.type === "deity"
          ? node.deity.id === state.selectedNode
            ? 31
            : 27
          : 25,
      )
      .style("stroke", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#b99d68",
      );

    nodesMerged
      .select(".node-disc")
      .attr("r", (node) => (node.type === "deity" ? 20 : 18))
      .style("stroke", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#9d8d78",
      );

    nodesMerged
      .select(".node-glyph")
      .style("fill", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#6b6258",
      )
      .text((node) => (node.type === "deity" ? deityGlyph(node.deity) : "?"));

    nodesMerged
      .select(".node-name")
      .attr("y", (node) => (node.type === "deity" ? 41 : 39))
      .text((node) =>
        node.type === "deity" ? node.deity.id : node.clue.label,
      );

    nodesMerged
      .select(".node-meta")
      .attr("y", (node) => (node.type === "deity" ? 55 : 53))
      .text((node) =>
        node.type === "deity" ? node.deity.pantheon : node.clue.hint,
      );

    entered.transition().duration(240).style("opacity", 1);

    this.simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((node) => node.id)
          .distance((link) => (link.type === "clue" ? 145 : 155))
          .strength((link) => (link.type === "clue" ? 0.72 : 0.42)),
      )
      .force(
        "charge",
        d3
          .forceManyBody()
          .strength((node) => (node.type === "clue" ? -500 : -720)),
      )
      .force("center", d3.forceCenter(width * 0.52, height * 0.48))
      .force(
        "collision",
        d3.forceCollide().radius((node) => {
          const label = node.type === "clue" ? node.clue.label : node.deity.id;
          return Math.max(node.type === "clue" ? 78 : 55, Math.min(118, label.length * 3.6 + 24));
        }).iterations(4),
      )
      .alpha(0.85)
      .alphaDecay(0.04)
      .on("tick", () => {
        nodes.forEach((node) => {
          node.x = Math.max(76, Math.min(width - 76, node.x || width / 2));
          node.y = Math.max(78, Math.min(height - 82, node.y || height / 2));
          if (node.type === "deity")
            this.positions.set(node.id, { x: node.x, y: node.y });
        });

        edgesMerged
          .attr("x1", (link) => link.source.x)
          .attr("y1", (link) => link.source.y)
          .attr("x2", (link) => link.target.x)
          .attr("y2", (link) => link.target.y);
        edgeHitsMerged
          .attr("x1", (link) => link.source.x).attr("y1", (link) => link.source.y)
          .attr("x2", (link) => link.target.x).attr("y2", (link) => link.target.y);

        nodesMerged.attr(
          "transform",
          (node) => `translate(${node.x},${node.y})`,
        );
      });

    nodesMerged.call(
      d3
        .drag()
        .on("start", (event, node) => {
          if (!event.active) this.simulation.alphaTarget(0.18).restart();
          node.fx = node.x;
          node.fy = node.y;
        })
        .on("drag", (event, node) => {
          node.fx = event.x;
          node.fy = event.y;
        })
        .on("end", (event, node) => {
          if (!event.active) this.simulation.alphaTarget(0);
          node.fx = null;
          node.fy = null;
        }),
    );

    if (discovered.length && clues.length === 0) {
      this.decor
        .append("text")
        .attr("class", "graph-empty-note")
        .attr("x", width / 2)
        .attr("y", height - 32)
        .attr("text-anchor", "middle")
        .text(
          "No hidden paths remain here. Choose another discovered figure to continue.",
        );
    }
  }

  renderStatic(
    discovered,
    edges,
    state,
    positionFor,
    { dimFuture = false } = {},
  ) {
    this.simulation?.stop();
    const nodes = discovered.map((deity) => ({
      id: deity.id,
      deity,
      ...positionFor(deity),
    }));
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const links = edges
      .map((edge) => ({
        ...edge,
        s: nodeMap.get(edge.source),
        t: nodeMap.get(edge.target),
      }))
      .filter((edge) => edge.s && edge.t);

    const edgeSelection = this.edgeLayer
      .selectAll("line.graph-e…11980 tokens truncated…ldPublish = true } = {}) {
  state = blank();
  recentJourneys = [];
  undoStack = [];
  redoStack = [];
  savedFreeJourney = null;
  if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
  if (typeof localStorage !== "undefined") localStorage.removeItem(LEGACY_STORAGE_KEY);
  if (shouldPublish) publish();
}

export function startWithDeity(id) {
  const deity = getDeity(id);
  if (!deity) return false;
  archiveCurrent();
  undoStack = [];
  redoStack = [];
  state = {
    ...blank(),
    started: true,
    startType: "deity",
    startId: deity.id,
    discoveredNodes: [deity.id],
    selectedNode: deity.id,
  };
  step("start-deity", { id: deity.id });
  publish();
  return true;
}

export function startWithArchetype(id) {
  const archetype = archetypeById(id);
  if (!archetype) return false;
  const seeds = archetype.seeds.filter(getDeity).slice(0, 2);
  const relation =
    seeds.length > 1 ? relationBetween(seeds[0], seeds[1]) : null;
  const edges = relation?.curated || relation?.score >= 0.34 ? [relation] : [];
  archiveCurrent();
  undoStack = [];
  redoStack = [];
  state = {
    ...blank(),
    started: true,
    startType: "archetype",
    startId: archetype.id,
    archetypeStart: archetype.id,
    discoveredNodes: seeds,
    discoveredEdges: edges,
    selectedNode: seeds[0] || null,
  };
  step("start-archetype", { id: archetype.id });
  publish();
  return true;
}

export function beginStory(id) {
  const story = getStory(id);
  if (!story) return false;
  const first = story.path[0];
  if (state.started && !state.activeStory && state.discoveredNodes.length)
    savedFreeJourney = snapshot();
  archiveCurrent();
  undoStack = [];
  redoStack = [];
  state = {
    ...blank(),
    started: true,
    startType: "story",
    startId: story.id,
    discoveredNodes: [first],
    selectedNode: first,
    activeStory: { id: story.id, index: 0 },
  };
  step("start-story", { id: story.id });
  publish();
  return true;
}

export function revealStoryNext() {
  const active = state.activeStory;
  if (!active || active.paused) return null;
  const story = getStory(active.id);
  if (!story) return null;
  const nextIndex = active.index + 1;
  if (nextIndex >= story.path.length) return null;
  const from = story.path[active.index];
  const target = story.path[nextIndex];
  revealDirect(from, target, { select: true, silent: true });
  state.activeStory = { id: story.id, index: nextIndex, paused: false };
  step("story-step", { story: story.id, index: nextIndex, target });
  publish();
  return target;
}

export function availableClues(id = state.selectedNode) {
  if (!id) return [];
  return candidateConnections(
    id,
    state.discoveredNodes,
    4,
    state.evidenceLevel,
  ).filter(
    (clue) =>
      !state.discoveredEdges.some((edge) => edge.id === clue.relation.id),
  );
}

export function revealClue(clue, { selectTarget = true } = {}) {
  if (!clue?.from || !clue?.target) return null;
  checkpoint();
  return revealDirect(clue.from, clue.target, { select: selectTarget });
}

export function revealDirect(
  from,
  target,
  { select = true, silent = false } = {},
) {
  const a = getDeity(from);
  const b = getDeity(target);
  if (!a || !b) return null;
  const relation = relationBetween(a, b);
  if (!relation) return null;

  if (!state.discoveredNodes.includes(a.id)) state.discoveredNodes.push(a.id);
  const newlyDiscovered = !state.discoveredNodes.includes(b.id);
  if (newlyDiscovered) state.discoveredNodes.push(b.id);
  if (!state.discoveredEdges.some((edge) => edge.id === relation.id)) {
    state.discoveredEdges.push(relation);
  }
  if (select) state.selectedNode = b.id;
  state.selectedEdge = relation.id;
  state.lastReveal = {
    from: a.id,
    target: b.id,
    edgeId: relation.id,
    at: Date.now(),
  };
  step("reveal", { from: a.id, target: b.id, kind: relation.kind });
  if (!silent) publish();
  return { deity: b, relation, newlyDiscovered };
}

export function addToJourney(id, from = state.selectedNode) {
  const deity = getDeity(id);
  if (!deity) return false;
  if (!state.started) return startWithDeity(deity.id);

  checkpoint();
  const relation =
    from && from !== deity.id ? relationBetween(from, deity.id) : null;
  if (relation && (relation.curated || relation.score >= 0.34)) {
    revealDirect(from, deity.id, { select: true });
  } else {
    if (!state.discoveredNodes.includes(deity.id))
      state.discoveredNodes.push(deity.id);
    state.selectedNode = deity.id;
    state.selectedEdge = null;
    state.lastReveal = null;
    step("add-node", { id: deity.id });
    publish();
  }
  return true;
}

export function selectNode(id) {
  if (!state.discoveredNodes.includes(id)) return false;
  state.selectedNode = id;
  state.selectedEdge = null;
  state.lastReveal = null;
  publish();
  return true;
}

export function selectEdge(id) {
  const edge = state.discoveredEdges.find((item) => item.id === id);
  if (!edge) return false;
  state.selectedEdge = id;
  state.lastReveal = null;
  publish();
  return true;
}

export function setMode(mode) {
  if (!["network", "time", "geography"].includes(mode)) return;
  state.mode = mode;
  publish();
}

export function setEvidenceLevel(level) {
  if (!EVIDENCE_LEVELS[level] || state.evidenceLevel === level) return false;
  state.evidenceLevel = level;
  state.selectedEdge = null;
  state.lastReveal = null;
  step("set-evidence-level", { level });
  publish();
  return true;
}

export function setEra(era) {
  const value = Number(era);
  if (!Number.isFinite(value)) return;
  state.era = value;
  publish();
}

export function toggleCompare(id) {
  const deity = getDeity(id);
  if (!deity) return;
  if (state.compare.includes(deity.id)) {
    state.compare = state.compare.filter((item) => item !== deity.id);
  } else if (state.compare.length < 3) {
    state.compare = [...state.compare, deity.id];
  } else {
    state.compare = [...state.compare.slice(1), deity.id];
  }
  publish();
}

export function clearCompare() {
  state.compare = [];
  publish();
}

export function leaveStory() {
  state.activeStory = null;
  publish();
}

export function toggleStoryPause() {
  if (!state.activeStory) return false;
  state.activeStory = {
    ...state.activeStory,
    paused: !state.activeStory.paused,
  };
  publish();
  return state.activeStory.paused;
}

export function clearJourney() {
  archiveCurrent();
  checkpoint();
  const mode = state.mode;
  const evidenceLevel = state.evidenceLevel;
  state = { ...blank(), started: true, mode, evidenceLevel };
  step("clear-journey");
  publish();
}

export function undoJourney() {
  const previous = undoStack.pop();
  if (!previous) return false;
  redoStack = [...redoStack, snapshot()].slice(-24);
  state = normalize(previous);
  publish();
  return true;
}

export function redoJourney() {
  const next = redoStack.pop();
  if (!next) return false;
  undoStack = [...undoStack, snapshot()].slice(-24);
  state = normalize(next);
  publish();
  return true;
}

export function restorePreviousJourney() {
  const previous = recentJourneys.pop();
  if (!previous) return false;
  checkpoint();
  state = normalize(previous);
  state.activeStory = null;
  publish();
  return true;
}

export function restoreFreeJourney() {
  if (!savedFreeJourney) return false;
  archiveCurrent();
  checkpoint();
  state = normalize(savedFreeJourney);
  state.activeStory = null;
  savedFreeJourney = null;
  publish();
  return true;
}

export function journeyCapabilities() {
  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    canRestore: recentJourneys.length > 0,
    canRestoreFree: Boolean(savedFreeJourney),
    recentCount: recentJourneys.length,
  };
}

function shareSnapshot() {
  return {
    v: STORAGE_VERSION,
    s: [state.startType, state.startId],
    n: state.discoveredNodes,
    e: state.discoveredEdges.map(({ source, target }) => [source, target]),
    i: state.selectedNode,
    m: state.mode,
    f: state.evidenceLevel,
  };
}

export function encodeJourney() {
  if (!state.started) return "";
  const bytes = new TextEncoder().encode(JSON.stringify(shareSnapshot()));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export function restoreJourney(encoded) {
  if (!encoded || typeof atob === "undefined") return false;
  try {
    const normalized = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const candidate = JSON.parse(new TextDecoder().decode(bytes));
    if (![1, STORAGE_VERSION].includes(candidate.v)) return false;
    state = normalize({
      started: true,
      startType: candidate.s?.[0],
      startId: candidate.s?.[1],
      discoveredNodes: candidate.n,
      discoveredEdges: (candidate.e || []).map(([source, target]) => ({
        source,
        target,
      })),
      selectedNode: candidate.i,
      mode: candidate.m,
      evidenceLevel: candidate.f,
    });
    step("restore-shared-journey");
    publish();
    return state.started;
  } catch {
    return false;
  }
}
