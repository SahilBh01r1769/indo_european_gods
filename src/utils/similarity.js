/* ─────────────────────────────────────────────────────────────────
   utils/similarity.js — Similarity engine
   Cosine similarity, weighted overlap, BFS path finder
   ───────────────────────────────────────────────────────────────── */

import { TRAITS, DEITIES } from '../data/deities.js';
import { getCognate } from '../data/cognates.js';

/* ── Trait vector ───────────────────────────────────────────────── */
export function traitVector(deity) {
  const traits = deity.traits || {};
  return TRAITS.map(t => {
    const tNorm = t.toLowerCase().replace(/\s*\/\s*/g, ' / ').trim();
    const key = Object.keys(traits).find(k => {
      const kNorm = k.toLowerCase().replace(/\s*\/\s*/g, ' / ').trim();
      return kNorm === tNorm;
    });
    return key !== undefined ? traits[key] : 0;
  });
}

/* ── Cosine similarity ──────────────────────────────────────────── */
export function cosineSimilarity(a, b) {
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
  return metric === 'cosine'
    ? cosineSimilarity(va, vb)
    : weightedOverlap(va, vb);
}

/* ── Shared traits above threshold ─────────────────────────────── */
export function sharedTraits(deityA, deityB, threshold = 0.4) {
  const shared = [];
  const traitsA = deityA.traits || {};
  const traitsB = deityB.traits || {};
  for (const [trait, valA] of Object.entries(traitsA)) {
    const valB = traitsB[trait] || 0;
    if (valA >= threshold && valB >= threshold) {
      shared.push(trait);
    }
  }
  return shared;
}

/* ── Get all connections for a deity ───────────────────────────── */
export function getConnections(deity, metric = 'cosine', threshold = 0.20, eraMin = 0) {
  return DEITIES
    .filter(d => d.id !== deity.id && d.era >= eraMin)
    .map(d => ({
    deity: d,
    score: computeSimilarity(deity, d, metric),   // was weight
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

/* ── BFS shortest path ──────────────────────────────────────────── */
export function findPath(fromId, toId, metric = 'cosine', threshold = 0.3) {
  const from = DEITIES.find(d => d.id === fromId);
  const to   = DEITIES.find(d => d.id === toId);
  if (!from || !to || fromId === toId) return null;

  const simCache = new Map();
     const getSim = (a, b) => {
       const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
       if (simCache.has(key)) return simCache.get(key);
       const sim = computeSimilarity(a, b, metric);
       simCache.set(key, sim);
       return sim;
     };
  
  const queue   = [[from]];
  const visited = new Set([fromId]);

  while (queue.length) {
    const path = queue.shift();
    if (path.length > 8) continue;

    const current = path[path.length - 1];
    const neighbors = DEITIES.filter(d => {
      if (visited.has(d.id)) return false;
      return getSim(current, d, metric) >= threshold;
    });

    for (const neighbor of neighbors) {
      const newPath = [...path, neighbor];
      if (neighbor.id === toId) return newPath;
      visited.add(neighbor.id);
      queue.push(newPath);
      if (queue.length > 8000) return null;
    }
  }
  return null;
}

/* ── Pairwise similarity matrix ────────────────────────────────── */
export function computePantheonMatrix(metric = 'cosine') {
  const pantheons = [...new Set(DEITIES.map(d => d.pantheon))].sort();
  const n = pantheons.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  const counts = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < DEITIES.length; i++) {
    for (let j = i + 1; j < DEITIES.length; j++) {
      const di = DEITIES[i], dj = DEITIES[j];
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
      if (i === j) { matrix[i][j] = 1; continue; }
      matrix[i][j] = counts[i][j] > 0 ? matrix[i][j] / counts[i][j] : 0;
    }
  }

  const topPairs = {};
  for (let pi = 0; pi < n; pi++) {
    for (let pj = pi + 1; pj < n; pj++) {
      const pa = pantheons[pi], pb = pantheons[pj];
      const deitiesA = DEITIES.filter(d => d.pantheon === pa);
      const deitiesB = DEITIES.filter(d => d.pantheon === pb);
      const pairs = [];
      for (const da of deitiesA) {
        for (const db of deitiesB) {
          pairs.push({ a: da, b: db, score: computeSimilarity(da, db, metric) });
        }
      }
      pairs.sort((x, y) => y.score - x.score);
      const key = `${pa}--${pb}`;
      topPairs[key] = pairs.slice(0, 5);
      topPairs[`${pb}--${pa}`] = pairs.slice(0, 5);
    }
  }

  return { pantheons, matrix, topPairs };
}

/* ── Get deities by trait ───────────────────────────────────────── */
export function getDeitiesByTrait(traitName, minVal = 0.4) {
  return DEITIES
    .map(d => {
      const vec = traitVector(d);
      const idx = TRAITS.indexOf(traitName);
      const val = idx >= 0 ? vec[idx] : 0;
      return { deity: d, value: val };
    })
    .filter(x => x.value >= minVal)
    .sort((a, b) => b.value - a.value);
}

/* ── Utility: get deity by id (case-insensitive) ────────────────── */
export function getDeityById(nameOrId) {
  if (!nameOrId) return null;
  return DEITIES.find(d =>
    d.id === nameOrId || d.id.toLowerCase() === nameOrId.toLowerCase()
  ) || null;
}

/* ── Utility: edge color from weight ───────────────────────────── */
export function edgeColor(weight, isCognate = false) {
  if (isCognate) return '#fbbf24';       // gold
  if (weight >= 0.75) return '#c084fc';  // bright purple
  if (weight >= 0.55) return '#22d3ee';  // cyan
  return '#94a3b8';                      // bright slate gray
}

/* ── Utility: trait fill color from value ──────────────────────── */
export function traitFillColor(value) {
  if (value > 0.8) return '#ef4444'; // Vibrant Red
  if (value > 0.6) return '#f97316'; // Vibrant Orange
  if (value > 0.4) return '#3b82f6'; // Vibrant Blue
  return '#71717a';                  // Muted Gray
}
