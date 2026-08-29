/* ─────────────────────────────────────────────────────────────────
   utils/similarity.js — Canonical similarity engine
   All graph, matrix, comparison, path, export and worker calculations
   should flow through this module so they cannot drift apart.
   ───────────────────────────────────────────────────────────────── */

import { TRAITS, DEITIES, normTrait, getTraitValue } from '../data/deities.js';
import { getCognate } from '../data/cognates.js';

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

/* ── Get all connections for a deity ───────────────────────────── */
export function getConnections(
  deity,
  metric = 'cosine',
  threshold = 0.20,
  eraMin = Number.NEGATIVE_INFINITY,
  deities = DEITIES,
) {
  return deities
    .filter(d => d.id !== deity.id && d.era >= eraMin)
    .map(d => ({
      deity: d,
      score: computeSimilarity(deity, d, metric),
      shared: sharedTraits(deity, d),
      cognate: getCognate(deity.id, d.id),
    }))
    .filter(x => x.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

/* ── Get top N connections ──────────────────────────────────────── */
export function getTopConnections(deity, n, metric = 'cosine', threshold = 0.2) {
  return getConnections(deity, metric, threshold).slice(0, n);
}

/* ── Most surprising cross-pantheon connection ─────────────────── */
export function getMostSurprisingConnection(deity, metric = 'cosine') {
  const connections = getConnections(deity, metric, 0.1)
    .filter(c => c.deity.pantheon !== deity.pantheon);

  if (!connections.length) return null;

  const scored = connections.map(c => ({
    ...c,
    surpriseScore: c.score * (c.cognate ? 0.8 : 1.0),
  }));

  scored.sort((a, b) => b.surpriseScore - a.surpriseScore);
  return scored[0] || null;
}

/* ── BFS shortest similarity-chain ──────────────────────────────── */
export function findPath(
  fromId,
  toId,
  metric = 'cosine',
  threshold = 0.3,
  deities = DEITIES,
) {
  const from = deities.find(d => d.id === fromId);
  const to   = deities.find(d => d.id === toId);
  if (!from || !to) return null;
  if (fromId === toId) return [fromId];

  const simCache = new Map();
  const getSim = (a, b) => {
    const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
    if (simCache.has(key)) return simCache.get(key);
    const sim = computeSimilarity(a, b, metric);
    simCache.set(key, sim);
    return sim;
  };

  const queue = [[from]];
  const visited = new Set([fromId]);

  while (queue.length) {
    const path = queue.shift();
    if (path.length > 8) continue;

    const current = path[path.length - 1];
    const neighbors = deities.filter(d => {
      if (visited.has(d.id)) return false;
      return getSim(current, d) >= threshold;
    });

    for (const neighbor of neighbors) {
      const newPath = [...path, neighbor];
      if (neighbor.id === toId) return newPath.map(d => d.id);
      visited.add(neighbor.id);
      queue.push(newPath);
      if (queue.length > 8000) return null;
    }
  }

  return null;
}

/* ── Pairwise similarity matrix ────────────────────────────────── */
export function computePantheonMatrix(metric = 'cosine', deities = DEITIES) {
  const pantheons = [...new Set(deities.map(d => d.pantheon))].sort();
  const n = pantheons.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  const counts = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < deities.length; i++) {
    for (let j = i + 1; j < deities.length; j++) {
      const di = deities[i], dj = deities[j];
      if (di.pantheon === dj.pantheon) continue;
      const pi = pantheons.indexOf(di.pantheon);
      const pj = pantheons.indexOf(dj.pantheon);
      const sim = computeSimilarity(di, dj, metric);
      matrix[pi][pj] += sim;
      matrix[pj][pi] += sim;
      counts[pi][pj]++;
      counts[pj][pi]++;
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = counts[i][j] > 0 ? matrix[i][j] / counts[i][j] : 0;
      }
    }
  }

  const topPairs = {};
  for (let pi = 0; pi < n; pi++) {
    for (let pj = pi + 1; pj < n; pj++) {
      const pa = pantheons[pi], pb = pantheons[pj];
      const deitiesA = deities.filter(d => d.pantheon === pa);
      const deitiesB = deities.filter(d => d.pantheon === pb);
      const pairs = [];

      for (const da of deitiesA) {
        for (const db of deitiesB) {
          pairs.push({ a: da, b: db, score: computeSimilarity(da, db, metric) });
        }
      }

      pairs.sort((x, y) => y.score - x.score);
      const best = pairs.slice(0, 5);
      topPairs[`${pa}--${pb}`] = best;
      topPairs[`${pb}--${pa}`] = best;
    }
  }

  return { pantheons, matrix, topPairs };
}

/* ── Get deities by trait ───────────────────────────────────────── */
export function getDeitiesByTrait(traitName, minVal = 0.4) {
  const canonical = TRAITS.find(t => normTrait(t) === normTrait(traitName));
  if (!canonical) return [];

  return DEITIES
    .map(d => ({ deity: d, value: getTraitValue(d, canonical) }))
    .filter(x => x.value >= minVal)
    .sort((a, b) => b.value - a.value);
}

/* ── Utility: get deity by id (case-insensitive) ────────────────── */
export function getDeityById(nameOrId) {
  if (!nameOrId) return null;
  const normalized = String(nameOrId).trim().toLowerCase();
  return DEITIES.find(d => d.id.toLowerCase() === normalized) || null;
}

/* ── Utility: edge color from weight ───────────────────────────── */
export function edgeColor(weight, isCognate = false) {
  if (isCognate) return '#fbbf24';
  if (weight >= 0.75) return '#c084fc';
  if (weight >= 0.55) return '#22d3ee';
  return '#94a3b8';
}

/* ── Utility: trait fill color from value ──────────────────────── */
export function traitFillColor(value) {
  if (value > 0.8) return '#ef4444';
  if (value > 0.6) return '#f97316';
  if (value > 0.4) return '#3b82f6';
  return '#71717a';
}
