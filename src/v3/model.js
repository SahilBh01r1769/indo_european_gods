import {
  DEITIES,
  TRAITS,
  PANTHEON_COLORS,
  getTraitValue,
} from "../data/deities.js";
import { COGNATE_PAIRS, getCognate } from "../data/cognates.js";
import { computeSimilarity, sharedTraits } from "../utils/similarity.js";
import {
  ARCHETYPES,
  RELATION_KIND_OVERRIDES,
  RELATION_META,
  STORIES,
} from "./config.js";
import { deityProfile } from "./metadata.js";

const byId = new Map(DEITIES.map((d) => [d.id.toLowerCase(), d]));

export function getDeity(id) {
  if (!id) return null;
  return byId.get(String(id).trim().toLowerCase()) || null;
}

export function canonicalPair(a, b) {
  return [a, b].sort((x, y) => x.localeCompare(y)).join("|");
}

function inferKind(cognate) {
  if (!cognate) return "model";
  const note = `${cognate.note || ""}`.toLowerCase();
  if (
    /direct (etymological )?cognate|name cognate|reflex|from pie|linguistic/.test(
      note,
    )
  )
    return "linguistic";
  if (
    /roman interpretatio|hellenistic|identified|derived from|fusion|transmission/.test(
      note,
    )
  )
    return "historical";
  if (cognate.confidence === "proposed") return "speculative";
  if (/archetype|structural|serpent|parallel|both/.test(note))
    return "structural";
  return "comparative";
}

function strengthLabel(score) {
  if (score >= 0.78) return "strong fit";
  if (score >= 0.58) return "clear fit";
  if (score >= 0.38) return "some overlap";
  return "loose echo";
}

const TRAIT_CLUES = {
  "Storm god": "Storm power",
  "War / victory": "Warrior force",
  Archer: "The far-shooter",
  Healer: "Healing power",
  "Disease sender": "Affliction and cure",
  "Liminal outsider": "Crossing boundaries",
  Trickster: "Rule-breaking intelligence",
  "Death / underworld": "The road to the dead",
  Fire: "Sacred flame",
  "Smith / craft": "Divine craft",
  Solar: "The all-seeing sun",
  Wilderness: "Power outside the city",
  "Ecstasy / madness": "Sacred frenzy",
  "Ascetic / wisdom": "Wisdom at a cost",
  "Sea / water": "Waters and the deep",
  Fertility: "Life and renewal",
};

function bestSharedTraits(a, b) {
  return sharedTraits(a, b, 0.38)
    .map((name) => ({
      name,
      weight: Math.min(getTraitValue(a, name), getTraitValue(b, name)),
    }))
    .sort((x, y) => y.weight - x.weight);
}

function serpentClueFor(deity) {
  const byTradition = {
    Vedic: "A dragon holds back the waters",
    Slavic: "The thunderer and the keeper below",
    Egyptian: "The serpent beneath the solar voyage",
    Norse: "The world-serpent at the last battle",
    Mesopotamian: "Kingship won from a chaos-dragon",
    Greek: "The sky god and the earth-born monster",
  };
  return byTradition[deity?.pantheon] || "A divine battle with the serpent";
}

function clueLabel(kind, shared, cognate, target) {
  if (kind === "linguistic") return "A divine name crosses languages";
  if (kind === "historical") return "A documented meeting of traditions";
  if (kind === "speculative")
    return shared[0]
      ? TRAIT_CLUES[shared[0].name] || shared[0].name
      : "A strange echo";
  if (cognate?.note?.toLowerCase().includes("serpent"))
    return serpentClueFor(target);
  const top = shared[0]?.name;
  return TRAIT_CLUES[top] || top || "A thematic echo";
}

export function relationBetween(aId, bId) {
  const a = typeof aId === "string" ? getDeity(aId) : aId;
  const b = typeof bId === "string" ? getDeity(bId) : bId;
  if (!a || !b) return null;

  const cognate = getCognate(a.id, b.id);
  const pairKey = canonicalPair(a.id, b.id);
  const kind = RELATION_KIND_OVERRIDES.get(pairKey) || inferKind(cognate);
  const score = computeSimilarity(a, b, "overlap");
  const shared = bestSharedTraits(a, b);
  const meta = RELATION_META[kind] || RELATION_META.model;

  return {
    id: pairKey,
    source: a.id,
    target: b.id,
    kind,
    label: meta.label,
    short: meta.short,
    description: meta.description,
    score,
    fit: strengthLabel(score),
    shared: shared.map((x) => x.name),
    clue: clueLabel(kind, shared, cognate, b),
    note: cognate?.note || null,
    sourceText: cognate?.source || null,
    confidence: cognate?.confidence || "model-only",
    curated: Boolean(cognate),
  };
}

const curatedAdjacency = new Map();
for (const pair of COGNATE_PAIRS) {
  if (!curatedAdjacency.has(pair.a)) curatedAdjacency.set(pair.a, []);
  if (!curatedAdjacency.has(pair.b)) curatedAdjacency.set(pair.b, []);
  curatedAdjacency.get(pair.a).push(pair.b);
  curatedAdjacency.get(pair.b).push(pair.a);
}

function relationPriority(r) {
  const order = {
    linguistic: 0,
    historical: 1,
    structural: 2,
    comparative: 3,
    speculative: 4,
    model: 5,
  };
  return (order[r.kind] ?? 6) * 100 - r.score * 10;
}

