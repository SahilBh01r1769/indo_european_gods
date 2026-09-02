import test from 'node:test';
import assert from 'node:assert/strict';

import { DEITIES, TRAITS, getTraitValue } from '../src/data/deities.js';
import {
  computeSimilarity,
  sharedTraits,
  traitVector,
} from '../src/utils/similarity.js';

const getDeityById = id =>
  DEITIES.find(deity => deity.id.toLowerCase() === id.toLowerCase());

const indexOfTrait = name => TRAITS.findIndex(t => t.toLowerCase() === name.toLowerCase());

test('Apollo trait vector preserves mixed-case dataset keys', () => {
  const apollo = getDeityById('Apollo');
  const vector = traitVector(apollo);

  assert.equal(vector[indexOfTrait('Archer')], 0.95);
  assert.equal(vector[indexOfTrait('Healer')], 0.9);
  assert.equal(vector[indexOfTrait('Disease sender')], 0.85);
  assert.equal(vector[indexOfTrait('Solar')], 0.85);
  assert.equal(vector[indexOfTrait('Liminal outsider')], 0.7);
});

test('trait lookup is case-insensitive and slash-spacing tolerant', () => {
  const apollo = getDeityById('apollo');
  assert.equal(getTraitValue(apollo, 'ARCHER'), 0.95);
  assert.equal(getTraitValue(apollo, 'disease sender'), 0.85);
  assert.equal(getTraitValue(apollo, 'Ascetic/wisdom'), 0.5);
});

test('similarity is symmetric and self-similarity is one', () => {
  const apollo = getDeityById('Apollo');
  const rudra = getDeityById('Rudra');

  const ab = computeSimilarity(apollo, rudra, 'cosine');
  const ba = computeSimilarity(rudra, apollo, 'cosine');

  assert.ok(Math.abs(ab - ba) < 1e-12);
  assert.ok(Math.abs(computeSimilarity(apollo, apollo, 'cosine') - 1) < 1e-12);
});

test('shared traits use canonical labels despite mixed source casing', () => {
  const apollo = getDeityById('Apollo');
  const rudra = getDeityById('Rudra');
  const shared = sharedTraits(apollo, rudra, 0.4);

  assert.ok(shared.includes('Archer'));
  assert.ok(shared.includes('Healer'));
  assert.ok(shared.includes('Disease sender'));
});
