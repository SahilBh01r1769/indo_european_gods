import test from "node:test";
import assert from "node:assert/strict";
import {
  candidateConnections,
  relationBetween,
  archetypeMembers,
  compareDeities,
} from "../src/v3/model.js";
import {
  startWithDeity,
  revealClue,
  getState,
  resetJourney,
  beginStory,
  revealStoryNext,
  encodeJourney,
  restoreJourney,
} from "../src/v3/state.js";

test("Thor exposes curated mystery paths before model-only echoes", () => {
  const clues = candidateConnections("Thor", ["Thor"], 4);
  assert.ok(clues.length >= 2);
  assert.ok(clues.some((c) => c.target === "Indra"));
  assert.ok(clues.every((c) => c.from === "Thor"));
});

test("relationship categories distinguish evidence types", () => {
  assert.equal(relationBetween("Zeus", "Dyaus").kind, "linguistic");
  assert.equal(relationBetween("Thor", "Indra").kind, "structural");
  assert.equal(relationBetween("Set", "Loki").kind, "speculative");
});

test("revealing a clue grows the persistent journey rather than replacing it", () => {
  resetJourney({ publish: false });
  startWithDeity("Thor");
  const clue = candidateConnections("Thor", ["Thor"], 4).find(
    (c) => c.target === "Indra",
  );
  const result = revealClue(clue);
  assert.equal(result.deity.id, "Indra");
  const state = getState();
  assert.deepEqual(state.discoveredNodes.slice(0, 2), ["Thor", "Indra"]);
  assert.equal(state.selectedNode, "Indra");
  assert.ok(
    state.discoveredEdges.some(
      (e) => e.id.includes("Indra") && e.id.includes("Thor"),
    ),
  );
});

test("a shared journey round-trips without sharing transient history", () => {
  resetJourney({ publish: false });
  startWithDeity("Thor");
  const clue = candidateConnections("Thor", ["Thor"], 4).find(
    (c) => c.target === "Perun",
  );
  revealClue(clue);
  const encoded = encodeJourney();

  resetJourney({ publish: false });
  assert.equal(restoreJourney(encoded), true);
  const restored = getState();
  assert.deepEqual(restored.discoveredNodes, ["Thor", "Perun"]);
  assert.equal(restored.selectedNode, "Perun");
  assert.equal(restored.history.at(-1).type, "restore-shared-journey");
});

test("archetype rankings return meaningful members", () => {
  const thunderers = archetypeMembers("thunderer", 8).map((x) => x.deity.id);
  assert.ok(thunderers.includes("Thor"));
  assert.ok(thunderers.includes("Indra"));
});

test("guided stories reveal into the same journey state", () => {
  resetJourney({ publish: false });
  beginStory("daylight-sky");
  const next = revealStoryNext();
  assert.equal(next, "Dyaus");
  const state = getState();
  assert.ok(state.discoveredNodes.includes("Zeus"));
  assert.ok(state.discoveredNodes.includes("Dyaus"));
  assert.equal(state.activeStory.index, 1);
});

test("comparison keeps qualitative evidence plus model overlap data", () => {
  const result = compareDeities(["Thor", "Indra", "Perun"]);
  assert.equal(result.deities.length, 3);
  assert.equal(result.pairs.length, 3);
  assert.ok(
    result.pairs.every(
      (p) => typeof p.fit === "string" && typeof p.score === "number",
    ),
  );
});
