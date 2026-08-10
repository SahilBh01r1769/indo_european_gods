import { DEITIES, TRAITS } from '../data/deities.js';
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

    this.feedback  = new FeedbackUI();
    this.router    = new Router(store);
    this.generator = new Generator(store, this.feedback);
    this.methodologyModal = new MethodologyModal();

    this.graphView      = new GraphView(store, this.generator, this.feedback);
    this.matrixView     = new MatrixView(store, this.generator);
    this.archetypesView = new ArchetypesView(store, this.generator);
    this.mapView        = new MapView(store, this.generator);

    this.sidebar       = new Sidebar(store, this.generator, this.feedback);
    this.searchBar     = new SearchBar(store, this.generator);
    this.tours         = new Tours(store, this.generator, this.feedback);
    this.surprising    = new Surprising(store, this.generator, this.feedback);
    this.graphControls = new GraphControls(store, this.generator, this.feedback);
    this.legend        = new Legend(store, this.generator);
    this.compareModal  = new CompareModal(store);
    this.pathStrip     = new PathStrip(store);
  }

  start() {


    this.store.set(STATE_KEYS.DEITIES, DEITIES);
    this.store.set(STATE_KEYS.TOURS, TOURS);

    // Mount
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

    // Subscriptions
    this.router.setup();
    this.graphView.setupSubscriptions();
    this.matrixView.setupSubscriptions();
    this.archetypesView.setupSubscriptions();
    this.mapView.setupSubscriptions();
    this.sidebar.setupSubscriptions();
    this.tours.setupSubscriptions();
    this.graphControls.setupSubscriptions();

    this.searchBar.buildIndex(DEITIES);

    // Global UI
    this.store.subscribe(STATE_KEYS.UI_TOAST, msg => { if (msg) this.feedback.toast(msg); });
    this.store.subscribe(STATE_KEYS.UI_LOADING, v => this.feedback.showLoading(v));
    this.store.subscribe(STATE_KEYS.UI_STATUS, msg => this.feedback.setStatus(msg));
    
    this.store.subscribe(STATE_KEYS.SELECTED_DEITY, id => {
      if (id) this.surprising.render(id);
      else this.surprising.hide();
    });
    
    // Sidebar tabs (same pattern as original inline script)
    const setSidebarTab = (tab) => {
      ['info', 'tours'].forEach(t => {
        const btn  = document.getElementById(`stab-${t}`);
        const cont = document.getElementById(`stab-${t}-content`);
        if (btn)  btn.classList.toggle('active', t === tab);
        if (cont) cont.style.display = (t === tab) ? '' : 'none';
      });
    };
    document.querySelector('.sidebar-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (btn) setSidebarTab(btn.dataset.tab);
    });

    // Graph control events
    window.addEventListener('graph:zoomIn',    () => this.graphView.zoomIn());
    window.addEventListener('graph:zoomOut',   () => this.graphView.zoomOut());
    window.addEventListener('graph:resetZoom', () => this.graphView.resetZoom());
    window.addEventListener('graph:unpinAll',  () => {
      this.graphView.unpinAll(this.store.get(STATE_KEYS.GRAPH_DATA).nodes);
    });

    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');

    console.log('[App] Initialized.');

    window.addEventListener('router:loadDeity', (e) => {
      const id = e.detail;
      if (id) this.generator.loadDeity(id, { resetGraph: true });
    });

    // If hash already had a deity before listeners, read once more after mount
    const hashDeity = (location.hash.match(/deity=([^&]+)/) || [])[1];
    if (hashDeity) {
      this.generator.loadDeity(decodeURIComponent(hashDeity), { resetGraph: true });
    }
  }
}
