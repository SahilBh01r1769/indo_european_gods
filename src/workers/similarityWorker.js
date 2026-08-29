import {
  computeSimilarity,
  computePantheonMatrix,
  findPath,
  getConnections,
} from '../utils/similarity.js';

self.onmessage = function(event) {
  const { type, payload, requestId } = event.data;

  try {
    let result;

    switch (type) {
      case 'COMPUTE_SIMILARITY':
        result = computeSimilarity(payload.deityA, payload.deityB, payload.method);
        break;

      case 'GET_CONNECTIONS':
        result = getConnections(
          payload.deity,
          payload.method,
          payload.threshold ?? 0.35,
          Number.NEGATIVE_INFINITY,
          payload.deities,
        );
        break;

      case 'COMPUTE_MATRIX':
        result = computePantheonMatrix(payload.method, payload.deities);
        break;

      case 'FIND_PATH':
        result = findPath(
          payload.startId,
          payload.endId,
          payload.method,
          payload.threshold ?? 0.3,
          payload.deities,
        );
        break;

      default:
        throw new Error(`Unknown worker message type: ${type}`);
    }

    self.postMessage({ type: 'SUCCESS', requestId, result });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
