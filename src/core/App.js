import { DEITIES } from '../data/deities.js';
import { TOURS } from '../data/tours.js';
import { STATE_KEYS } from '../utils/store.js';

import { Router } from './Router.js';
import { Generator } from './Generator.js';
import { FeedbackUI } from '../ui/Feedback.js';

import { GraphView } from '../views/GraphView.js';
import { MatrixView } from '../views/MatrixView.js';
import { ArchetypesView } from '../views/ArchetypesView.js';
import { MapView } from '../views/MapView.js';

import { Sidebar } from '../components/Sidebar.js';
import { SearchBar } from '../components/SearchBar.js';
import { Tours } from '../components/Tours.js';
import { Surprising } from '../components/Surprising.js';
import { GraphControls } from '../components/GraphControls.js';
import { Legend } from '../components/Legend.js';
import { CompareModal } from '../components/CompareModal.js';
import { PathStrip } from '../components/PathStrip.js';
import { MethodologyModal } from '../components/MethodologyModal.js';

export class App {
  constructor(store) {
    this.store = store;

    this.feedback = new FeedbackUI();
    this.router = new Router(store);
    this.generator = new Generator(store, this.feedback);
    this.methodologyModal = new MethodologyModal();

    this.graphView = new GraphView(store, this.generator, this.feedback);
    this.matrixView = new MatrixView(store, this.generator);
    this.archetypesView = new ArchetypesView(store, this.generator);
    this.mapView = new MapView(store, this.generator);

    this.sidebar = new Sidebar(store, this.generator, this.feedback);
    this.searchBar = new SearchBar(store, this.generator);
    this.tours = new Tours(store, this.generator, this.feedback);
    this.surprising = new Surprising(store, this.generator, this.feedback);
    this.graphControls = new GraphControls(store, this.generator, this.feedback);
    this.legend = new Legend(store, this.generator);
    this.compareModal = new CompareModal(store);
    this.pathStrip = new PathStrip(store, this.generator);
  }

  start() {
    this.store.set(STATE_KEYS.DEITIES, DEITIES);
    this.store.set(STATE_KEYS.TOURS, TOURS);

    // Mount all UI before subscriptions or URL restoration fire.
    this.graphView.mount(document.getElementById('graph-svg'));
    this.matrixView.mount(document.getElementById('matrix-view'));
    this.archetypesView.mount(document.getElementById('archetypes-view'));
    this.mapView.mount(document.getElementById('map-view'));
    this.methodologyModal.mount();
    this.sidebar.mount();
    this.searchBar.mount(document.getElementById('search-wrap'));
    this.tours.mount(document.getElementById('stab-tours-content'));
    this.surprising.mount(document.getElementById('surprising-panel'));
    this.graphControls.mount(document.getElementById('graph-controls'));
    this.compareModal.mount(document.getElementById('compare-modal'));
    this.pathStrip.mount(document.getElementById('path-strip'));

    const legendHost = document.getElementById('graph-view');
    if (legendHost) this.legend.mount(legendHost);

    this.searchBar.buildIndex(DEITIES);

    // Router can request a deity while restoring a shared URL.
    window.addEventListener('router:loadDeity', e => {
      if (e.detail) this.generator.loadDeity(e.detail, { resetGraph: true });
    });

    // Register every state subscriber before Router reads location.hash.
    this.graphView.setupSubscriptions();
    this.matrixView.setupSubscriptions();
    this.archetypesView.setupSubscriptions();
    this.mapView.setupSubscriptions();
    this.sidebar.setupSubscriptions();
    this.tours.setupSubscriptions();
    this.graphControls.setupSubscriptions();

    this.store.subscribe(STATE_KEYS.UI_TOAST, msg => {
      if (msg) this.feedback.toast(msg);
    });
    this.store.subscribe(STATE_KEYS.UI_LOADING, visible => this.feedback.showLoading(visible));
    this.store.subscribe(STATE_KEYS.UI_STATUS, msg => this.feedback.setStatus(msg));
    this.store.subscribe(STATE_KEYS.SELECTED_DEITY, id => {
      if (id) this.surprising.render(id);
      else this.surprising.hide();
    });

    this.setupSidebarTabs();
    this.setupGraphCommands();
    this.setupKeyboardShortcuts();

    // URL restoration comes last so all components observe restored state.
    this.router.setup();

    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');

    console.log('[App] Initialized.');
  }

  setupSidebarTabs() {
    const setSidebarTab = tab => {
      ['info', 'tours'].forEach(name => {
        const btn = document.getElementById(`stab-${name}`);
        const content = document.getElementById(`stab-${name}-content`);
        if (btn) btn.classList.toggle('active', name === tab);
        if (content) content.style.display = name === tab ? '' : 'none';
      });
    };

    document.querySelector('.sidebar-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (btn) setSidebarTab(btn.dataset.tab);
    });
  }

  setupGraphCommands() {
    window.addEventListener('graph:zoomIn', () => this.graphView.zoomIn());
    window.addEventListener('graph:zoomOut', () => this.graphView.zoomOut());
    window.addEventListener('graph:resetZoom', () => this.graphView.resetZoom());
    window.addEventListener('graph:unpinAll', () => {
      const nodes = this.store.get(STATE_KEYS.GRAPH_DATA)?.nodes || [];
      this.graphView.unpinAll(nodes);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      const tag = e.target?.tagName || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        this.store.set(STATE_KEYS.MODE, 'explore');
        this.store.set(STATE_KEYS.PATH_FROM, null);
        this.store.set(STATE_KEYS.PATH_TO, null);
        this.store.set(STATE_KEYS.ACTIVE_PATH, []);
        this.store.set(STATE_KEYS.COMPARE_A, null);
        this.store.set(STATE_KEYS.COMPARE_B, null);
        document.getElementById('path-btn')?.classList.remove('btn-active');
        document.getElementById('compare-btn')?.classList.remove('btn-active');
        window.dispatchEvent(new CustomEvent('path:found', { detail: null }));
        this.store.set(STATE_KEYS.UI_TOAST, 'Modes cleared');
      }

      if (e.key === '/') {
        e.preventDefault();
        document.querySelector('.search-input')?.focus();
      }

      if (e.key === '1') this.store.set(STATE_KEYS.CURRENT_VIEW, 'graph');
      if (e.key === '2') this.store.set(STATE_KEYS.CURRENT_VIEW, 'matrix');
      if (e.key === '3') this.store.set(STATE_KEYS.CURRENT_VIEW, 'archetypes');
      if (e.key === '4') this.store.set(STATE_KEYS.CURRENT_VIEW, 'map');
    });
  }
}
