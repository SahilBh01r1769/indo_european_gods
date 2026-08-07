// src/views/map.js
import { DEITIES } from '../data/deities.js';
import { PANTHEON_COLORS } from '../data/deities.js';

let mapInstance = null;
let markerCluster = null;

export function initMap() {
  // Map is initialized on first render
}

export function renderMap(nodes, options = {}) {
  const { activeFilter = null, eraMin = 0 } = options;
  const container = document.getElementById('map-view');
  if (!container) return;

  // Ensure the container is sized
  container.style.width = '100%';
  container.style.height = '100%';

  // Prefer real lat/lng; fall back to pantheon centers if missing
  const PANTHEON_CENTERS = {
    Greek:         [39.0, 22.0],
    Vedic:         [25.0, 78.0],
    Norse:         [62.0, 10.0],
    Celtic:        [53.0, -7.0],
    Roman:         [41.9, 12.5],
    Slavic:        [52.0, 30.0],
    Mesopotamian:  [33.0, 44.0],
    Iranian:       [32.0, 53.0],
    Egyptian:      [26.0, 30.0],
  };

  const geoNodes = nodes
    .filter(n => {
      if (eraMin > 0 && n.era < eraMin) return false;
      if (activeFilter && typeof activeFilter === 'string') {
        const hasTrait = n.traits && Object.keys(n.traits).some(t =>
          t.toLowerCase().includes(activeFilter.toLowerCase())
        );
        if (!hasTrait) return false;
      }
      return true;
    })
    .map(n => {
      if (n.lat != null && n.lng != null) return n;
      const center = PANTHEON_CENTERS[n.pantheon];
      if (!center) return null;
      // slight jitter so markers don’t stack perfectly
      return {
        ...n,
        lat: center[0] + (Math.random() - 0.5) * 4,
        lng: center[1] + (Math.random() - 0.5) * 4,
      };
    })
    .filter(Boolean);

  if (!mapInstance) {
    mapInstance = L.map('map-view').setView([35.0, 45.0], 3);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapInstance);
  }

  // Clear old markers
  if (window.mapMarkers) {
    window.mapMarkers.forEach(m => mapInstance.removeLayer(m));
  }
  window.mapMarkers = [];

  geoNodes.forEach(node => {
    const color = PANTHEON_COLORS[node.pantheon] || '#888';
    const icon = L.divIcon({
      className: 'custom-deity-marker',
      html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px ${color}"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const marker = L.marker([node.lat, node.lng], { icon }).bindPopup(`
      <div style="font-family:Cinzel,serif;color:#09090b">
        <strong style="font-size:14px">${node.id}</strong><br>
        <span style="font-size:11px;color:#555">${node.originalScript || ''} ${node.epithet || ''}</span><br>
        <span style="font-size:10px;background:${color};color:#fff;padding:2px 6px;border-radius:4px">${node.pantheon}</span>
      </div>
    `);

    marker.addTo(mapInstance);
    window.mapMarkers.push(marker);
  });

  if (window.mapMarkers.length) {
    const group = L.featureGroup(window.mapMarkers);
    mapInstance.fitBounds(group.getBounds().pad(0.15));
  }

  // Critical: after the view becomes visible
  setTimeout(() => mapInstance.invalidateSize(), 50);
}

export function clearMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    window.mapMarkers = [];
  }
}
