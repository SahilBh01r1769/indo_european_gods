/* ─────────────────────────────────────────────────────────────────
   utils/similarity.js — Canonical similarity engine
   All graph, matrix, comparison, path, export and worker calculations
   should flow through this module so they cannot drift apart.
   ───────────────────────────────────────────────────────────────── */

import { TRAITS, getTraitValue } from "../data/deities.js";

/* ── Trait vector ───────────────────────────────────────────────── */
const _vectorCache = new Map();

export function traitVector(deity) {
  if (!deity?.id) return TRAITS.map(() => 0);
  if (_vectorCache.has(deity.id)) return _vectorCache.get(deity.id);

  // getTraitValue() performs the canonical case/spacing normalization.
  const vec = TRAITS.map(trait => getTraitValue(deity, trait));
  _vectorCache.set(deity.id, vec);
  return vec;
}

/* ── Cosine similarity ──────────────────────────────────────────── */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;

  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return (magA && magB) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

/* ── Weighted overlap (Jaccard-like) ────────────────────────────── */
export function weightedOverlap(a, b) {
  if (a.length !== b.length) return 0;

  let num = 0, den = 0;
  for (let i = 0; i < a.length; i++) {
    num += Math.min(a[i], b[i]);
    den += Math.max(a[i], b[i]);
  }
  return den > 0 ? num / den : 0;
}

/* ── Compute similarity between two deities ────────────────────── */
export function computeSimilarity(deityA, deityB, metric = 'cosine') {
  const va = traitVector(deityA);
  const vb = traitVector(deityB);
  return metric === 'overlap'
    ? weightedOverlap(va, vb)
    : cosineSimilarity(va, vb);
}

/* ── Shared traits above threshold ─────────────────────────────── */
export function sharedTraits(deityA, deityB, threshold = 0.4) {
  return TRAITS.filter(trait =>
    getTraitValue(deityA, trait) >= threshold &&
    getTraitValue(deityB, trait) >= threshold
  );
}