export function candidateConnections(id, discoveredIds = [], max = 4) {
  const deity = getDeity(id);
  if (!deity) return [];
  const discovered = new Set(discoveredIds);
  const candidates = new Map();

  for (const otherId of curatedAdjacency.get(deity.id) || []) {
    if (discovered.has(otherId)) continue;
    const relation = relationBetween(deity.id, otherId);
    if (relation) candidates.set(otherId, relation);
  }

  const modelCandidates = DEITIES.filter(
    (d) =>
      d.id !== deity.id &&
      !discovered.has(d.id) &&
      d.pantheon !== deity.pantheon,
  )
    .map((d) => relationBetween(deity, d))
    .filter(Boolean)
    .filter((r) => r.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  for (const relation of modelCandidates) {
    if (!candidates.has(relation.target))
      candidates.set(relation.target, relation);
  }

  return [...candidates.values()]
    .sort((a, b) => relationPriority(a) - relationPriority(b))
    .slice(0, max)
    .map((relation, index) => ({
      id: `clue:${deity.id}:${relation.target}`,
      from: deity.id,
      target: relation.target,
      label: relation.clue,
      hint: `${relation.short} · ${getDeity(relation.target)?.pantheon || "Another"} tradition`,
      relation,
      index,
    }));
}

export function allConnectionsFor(id) {
  const deity = getDeity(id);
  if (!deity) return [];
  return DEITIES.filter((d) => d.id !== deity.id)
    .map((d) => relationBetween(deity, d))
    .filter(Boolean)
    .sort((a, b) => relationPriority(a) - relationPriority(b));
}

export function archetypeById(id) {
  return ARCHETYPES.find((a) => a.id === id) || null;
}

export function archetypeMembers(archetypeOrId, limit = 10) {
  const archetype =
    typeof archetypeOrId === "string"
      ? archetypeById(archetypeOrId)
      : archetypeOrId;
  if (!archetype) return [];
  return DEITIES.map((deity) => {
    const parts = archetype.traits.map((trait) => getTraitValue(deity, trait));
    const average =
      parts.reduce((sum, x) => sum + x, 0) / Math.max(1, parts.length);
    const coverage =
      parts.filter((x) => x >= 0.45).length / Math.max(1, parts.length);
    const seeded =
      archetype.seeds.includes(deity.id) ||
      archetype.suggested.includes(deity.id);
    const score = average * 0.72 + coverage * 0.18 + (seeded ? 0.1 : 0);
    return {
      deity,
      score,
      breakdown: archetype.traits.map((trait, i) => ({
        trait,
        value: parts[i],
      })),
    };
  })
    .filter((x) => x.score >= 0.32)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function emergentArchetypes(discoveredIds) {
  const discovered = new Set(discoveredIds);
  return ARCHETYPES.map((archetype) => ({
    archetype,
    members: archetypeMembers(archetype, 20).filter((x) =>
      discovered.has(x.deity.id),
    ),
  }))
    .filter((x) => x.members.length >= 3)
    .sort((a, b) => b.members.length - a.members.length);
}

export function getStory(id) {
  return STORIES.find((story) => story.id === id) || null;
}

export function deityAccent(deity) {
  return PANTHEON_COLORS[deity?.pantheon] || "#6f6a63";
}

export function deityGlyph(deity) {
  if (!deity) return "·";
  return deityProfile(deity)?.mark || `${deity.originalScript || deity.id}`.trim();
}

export function eraLabel(era) {
  if (!Number.isFinite(era)) return "date uncertain";
  if (era < 0) return `c. ${Math.abs(era)} BCE`;
  if (era === 0) return "c. 1 CE";
  return `c. ${era} CE`;
}

export function searchMythos(query, limit = 12) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return [];
  const deityHits = DEITIES.map((deity) => {
    const hay = [
      deity.id,
      deity.pantheon,
      deity.epithet,
      deity.desc,
      deity.originalScript,
      ...(deityProfile(deity)?.aliases || []),
      ...(deity.domains || []),
      ...(deity.symbols || []),
      ...Object.keys(deity.traits || {}),
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    if (deity.id.toLowerCase() === q) score += 100;
    if (deity.id.toLowerCase().startsWith(q)) score += 40;
    if (hay.includes(q)) score += 20;
    return { type: "deity", deity, score };
  }).filter((x) => x.score > 0);

  const archetypeHits = ARCHETYPES.map((archetype) => {
    const hay = [
      archetype.name,
      archetype.short,
      archetype.description,
      ...archetype.traits,
    ]
      .join(" ")
      .toLowerCase();
    return { type: "archetype", archetype, score: hay.includes(q) ? 18 : 0 };
  }).filter((x) => x.score > 0);

  const storyHits = STORIES.map((story) => {
    const hay = [story.title, story.deck, ...story.path]
      .join(" ")
      .toLowerCase();
    return { type: "story", story, score: hay.includes(q) ? 12 : 0 };
  }).filter((x) => x.score > 0);

  return [...deityHits, ...archetypeHits, ...storyHits]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function compareDeities(ids) {
  const deities = ids.map(getDeity).filter(Boolean).slice(0, 3);
  const pairs = [];
  for (let i = 0; i < deities.length; i++) {
    for (let j = i + 1; j < deities.length; j++)
      pairs.push(relationBetween(deities[i], deities[j]));
  }
  const traitRows = TRAITS.map((trait) => ({
    trait,
    values: deities.map((d) => getTraitValue(d, trait)),
  })).filter((row) => row.values.some((v) => v >= 0.35));
  return { deities, pairs, traitRows };
}

export { DEITIES, TRAITS, PANTHEON_COLORS, ARCHETYPES, STORIES, RELATION_META };
