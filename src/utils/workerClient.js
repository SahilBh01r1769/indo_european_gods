class SimilarityWorkerClient {
  constructor() {
    // Fixed path resolution
    // Robust path resolution for Web Workers in ES Modules
    const workerUrl = new URL('../workers/similarityWorker.js', import.meta.url).href;
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.requestId = 0;
    this.pendingRequests = new Map();

    this.worker.onmessage = (event) => {
      const { type, requestId, result, error } = event.data;
      const pending = this.pendingRequests.get(requestId);
      if (!pending) return;
      if (type === 'SUCCESS') pending.resolve(result);
      else if (type === 'ERROR') pending.reject(new Error(error));
      this.pendingRequests.delete(requestId);
    };

    this.worker.onerror = (error) => {
      console.error('[WorkerClient] Unhandled worker error:', error);
      this.pendingRequests.forEach(pending => pending.reject(error));
      this.pendingRequests.clear();
    };
  }

  _send(type, payload) {
    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      this.pendingRequests.set(requestId, { resolve, reject });
      this.worker.postMessage({ type, payload, requestId });
    });
  }

  async computeSimilarity(deityA, deityB, method = 'cosine') {
    return this._send('COMPUTE_SIMILARITY', { deityA, deityB, method });
  }
  async getConnections(deity, deities, method = 'cosine', threshold = 0.35) {
    return this._send('GET_CONNECTIONS', { deity, deities, method, threshold });
  }
  async computeMatrix(deities, method = 'cosine') {
    return this._send('COMPUTE_MATRIX', { deities, method });
  }
  async findPath(startId, endId, deities, method = 'cosine', threshold = 0.3) {
    return this._send('FIND_PATH', { startId, endId, deities, method, threshold });
  }
  destroy() {
    this.worker.terminate();
    this.pendingRequests.clear();
  }
}

export const workerClient = new SimilarityWorkerClient();
export default workerClient;
