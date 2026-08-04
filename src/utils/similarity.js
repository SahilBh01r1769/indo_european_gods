/* ─────────────────────────────────────────────────────────────────
   utils/similarity.js — Similarity engine
   Cosine similarity, weighted overlap, BFS path finder
   ───────────────────────────────────────────────────────────────── */

import { TRAITS, DEITIES } from '../data/deities.js';
import { getCognate } from '../data/cognates.js';

/* ── Trait vector ───────────────────────────────────────────────── */
export function traitVector(deity) {
  return TRAITS.map(t => {
    const key = Object.keys(deity.traits).find(k =>
      k === t || 
      k.replace(/\s*\//g, ' / ') === t ||
      k.replace(/\s*\//g, '/') === t.replace(/\s*\//g, '/')
    );
    return key !== undefined ? deity.traits[key] : 0;
  });
}

/* ── Cosine similarity ──────────────────────────────────────────── */
export function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
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

/* ── Compute similarity between two deities ─────────────────────── */
export function computeSimilarity(deityA, deityB, metric = 'cosine') {
  const va = traitVector(deityA);
  const vb = traitVector(deityB);
  return metric === 'cosine' ? cosineSimilarity(va, vb) : weightedOverlap(va, vb);
}

/* ── Get all connections for a deity ─────────────────────────────── */
export function getConnections(deity, metric = 'cosine', threshold = 0.35, eraMin = 0) {
  return DEITIES
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

/* ── BFS shortest path ──────────────────────────────────────────── */
export function findPath(fromId, toId, metric = 'cosine', threshold = 0.3) {
  const from = DEITIES.find(d => d.id === fromId);
  const to = DEITIES.find(d => d.id === toId);
  if (!from || !to || fromId === toId) return null;

  const queue = [[from]];
  const visited = new Set([fromId]);

  while (queue.length) {
    const path = queue.shift();
    if (path.length > 8) continue; 
    const current = path[path.length - 1];
    
    const neighbors = DEITIES.filter(d => {
      if (visited.has(d.id)) return false;
      return computeSimilarity(current, d, metric) >= threshold;
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

/* ── Pairwise similarity matrix ─────────────────────────────────── */
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

      matrix[pi][pj] += sim; matrix[pj][pi] += sim;
      counts[pi][pj]++; counts[pj][pi]++;
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

/* ── MISSING EXPORTS ADDED HERE ─────────────────────────────────── */

export function getDeityById(nameOrId) {
  if (!nameOrId) return null;
  return DEITIES.find(d => d.id === nameOrId || d.id.toLowerCase() === nameOrId.toLowerCase());
}

export function sharedTraits(deityA, deityB, threshold = 0.3) {
  const shared = [];
  const traitsA = deityA.traits || {};
  const traitsB = deityB.traits || {};
  for (const [trait, valA] of Object.entries(traitsA)) {
    const valB = traitsB[trait] || 0;
    if (valA > threshold && valB > threshold) {
      shared.push(trait);
    }
  }
  return shared;
}

/* ── Utility: edge color from weight ───────────────────────────── */
export function edgeColor(weight, isCognate = false) {
  if (isCognate) return '#f0d080';       // Gold for cognates
  if (weight >= 0.75) return '#a396ff';  // Brighter purple for strong links
  if (weight >= 0.55) return '#e0c060';  // Brighter gold/orange for medium
  return '#8a88a0';                      // Much lighter gray-purple for weak links (was #3a3850)
}

export function traitFillColor(v) {
  if (v > 0.8) return '#e85555';
  if (v > 0.6) return '#f5a623';
  if (v > 0.4) return '#4a9eff';
  return '#6b7280';
}

export function getDeitiesByTrait(trait, threshold = 0.4) {
  return DEITIES
    .map(d => {
      const vec = traitVector(d);
      const idx = TRAITS.indexOf(trait);
      const value = vec[idx] || 0;
      return { deity: d, value };
    })
    .filter(x => x.value >= threshold)
    .sort((a, b) => b.value - a.value);
}

export function getMostSurprisingConnection(deity, metric = 'cosine') {
  let best = null;
  const vecA = traitVector(deity);
  for (const d of DEITIES) {
    if (d.id === deity.id || d.pantheon === deity.pantheon) continue;
    const vecB = traitVector(d);
    const score = metric === 'cosine' ? cosineSimilarity(vecA, vecB) : weightedOverlap(vecA, vecB);
    if (!best || score > best.score) {
      best = { deity: d, score, shared: sharedTraits(deity, d), cognate: getCognate(deity.id, d.id) };
    }
  }
  return best;
}
