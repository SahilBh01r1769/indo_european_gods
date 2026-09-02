import {
  archetypeById,
  candidateConnections,
  getDeity,
  getStory,
  relationBetween,
} from "./model.js";

const STORAGE_KEY = "mythos:journey:v5";
const LEGACY_STORAGE_KEY = "mythos:journey:v4";
const STORAGE_VERSION = 2;
const listeners = new Set();

const blank = () => ({
  started: false,
  startType: null,
  startId: null,
  discoveredNodes: [],
  discoveredEdges: [],
  selectedNode: null,
  selectedEdge: null,
  mode: "network",
  era: 1400,
  compare: [],
  history: [],
  activeStory: null,
  archetypeStart: null,
  lastReveal: null,
});

function cloneState(value) {
  return {
    ...value,
    discoveredNodes: [...value.discoveredNodes],
    discoveredEdges: value.discoveredEdges.map((edge) => ({ ...edge })),
    compare: [...value.compare],
    history: [...value.history],
    activeStory: value.activeStory ? { ...value.activeStory } : null,
    lastReveal: value.lastReveal ? { ...value.lastReveal } : null,
  };
}

function validNodeIds(ids = []) {
  return [...new Set(ids)].filter((id) => getDeity(id));
}

function normalize(candidate) {
  const base = blank();
  if (!candidate || typeof candidate !== "object") return base;

  const discoveredNodes = validNodeIds(candidate.discoveredNodes);
  const discoveredSet = new Set(discoveredNodes);
  const discoveredEdges = (candidate.discoveredEdges || [])
    .filter(
      (edge) =>
        discoveredSet.has(edge.source) && discoveredSet.has(edge.target),
    )
    .map((edge) => relationBetween(edge.source, edge.target))
    .filter(Boolean);
  const selectedNode = discoveredSet.has(candidate.selectedNode)
    ? candidate.selectedNode
    : discoveredNodes[0] || null;

  return {
    ...base,
    started: Boolean(candidate.started),
    startType: candidate.startType || null,
    startId: candidate.startId || null,
    discoveredNodes,
    discoveredEdges,
    selectedNode,
    selectedEdge: discoveredEdges.some(
      (edge) => edge.id === candidate.selectedEdge,
    )
      ? candidate.selectedEdge
      : null,
    mode: ["network", "time", "geography"].includes(candidate.mode)
      ? candidate.mode
      : "network",
    era: Number.isFinite(Number(candidate.era)) ? Number(candidate.era) : 1400,
    compare: validNodeIds(candidate.compare).slice(0, 3),
    history: Array.isArray(candidate.history)
      ? candidate.history.slice(-80)
      : [],
    activeStory: candidate.activeStory || null,
    archetypeStart: candidate.archetypeStart || null,
    lastReveal: candidate.lastReveal || null,
  };
}

function loadStoredState() {
  if (typeof localStorage === "undefined") return { state: blank() };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (legacy?.state) return { state: normalize(legacy.state) };
    }
    return saved?.version === STORAGE_VERSION
      ? {
          state: normalize(saved.state),
          recent: (saved.recent || []).map(normalize).filter((item) => item.started).slice(-5),
          undo: (saved.undo || []).map(normalize).slice(-24),
          redo: (saved.redo || []).map(normalize).slice(-24),
          freeJourney: saved.freeJourney ? normalize(saved.freeJourney) : null,
        }
      : { state: blank() };
  } catch {
    return { state: blank() };
  }
}

const loaded = loadStoredState();
let state = loaded.state;
let recentJourneys = loaded.recent || [];
let undoStack = loaded.undo || [];
let redoStack = loaded.redo || [];
let savedFreeJourney = loaded.freeJourney || null;

function snapshot(value = state) {
  return cloneState(value);
}

function checkpoint() {
  undoStack = [...undoStack, snapshot()].slice(-24);
  redoStack = [];
}

function archiveCurrent() {
  if (!state.started || !state.discoveredNodes.length) return;
  const candidate = snapshot();
  const signature = candidate.discoveredNodes.join("|");
  recentJourneys = [
    ...recentJourneys.filter((item) => item.discoveredNodes.join("|") !== signature),
    candidate,
  ].slice(-5);
}

function persist() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        state: cloneState(state),
        recent: recentJourneys,
        undo: undoStack,
        redo: redoStack,
        freeJourney: savedFreeJourney,
      }),
    );
  } catch {
    // Storage can be disabled. The in-memory journey should still work.
  }
}

function publish() {
  persist();
  for (const listener of listeners) listener(getState());
}

function step(type, payload = {}) {
  state.history = [
    ...state.history,
    { type, at: Date.now(), ...payload },
  ].slice(-80);
}

export function getState() {
  return cloneState(state);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetJourney({ publish: shouldPublish = true } = {}) {
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
  if (!active) return null;
  const story = getStory(active.id);
  if (!story) return null;
  const nextIndex = active.index + 1;
  if (nextIndex >= story.path.length) return null;
  const from = story.path[active.index];
  const target = story.path[nextIndex];
  revealDirect(from, target, { select: true, silent: true });
  state.activeStory = { id: story.id, index: nextIndex };
  step("story-step", { story: story.id, index: nextIndex, target });
  publish();
  return target;
}

export function availableClues(id = state.selectedNode) {
  if (!id) return [];
  return candidateConnections(id, state.discoveredNodes, 4).filter(
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

export function clearJourney() {
  archiveCurrent();
  checkpoint();
  const mode = state.mode;
  state = { ...blank(), started: true, mode };
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
    });
    step("restore-shared-journey");
    publish();
    return state.started;
  } catch {
    return false;
  }
}
