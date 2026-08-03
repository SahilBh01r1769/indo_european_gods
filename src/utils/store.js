/**
 * Lightweight Pub/Sub State Manager
 * CS Fundamental: Observer Pattern / Event-Driven Architecture
 * Decouples UI components from state mutations
 */

class Store {
  constructor(initialState = {}) {
    /** @type {Object} */
    this._state = { ...initialState };
    
    /** @type {Map<string, Set<Function>>} */
    this._subscribers = new Map();
    
    /** @type {Array<{state: Object, timestamp: number}>} */
    this._history = [];
    this._maxHistory = 50;
    
    /** @type {boolean} */
    this._debug = false;
  }

  /**
   * Get current state (immutable copy)
   * @param {string} key 
   * @returns {*}
   */
  get(key) {
    if (key === undefined) return { ...this._state };
    return this._state[key];
  }

  /**
   * Update state and notify subscribers
   * @param {string|Object} keyOrObj 
   * @param {*} value 
   */
  set(keyOrObj, value) {
    const prevState = { ...this._state };

    if (typeof keyOrObj === 'object') {
      // Batch update
      Object.assign(this._state, keyOrObj);
      Object.keys(keyOrObj).forEach(key => this._notify(key));
    } else {
      this._state[keyOrObj] = value;
      this._notify(keyOrObj);
    }

    // Save to history
    this._history.push({ state: prevState, timestamp: Date.now() });
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    if (this._debug) {
      console.log(`[Store] ${typeof keyOrObj === 'object' ? Object.keys(keyOrObj).join(', ') : keyOrObj} updated`, this._state);
    }
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch (or '*' for all)
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    
    this._subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this._subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * Subscribe once
   */
  subscribeOnce(key, callback) {
    const unsub = this.subscribe(key, (value) => {
      callback(value);
      unsub();
    });
    return unsub;
  }

  /**
   * @private
   */
  _notify(key) {
    const value = this._state[key];
    
    // Notify specific subscribers
    this._subscribers.get(key)?.forEach(cb => {
      try { cb(value, key); } 
      catch (e) { console.error(`[Store] Error in subscriber for "${key}":`, e); }
    });

    // Notify wildcard subscribers
    this._subscribers.get('*')?.forEach(cb => {
      try { cb(value, key); } 
      catch (e) { console.error(`[Store] Error in wildcard subscriber:`, e); }
    });
  }

  /**
   * Reset state
   */
  reset() {
    this._state = {};
    this._history = [];
  }

  /**
   * Enable debug logging
   */
  enableDebug() {
    this._debug = true;
  }
}

// ============================================
// APP-SPECIFIC STATE KEYS
// ============================================

export const STATE_KEYS = {
  // Current view
  CURRENT_VIEW: 'currentView', // 'graph' | 'matrix' | 'archetypes'
  
  // Interaction mode
  MODE: 'mode', // 'explore' | 'compare' | 'findPath'
  
  // Selection
  SELECTED_DEITY: 'selectedDeity',
  COMPARE_PAIR: 'comparePair', // [deityA, deityB]
  PINNED_NODES: 'pinnedNodes', // Set of pinned deity IDs
  
  // Graph state
  GRAPH_THRESHOLD: 'graphThreshold',
  SIMILARITY_METHOD: 'similarityMethod', // 'cosine' | 'overlap'
  ERA_FILTER: 'eraFilter',
  SHOW_COGNATES: 'showCognates',
  
  // UI state
  SIDEBAR_OPEN: 'sidebarOpen',
  ACTIVE_TOUR: 'activeTour',
  SEARCH_QUERY: 'searchQuery',
  THEME: 'theme',
  
  // Data
  DEITIES: 'deities',
  COGNATES: 'cognates',
  TOURS: 'tours',
};

// Singleton instance
export const store = new Store({
  [STATE_KEYS.CURRENT_VIEW]: 'graph',
  [STATE_KEYS.MODE]: 'explore',
  [STATE_KEYS.SELECTED_DEITY]: null,
  [STATE_KEYS.COMPARE_PAIR]: [],
  [STATE_KEYS.PINNED_NODES]: new Set(),
  [STATE_KEYS.GRAPH_THRESHOLD]: 0.35,
  [STATE_KEYS.SIMILARITY_METHOD]: 'cosine',
  [STATE_KEYS.ERA_FILTER]: null,
  [STATE_KEYS.SHOW_COGNATES]: true,
  [STATE_KEYS.SIDEBAR_OPEN]: true,
  [STATE_KEYS.ACTIVE_TOUR]: null,
  [STATE_KEYS.SEARCH_QUERY]: '',
  [STATE_KEYS.THEME]: 'dark',
});

export default store;
