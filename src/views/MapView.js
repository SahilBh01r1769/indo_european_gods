import { PANTHEON_COLORS } from '../data/deities.js';
import { STATE_KEYS } from '../utils/store.js';

// Approximate cultural centers for each tradition. These are visualization
// anchors, not deity-specific archaeological coordinates.
const PANTHEON_LOCATIONS = {
  Greek:        { lat: 38.0, lng: 23.7 },
  Vedic:        { lat: 28.6, lng: 77.2 },
  Norse:        { lat: 59.9, lng: 10.7 },
  Celtic:       { lat: 53.3, lng: -6.3 },
  Roman:        { lat: 41.9, lng: 12.5 },
  Slavic:       { lat: 50.4, lng: 30.5 },
  Mesopotamian: { lat: 33.3, lng: 44.4 },
  Iranian:      { lat: 35.7, lng: 51.4 },
  Egyptian:     { lat: 30.0, lng: 31.2 },
};

export class MapView {
  constructor(store, generator) {
    this.store = store;
    this.generator = generator;
    this.container = null;
    this.map = null;
    this.markers = [];
  }

  mount(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="map-stage">
        <div id="leaflet-map" style="height:100%;width:100%;"></div>
        <div class="map-context-card">
          <div class="map-context-kicker">Cultural atlas</div>
          <div class="map-context-title">Traditions in place</div>
          <div class="map-context-copy">Approximate cultural centers, not deity-specific archaeological coordinates. Use the historical horizon in Network controls to change the time slice.</div>
        </div>
      </div>`;
  }

  setupSubscriptions() {
    this.store.subscribe(STATE_KEYS.CURRENT_VIEW, view => {
      if (view !== 'map') return;
      if (!this.map) this.initMap();
      this.render();
      requestAnimationFrame(() => this.map?.invalidateSize());
    });

    this.store.subscribe(STATE_KEYS.GRAPH_DATA, () => {
      if (this.store.get(STATE_KEYS.CURRENT_VIEW) === 'map') this.render();
    });

    this.store.subscribe(STATE_KEYS.ERA_FILTER, () => {
      if (this.store.get(STATE_KEYS.CURRENT_VIEW) === 'map') this.render();
    });

    if (this.store.get(STATE_KEYS.CURRENT_VIEW) === 'map') {
      this.initMap();
      this.render();
    }
  }

  initMap() {
    if (this.map) return;

    this.map = L.map('leaflet-map').setView([35, 30], 3);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);
  }

  getVisibleDeities() {
    const graphNodes = this.store.get(STATE_KEYS.GRAPH_DATA)?.nodes || [];
    if (graphNodes.length) return graphNodes;

    const all = this.store.get(STATE_KEYS.DEITIES) || [];
    const cutoff = this.store.get(STATE_KEYS.ERA_FILTER);
    return cutoff == null ? all : all.filter(d => d.era <= cutoff);
  }

  render() {
    if (!this.map) return;

    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    const deitiesToShow = this.getVisibleDeities();
    const pantheonIndex = new Map();

    deitiesToShow.forEach(d => {
      const baseLoc = PANTHEON_LOCATIONS[d.pantheon];
      if (!baseLoc) return;

      const index = pantheonIndex.get(d.pantheon) || 0;
      pantheonIndex.set(d.pantheon, index + 1);

      const angle = index * 2.399963229728653;
      const radius = 0.08 + 0.035 * Math.sqrt(index);
      const lat = baseLoc.lat + Math.sin(angle) * radius;
      const lng = baseLoc.lng + Math.cos(angle) * radius;

      const color = PANTHEON_COLORS[d.pantheon] || '#888';
      const icon = L.divIcon({
        className: 'custom-deity-marker',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.55);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(`
          <div style="font-family:var(--font-sans);min-width:150px;">
            <strong style="color:${color}">${d.id}</strong><br>
            <span style="font-size:11px;color:#a1a1aa;">${d.pantheon}</span><br>
            <span style="font-size:10px;color:#71717a;">${d.epithet || ''}</span>
          </div>
        `)
        .addTo(this.map);

      marker.on('click', () => {
        this.generator.loadDeity(d.id, { resetGraph: true });
      });

      this.markers.push(marker);
    });
  }
}
