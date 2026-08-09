import { PANTHEON_COLORS } from '../data/deities.js';
import { STATE_KEYS } from '../utils/store.js';

// Approximate geographic centers for each pantheon
const PANTHEON_LOCATIONS = {
  Greek:        { lat: 38.0, lng: 23.7 },  // Athens
  Vedic:        { lat: 28.6, lng: 77.2 },  // Delhi region
  Norse:        { lat: 59.9, lng: 10.7 },  // Oslo
  Celtic:       { lat: 53.3, lng: -6.3 },  // Ireland
  Roman:        { lat: 41.9, lng: 12.5 },  // Rome
  Slavic:       { lat: 50.4, lng: 30.5 },  // Kyiv
  Mesopotamian: { lat: 33.3, lng: 44.4 },  // Baghdad/Babylon
  Iranian:      { lat: 35.7, lng: 51.4 },  // Tehran/Persepolis
  Egyptian:     { lat: 30.0, lng: 31.2 },  // Cairo/Memphis
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
    this.container.innerHTML = '<div id="leaflet-map" style="height:100%;width:100%;"></div>';
  }

  setupSubscriptions() {
    this.store.subscribe(STATE_KEYS.CURRENT_VIEW, view => {
      if (view === 'map' && !this.map) {
        this.initMap();
        this.render();
      }
    });
    this.store.subscribe(STATE_KEYS.GRAPH_DATA, () => {
      if (this.store.get(STATE_KEYS.CURRENT_VIEW) === 'map') this.render();
    });
  }

  initMap() {
    this.map = L.map('leaflet-map').setView([35, 30], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  render() {
    if (!this.map) return;

    this.markers.forEach(m => m.remove());
    this.markers = [];

    const { nodes } = this.store.get(STATE_KEYS.GRAPH_DATA);
    const deitiesToShow = (nodes && nodes.length > 0) ? nodes : (this.store.get(STATE_KEYS.DEITIES) || []);

    deitiesToShow.forEach((d, index) => {
      const baseLoc = PANTHEON_LOCATIONS[d.pantheon];
      if (!baseLoc) return;

      // Add slight random offset to prevent overlap
      const offset = (index % 10) * 0.5;
      const lat = baseLoc.lat + (Math.sin(index) * offset);
      const lng = baseLoc.lng + (Math.cos(index) * offset);

      const color = PANTHEON_COLORS[d.pantheon] || '#888';
      const icon = L.divIcon({
        className: 'custom-deity-marker',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(`
          <div style="font-family:var(--font-sans);">
            <strong style="color:${color}">${d.id}</strong><br>
            <span style="font-size:11px;color:#666;">${d.pantheon}</span><br>
            <span style="font-size:10px;color:#888;">${d.epithet || ''}</span>
          </div>
        `)
        .addTo(this.map);

      marker.on('click', () => {
        this.generator.loadDeity(d.id, { resetGraph: true });
        this.store.set(STATE_KEYS.CURRENT_VIEW, 'graph');
      });

      this.markers.push(marker);
    });
  }
}