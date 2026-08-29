/* ─────────────────────────────────────────────────────────────────
   utils/store.js — Lightweight pub/sub application state
   ───────────────────────────────────────────────────────────────── */

export const STATE_KEYS = {
  DEITIES:              'deities',
  TOURS:                'tours',
  CURRENT_VIEW:         'currentView',
  MODE:                 'mode',
  SIMILARITY_METHOD:    'similarityMethod',
  GRAPH_THRESHOLD:      'graphThreshold',
  ERA_FILTER:           'eraFilter',
  SHOW_COGNATES:        'showCognates',
  PINNED_NODES:         'pinnedNodes',
  SELECTED_DEITY:       'selectedDeity',
  ACTIVE_TRAIT_FILTER:  'activeTraitFilter',
  LINK_MODE:            'linkMode',
  SHOW_LABELS:          'showLabels',
  CLUSTER_BY_PAN:       'clusterByPan',
  EXPAND_ON_CLICK:      'expandOnClick',
  ANIMATE_ENTRANCE:     'animateEntrance',
  COMPARE_A:            'compareA',
  COMPARE_B:            'compareB',
  PATH_FROM:            'pathFrom',
  PATH_TO:              'pathTo',
  PATH_SEARCH_PENDING:  'pathSearchPending',
  ACTIVE_PATH:          'activePath',
  GRAPH_DATA:           'graphData',
  UI_TOAST:             'uiToast',
  UI_LOADING:           'uiLoading',
  UI_STATUS:            'uiStatus',
};

class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = {};
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.notify(key, value);
  }

  subscribe(key, callback) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  notify(key, value) {
    (this.listeners[key] || []).forEach(cb => cb(value));
  }
}

export const store = new Store({
  [STATE_KEYS.DEITIES]:             [],
  [STATE_KEYS.TOURS]:               [],
  [STATE_KEYS.CURRENT_VIEW]:        'graph',
  [STATE_KEYS.MODE]:                'explore',
  [STATE_KEYS.SIMILARITY_METHOD]:   'cosine',
  [STATE_KEYS.GRAPH_THRESHOLD]:     0.35,
  // null = all eras; otherwise numeric historical cutoff (e.g. -800 = 800 BCE)
  [STATE_KEYS.ERA_FILTER]:          null,
  [STATE_KEYS.SHOW_COGNATES]:       false,
  [STATE_KEYS.PINNED_NODES]:        new Set(),
  [STATE_KEYS.SELECTED_DEITY]:      null,
  [STATE_KEYS.ACTIVE_TRAIT_FILTER]: null,
  [STATE_KEYS.LINK_MODE]:           'top5',
  [STATE_KEYS.SHOW_LABELS]:         true,
  [STATE_KEYS.CLUSTER_BY_PAN]:      false,
  [STATE_KEYS.EXPAND_ON_CLICK]:     true,
  [STATE_KEYS.ANIMATE_ENTRANCE]:    true,
  [STATE_KEYS.COMPARE_A]:           null,
  [STATE_KEYS.COMPARE_B]:           null,
  [STATE_KEYS.PATH_FROM]:           null,
  [STATE_KEYS.PATH_TO]:             null,
  [STATE_KEYS.ACTIVE_PATH]:         [],
  [STATE_KEYS.PATH_SEARCH_PENDING]: null,
  [STATE_KEYS.GRAPH_DATA]:          { nodes: [], edges: [] },
  [STATE_KEYS.UI_TOAST]:            null,
  [STATE_KEYS.UI_LOADING]:          false,
  [STATE_KEYS.UI_STATUS]:           '',
});
