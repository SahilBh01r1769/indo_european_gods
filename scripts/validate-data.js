import { DEITIES, TRAITS, PANTHEON_COLORS, normTrait } from '../src/data/deities.js';

const knownTraits = new Set(TRAITS.map(normTrait));
const ids = new Set();
const errors = [];

for (const deity of DEITIES) {
  if (!deity.id || typeof deity.id !== 'string') {
    errors.push('Deity with missing/invalid id');
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

if (errors.length) {
  console.error(`Dataset validation failed with ${errors.length} error(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${DEITIES.length} deities, ${TRAITS.length} canonical traits, and ${Object.keys(PANTHEON_COLORS).length} pantheons.`);
