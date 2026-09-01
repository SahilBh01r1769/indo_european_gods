import {
  DEITIES,
  TRAITS,
  PANTHEON_COLORS,
  normTrait,
} from "../src/data/deities.js";
import { COGNATE_PAIRS } from "../src/data/cognates.js";
import {
  BIBLIOGRAPHY,
  DEITY_CITATIONS,
  TRADITION_CITATIONS,
  getDeityRefs,
} from "../src/data/citations.js";
import { RELATION_KIND_OVERRIDES } from "../src/v3/config.js";

const knownTraits = new Set(TRAITS.map(normTrait));
const ids = new Set();
const errors = [];

for (const deity of DEITIES) {
  if (!deity.id || typeof deity.id !== "string") {
    errors.push("Deity with missing/invalid id");
    continue;
  }

  if (ids.has(deity.id)) errors.push(`Duplicate deity id: ${deity.id}`);
  ids.add(deity.id);

  if (!PANTHEON_COLORS[deity.pantheon]) {
    errors.push(`${deity.id}: missing color for pantheon "${deity.pantheon}"`);
  }

  if (!Number.isFinite(deity.era)) {
    errors.push(`${deity.id}: era must be numeric`);
  }

  for (const [trait, value] of Object.entries(deity.traits || {})) {
    if (!knownTraits.has(normTrait(trait))) {
      errors.push(`${deity.id}: unknown trait "${trait}"`);
    }
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      errors.push(`${deity.id}: trait "${trait}" must be in [0, 1]`);
    }
  }
}

for (const pair of COGNATE_PAIRS) {
  if (!ids.has(pair.a) || !ids.has(pair.b)) {
    errors.push(
      `Relationship references an unknown deity: ${pair.a} / ${pair.b}`,
    );
  }
  if (!pair.note?.trim() || !pair.source?.trim()) {
    errors.push(
      `Relationship is missing interpretation or source: ${pair.a} / ${pair.b}`,
    );
  }
  const key = [pair.a, pair.b].sort().join("|");
  if (!RELATION_KIND_OVERRIDES.has(key)) {
    errors.push(
      `Relationship is missing an explicit evidence type: ${pair.a} / ${pair.b}`,
    );
  }
}

const bibliographyIds = new Set(BIBLIOGRAPHY.map((entry) => entry.id));
for (const [deityId, citations] of Object.entries(DEITY_CITATIONS)) {
  if (!ids.has(deityId))
    errors.push(`Citations reference an unknown deity: ${deityId}`);
  for (const citation of citations) {
    if (!bibliographyIds.has(citation.ref)) {
      errors.push(
        `${deityId}: unknown bibliography reference "${citation.ref}"`,
      );
    }
  }
}

for (const [tradition, citations] of Object.entries(TRADITION_CITATIONS)) {
  if (!PANTHEON_COLORS[tradition]) {
    errors.push(
      `Tradition citations reference an unknown tradition: ${tradition}`,
    );
  }
  for (const citation of citations) {
    if (!bibliographyIds.has(citation.ref)) {
      errors.push(
        `${tradition}: unknown tradition bibliography reference "${citation.ref}"`,
      );
    }
  }
}

for (const deity of DEITIES) {
  if (!getDeityRefs(deity.id).length) {
    errors.push(`${deity.id}: no figure-specific or tradition-level source`);
  }
}

if (errors.length) {
  console.error(`Dataset validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Validated ${DEITIES.length} deities, ${TRAITS.length} canonical traits, ` +
    `${COGNATE_PAIRS.length} curated relationships, ${BIBLIOGRAPHY.length} sources, ` +
    `and ${Object.keys(PANTHEON_COLORS).length} traditions.`,
);
