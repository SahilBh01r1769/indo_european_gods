/* ─────────────────────────────────────────────────────────────────
   utils/export.js — JSON, SVG and CSV export logic
   ───────────────────────────────────────────────────────────────── */

import { TRAITS } from '../data/deities.js';
import { getCognate } from '../data/cognates.js';
import { traitVector } from './similarity.js';

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJSON(state) {
  const { nodes = [], edges = [], centerDeity, metric, threshold } = state;
  if (!nodes.length) return false;

  const resolveId = value => (typeof value === 'object' ? value?.id : value);
  const centerId = typeof centerDeity === 'string' ? centerDeity : centerDeity?.id || null;
  const safeThreshold = threshold ?? 0.35;

  const data = {
    meta: {
      title: 'Indo-European Myth Network',
      center: centerId,
      metric,
      threshold: +safeThreshold.toFixed(3),
      generated: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
    nodes: nodes.map(node => ({
      id: node.id,
      pantheon: node.pantheon,
      era: node.era,
      epithet: node.epithet,
      traits: node.traits,
      traitVector: traitVector(node),
    })),
    edges: edges.map(edge => {
      const source = resolveId(edge.source);
      const target = resolveId(edge.target);
      const cognate = edge.cognate || getCognate(source, target) || null;

      return {
        source,
        target,
        weight: +(edge.similarity ?? edge.weight ?? 0).toFixed(4),
        shared_traits: edge.shared || [],
        is_cognate: !!cognate,
        cognate_note: cognate?.note || null,
      };
    }),
    traitDimensions: TRAITS,
  };

  const filename = `myth-network-${centerId || 'export'}-${Date.now()}.json`;
  triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
  return filename;
}

export function exportSVG() {
  const svgEl = document.getElementById('graph-svg');
  if (!svgEl) return false;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    text { font-family: Inter, Arial, sans-serif; }
    .node-label { font-size: 10px; fill: #c8c4e0; text-anchor: middle; dominant-baseline: hanging; }
    .node-center .node-label { font-family: Georgia, serif; font-size: 12px; fill: #f0d080; }
    .pin-ring { display: none; }
  `;
  clone.insertBefore(style, clone.firstChild);

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#09090d');
  clone.insertBefore(bg, clone.firstChild);

  const filename = `myth-network-${Date.now()}.svg`;
  triggerDownload(clone.outerHTML, filename, 'image/svg+xml');
  return filename;
}

export function exportMatrixCSV(pantheons, matrix) {
  const escapeCell = value => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const header = ['', ...pantheons].map(escapeCell).join(',');
  const rows = matrix.map((row, i) =>
    [pantheons[i], ...row.map(v => v.toFixed(4))].map(escapeCell).join(',')
  );
  const csv = [header, ...rows].join('\n');
  triggerDownload(csv, `myth-matrix-${Date.now()}.csv`, 'text/csv');
  return true;
}
