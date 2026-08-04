/**
 * Web Worker Client
 * Wraps the similarity worker with a Promise-based API
 */

class SimilarityWorkerClient {
  constructor() {
    this.worker = new Worker('./src/workers/similarityWorker.js',import.meta.url, { type: 'module' });
    this.requestId = 0;
    this.pendingRequests = new Map();
    
    this.worker.onmessage = (event) => {
      const { type, requestId, result, error } = event.data;
      const pending = this.pendingRequests.get(requestId);
      
      if (!pending) return;
      
      if (type === 'SUCCESS') {
        pending.resolve(result);
      } else if (type === 'ERROR') {
        pending.reject(new Error(error));
      }
      
      this.pendingRequests.delete(requestId);
    };
    
    this.worker.onerror = (error) => {
      console.error('[WorkerClient] Unhandled worker error:', error);
      // Reject all pending requests
      this.pendingRequests.forEach(pending => pending.reject(error));
      this.pendingRequests.clear();
    };
  }

  /**
   * @private
   */
  _send(type, payload) {
    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      this.pendingRequests.set(requestId, { resolve, reject });
      this.worker.postMessage({ type, payload, requestId });
    });
  }

  /**
   * Compute similarity between two deities
   */
  async computeSimilarity(deityA, deityB, method = 'cosine') {
    return this._send('COMPUTE_SIMILARITY', { deityA, deityB, method });
  }

  /**
   * Get all connections for a deity above threshold
   */
  async getConnections(deity, deities, method = 'cosine', threshold = 0.35) {
    return this._send('GET_CONNECTIONS', { deity, deities, method, threshold });
  }

  /**
   * Compute the full pantheon similarity matrix
   */
  async computeMatrix(deities, method = 'cosine') {
    return this._send('COMPUTE_MATRIX', { deities, method });
  }

  /**
   * Find shortest path between two deities
   */
  async findPath(startId, endId, deities, method = 'cosine', threshold = 0.3) {
    return this._send('FIND_PATH', { startId, endId, deities, method, threshold });
  }

  /**
   * Terminate worker
   */
  destroy() {
    this.worker.terminate();
    this.pendingRequests.clear();
  }
}

// Singleton
export const workerClient = new SimilarityWorkerClient();
export default workerClient;
