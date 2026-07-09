/* ─────────────────────────────────────────────────────────────────
   utils/export.js — JSON and SVG export logic
   ───────────────────────────────────────────────────────────────── */

import { TRAITS } from '../data/deities.js';
import { traitVector } from './similarity.js';

/* ── Download helper ─────────────────────────────────────────────── */
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Export graph as JSON ────────────────────────────────────────── */
export function exportJSON(state) {
  const { nodes, edges, centerDeity, metric, threshold } = state;
  if (!nodes.length) return false;

  const resolveId = v => (typeof v === 'object' ? v.id : v);

  const data = {
    meta: {
      title:      'Indo-European Myth Network',
      center:     centerDeity?.id || null,
      metric,
      threshold:  +threshold.toFixed(3),
      generated:  new Date().toISOString(),
      nodeCount:  nodes.length,
      edgeCount:  edges.length,
    },
    nodes: nodes.map(n => ({
      id:       n.id,
      pantheon: n.pantheon,
      era:      n.era,
      epithet:  n.epithet,
      traits:   n.traits,
      traitVector: traitVector(n),
    })),
    edges: edges.map(e => ({
      source:       resolveId(e.source),
      target:       resolveId(e.target),
      weight:       +e.weight.toFixed(4),
      shared_traits: e.shared || [],
      is_cognate:   !!e.cognate,
      cognate_note: e.cognate?.note || null,
    })),
    traitDimensions: TRAITS,
  };

  const filename = `myth-network-${centerDeity?.id || 'export'}-${Date.now()}.json`;
  triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
  return filename;
}

/* ── Export graph as SVG ─────────────────────────────────────────── */
export function exportSVG() {
  const svgEl = document.getElementById('graph-svg');
  if (!svgEl) return false;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Embed a minimal style block so the SVG is self-contained
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    text { font-family: Inter, Arial, sans-serif; }
    .node-label { font-size: 10px; fill: #c8c4e0; text-anchor: middle; dominant-baseline: hanging; }
    .node-label.center { font-family: Georgia, serif; font-size: 12px; fill: #f0d080; }
    .pin-ring { display: none; }
  `;
  clone.insertBefore(style, clone.firstChild);

  // Set background rect
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width',  '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill',   '#09090d');
  clone.insertBefore(bg, clone.firstChild);

  const filename = `myth-network-${Date.now()}.svg`;
  triggerDownload(clone.outerHTML, filename, 'image/svg+xml');
  return filename;
}

/* ── Export pantheon matrix as CSV ───────────────────────────────── */
export function exportMatrixCSV(pantheons, matrix) {
  const header = ['', ...pantheons].join(',');
  const rows   = matrix.map((row, i) =>
    [pantheons[i], ...row.map(v => v.toFixed(4))].join(',')
  );
  const csv    = [header, ...rows].join('\n');
  triggerDownload(csv, `myth-matrix-${Date.now()}.csv`, 'text/csv');
  return true;
}
