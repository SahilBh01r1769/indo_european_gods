/**
 * Web Worker for heavy similarity computations
 * CS Fundamental: Concurrency / Offloading main thread
 * Prevents UI stutter when computing large matrices
 */

// Import similarity functions (they need to be self-contained for worker)
// Since we're in a worker, we inline the math functions

/**
 * Cosine similarity between two vectors
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Weighted overlap similarity (Jaccard-like)
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns {number}
 */
function weightedOverlap(a, b) {
  if (a.length !== b.length) return 0;
  
  let minSum = 0;
  let maxSum = 0;
  
  for (let i = 0; i < a.length; i++) {
    minSum += Math.min(a[i], b[i]);
    maxSum += Math.max(a[i], b[i]);
  }
  
  return maxSum === 0 ? 0 : minSum / maxSum;
}

/**
 * Compute similarity between two deities
 */
function computeSimilarity(deityA, deityB, method = 'cosine') {
  const traitsA = Object.values(deityA.traits || {});
  const traitsB = Object.values(deityB.traits || {});
  
  if (method === 'cosine') {
    return cosineSimilarity(traitsA, traitsB);
  } else if (method === 'overlap') {
    return weightedOverlap(traitsA, traitsB);
  }
  return 0;
}

/**
 * Find shared traits between two deities
 */
function getSharedTraits(deityA, deityB, threshold = 0.3) {
  const shared = [];
  const traitsA = deityA.traits || {};
  const traitsB = deityB.traits || {};
  
  for (const [trait, valA] of Object.entries(traitsA)) {
    const valB = traitsB[trait] || 0;
    if (valA > threshold && valB > threshold) {
      shared.push({ trait, score: Math.min(valA, valB) });
    }
  }
  
  return shared.sort((a, b) => b.score - a.score);
}

/**
 * Compute full pantheon similarity matrix
 */
function computePantheonMatrix(deities, method = 'cosine') {
  const pantheons = [...new Set(deities.map(d => d.pantheon))];
  const matrix = [];
  const topPairs = {};
  
  for (let i = 0; i < pantheons.length; i++) {
    matrix[i] = [];
    topPairs[`${pantheons[i]}-${pantheons[i]}`] = [];
    
    for (let j = 0; j < pantheons.length; j++) {
      const groupA = deities.filter(d => d.pantheon === pantheons[i]);
      const groupB = deities.filter(d => d.pantheon === pantheons[j]);
      
      let totalSim = 0;
      let count = 0;
      const pairs = [];
      
      for (const a of groupA) {
        for (const b of groupB) {
          if (a.id === b.id) continue;
          const sim = computeSimilarity(a, b, method);
          totalSim += sim;
          count++;
          pairs.push({ a: a.id, b: b.id, score: sim });
        }
      }
      
      matrix[i][j] = count > 0 ? totalSim / count : 0;
      
      // Store top pairs for this cell
      pairs.sort((x, y) => y.score - x.score);
      topPairs[`${pantheons[i]}-${pantheons[j]}`] = pairs.slice(0, 5);
    }
  }
  
  return { pantheons, matrix, topPairs };
}

/**
 * BFS pathfinding between two deities
 */
function findPath(startId, endId, deities, method = 'cosine', threshold = 0.3) {
  if (startId === endId) return [startId];
  
  // Build adjacency list
  const adjacency = new Map();
  deities.forEach(d => adjacency.set(d.id, []));
  
  for (let i = 0; i < deities.length; i++) {
    for (let j = i + 1; j < deities.length; j++) {
      const sim = computeSimilarity(deities[i], deities[j], method);
      if (sim >= threshold) {
        adjacency.get(deities[i].id).push(deities[j].id);
        adjacency.get(deities[j].id).push(deities[i].id);
      }
    }
  }
  
  // BFS
  const queue = [[startId]];
  const visited = new Set([startId]);
  
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    
    for (const neighbor of (adjacency.get(current) || [])) {
      if (visited.has(neighbor)) continue;
      
      const newPath = [...path, neighbor];
      
      if (neighbor === endId) return newPath;
      
      visited.add(neighbor);
      queue.push(newPath);
    }
  }
  
  return null; // No path found
}

// ============================================
// WORKER MESSAGE HANDLER
// ============================================

self.onmessage = function(event) {
  const { type, payload, requestId } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'COMPUTE_SIMILARITY':
        result = computeSimilarity(payload.deityA, payload.deityB, payload.method);
        break;
        
      case 'GET_CONNECTIONS':
        const connections = payload.deities
          .filter(d => d.id !== payload.deity.id)
          .map(d => ({
            deity: d,
            score: computeSimilarity(payload.deity, d, payload.method),
            shared: getSharedTraits(payload.deity, d)
          }))
          .filter(c => c.score >= (payload.threshold || 0.35))
          .sort((a, b) => b.score - a.score);
        result = connections;
        break;
        
      case 'COMPUTE_MATRIX':
        result = computePantheonMatrix(payload.deities, payload.method);
        break;
        
      case 'FIND_PATH':
        result = findPath(payload.startId, payload.endId, payload.deities, payload.method, payload.threshold);
        break;
        
      default:
        throw new Error(`Unknown worker message type: ${type}`);
    }
    
    // Send success response
    self.postMessage({ type: 'SUCCESS', requestId, result });
    
  } catch (error) {
    // Send error response
    self.postMessage({ type: 'ERROR', requestId, error: error.message });
  }
};
