/* ─────────────────────────────────────────────────────────────────
   components/surprising.js — "Most surprising connection" card
   ───────────────────────────────────────────────────────────────── */

import { PANTHEON_COLORS } from '../data/deities.js';
import { getMostSurprisingConnection } from '../utils/similarity.js';

let _onLoadDeity;

export function initSurprising({ onLoadDeity }) {
  _onLoadDeity = onLoadDeity;
}

export function renderSurprisingCard(deity, metric = 'cosine') {
  const panel = document.getElementById('surprising-panel');
  if (!panel) return;

  const conn = getMostSurprisingConnection(deity, metric);
  if (!conn) { panel.style.display = 'none'; return; }

  panel.style.display = 'block';

  const colA = PANTHEON_COLORS[deity.pantheon]       || '#888';
  const colB = PANTHEON_COLORS[conn.deity.pantheon]  || '#888';
  const pct  = (conn.score * 100).toFixed(0);

  // Generate share text
  const shareText =
    `${deity.id} (${deity.pantheon}) and ${conn.deity.id} (${conn.deity.pantheon}) ` +
    `score ${conn.score.toFixed(2)} cosine similarity in my Indo-European Myth Network — ` +
    `sharing traits: ${conn.shared.slice(0, 3).join(', ')}. ` +
    `The algorithm finds what 200 years of comparative mythology argued. #Mythology #DataViz`;

  panel.innerHTML = `
    <div class="panel-title"><span class="panel-icon">⟡</span> Most surprising connection</div>
    <div class="surprise-card">
      <div class="surprise-score">${conn.score.toFixed(2)}</div>
      <div class="surprise-pair">
        <span style="color:${colA}">${deity.id}</span>
        <span style="color:var(--text-3)"> ↔ </span>
        <span style="color:${colB}">${conn.deity.id}</span>
      </div>
      <div style="font-size:10px;color:var(--text-3);margin-bottom:5px">
        ${deity.pantheon} → ${conn.deity.pantheon} · cross-pantheon
      </div>
      ${conn.cognate
        ? `<div class="surprise-note" style="color:var(--gold);font-size:11px">⟡ Known PIE cognate: ${conn.cognate.note}</div>`
        : `<div class="surprise-note">
             Shared traits: ${conn.shared.slice(0, 4).map(t =>
               `<span class="trait-pill trait-pill-accent" style="margin:1px">${t}</span>`
             ).join(' ')}
           </div>`
      }
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn btn-sm btn-gold" id="surp-explore">Explore →</button>
        <button class="btn btn-sm" id="surp-copy" title="Copy shareable text">⧉ Copy post</button>
      </div>
    </div>
  `;

  document.getElementById('surp-explore')?.addEventListener('click', () => {
    _onLoadDeity && _onLoadDeity(conn.deity.id);
  });

  document.getElementById('surp-copy')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(shareText).then(() => {
      const btn = document.getElementById('surp-copy');
      if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = '⧉ Copy post'; }, 2000); }
    });
  });
}


/* ─────────────────────────────────────────────────────────────────
   components/methodology.js — Methodology modal
   ───────────────────────────────────────────────────────────────── */

import { TRAITS } from '../data/deities.js';
import { BIBLIOGRAPHY } from '../data/citations.js';

export function initMethodologyModal() {
  const btn     = document.getElementById('method-btn');
  const modal   = document.getElementById('method-modal');
  const closeBtn = document.getElementById('method-close');

  if (!btn || !modal) return;

  btn.addEventListener('click', () => {
    renderMethodologyContent();
    modal.classList.add('open');
  });

  closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
}

function renderMethodologyContent() {
  const body = document.getElementById('method-body');
  if (!body) return;

  body.innerHTML = `
    <!-- What is this -->
    <div class="method-section">
      <div class="method-heading"><span class="method-heading-icon">☽</span> What is this project?</div>
      <div class="method-body">
        <p>This is an interactive knowledge graph for exploring <strong>comparative Indo-European mythology</strong>
        through the lens of <strong>trait-vector similarity</strong>. Rather than showing genealogical relationships
        or narrative connections, it asks: which deities share the same <em>archetypal role</em> across different
        Indo-European traditions?</p>
        <p>The goal is to make visible what comparative mythologists like Dumézil, West, and Watkins spent careers
        arguing: that the gods of Greece, India, Scandinavia, Ireland, and Iran are often reflections of the same
        Proto-Indo-European (PIE) archetypes, separated by thousands of years and miles but still recognizably kin.</p>
      </div>
    </div>

    <!-- The 16 traits -->
    <div class="method-section">
      <div class="method-heading"><span class="method-heading-icon">◈</span> The 16 trait dimensions</div>
      <div class="method-body">
        <p>Each deity is encoded as a vector in 16-dimensional trait space. These traits were chosen because
        they appear as significant attributes in the comparative mythology literature — particularly West (2007)
        and Dumézil's three-function framework.</p>
        <p>Each value is a weight from <strong>0.0</strong> (absent) to <strong>1.0</strong> (defining attribute).
        Values are hand-assigned based on primary sources and scholarly consensus, not automatically generated.</p>
      </div>
      <div class="method-trait-grid">
        ${TRAITS.map(t => `
          <div class="method-trait-chip">
            <strong>${t}</strong>
          </div>`).join('')}
      </div>
    </div>

    <!-- Cosine similarity -->
    <div class="method-section">
      <div class="method-heading"><span class="method-heading-icon">∿</span> Cosine similarity</div>
      <div class="method-body">
        <p>The default metric measures the <strong>angle</strong> between two trait vectors in 16-dimensional space.
        Two deities with identical trait profiles score 1.0; two with completely non-overlapping profiles score 0.0.</p>
      </div>
      <div class="method-formula">sim(A, B) = (A · B) / (|A| × |B|)</div>
      <div class="method-body">
        <p>Cosine similarity is <em>scale-invariant</em> — it doesn't matter whether a deity has many strong traits
        or few, only the <em>shape</em> of their profile. This makes it good at finding archetypal overlap even when
        overall trait intensity differs (e.g., a well-attested deity vs. a fragmentarily documented one).</p>
      </div>
    </div>

    <!-- Weighted overlap -->
    <div class="method-section">
      <div class="method-heading"><span class="method-heading-icon">∿</span> Weighted overlap</div>
      <div class="method-body">
        <p>An alternative metric, similar to the Jaccard coefficient. It rewards pairs who share
        <em>high-intensity</em> traits rather than just similar shapes.</p>
      </div>
      <div class="method-formula">sim(A, B) = Σ min(Aᵢ, Bᵢ) / Σ max(Aᵢ, Bᵢ)</div>
      <div class="method-body">
        <p>Use weighted overlap when you want to emphasise deities who are both highly active in the same domains,
        rather than just having similar relative profiles.</p>
      </div>
    </div>

    <!-- Era encoding -->
    <div class="method-section">
      <div class="method-heading"><span class="method-heading-icon">⌛</span> Era encoding</div>
      <div class="method-body">
        <p>Each deity is assigned an <strong>era</strong> value (1–5) corresponding to the rough period of their
        primary attestation:</p>
      </div>
      <div class="method-trait-grid">
        <div class="method-trait-chip"><strong>5</strong> ~2000–1500 BCE<br/>Rigvedic, early Bronze Age</div>
        <div class="method-trait-chip"><strong>4</strong> ~1500–800 BCE<br/>Late Bronze Age, Iron Age</div>
        <div class="method-trait-chip"><strong>3</strong> ~800–200 BCE<br/>Classical Greek, Celtic</div>
        <div class="method-trait-chip"><strong>2</strong> ~200 BCE–500 CE<br/>Roman Imperial</div>
        <div class="method-trait-chip"><strong>1</strong> ~500–1200 CE<br/>Norse, Slavic, medieval</div>
      </div>
      <div class="method-body" style="margin-top:10px">
        <p>The era filter restricts visible nodes to deities attested at or before a given period, letting you
        explore how the network looked in the Vedic Bronze Age vs. the Roman Imperial period.</p>
      </div>
    </div>

    <!-- Limitations -->
    <div class="method-section">
      <div class="method-heading"><span class="method-heading-icon">⚠</span> Limitations & honest caveats</div>
      <div class="method-body">
        <p><strong>Trait weights are subjective.</strong> They are based on scholarly consensus where available,
        but remain interpretive choices. Different mythologists would weight them differently.</p>
        <p><strong>High similarity ≠ shared origin.</strong> A high score means the deities play similar archetypal
        roles — it does not prove they derive from a common PIE prototype. Functional parallels can arise independently.</p>
        <p><strong>Coverage is selective.</strong> Only Indo-European traditions are included. Non-IE traditions
        (Egyptian, Yoruba, Aztec) may show strong functional parallels but are outside the project's scope.</p>
        <p><strong>Deities are complex.</strong> Reducing a deity to 16 numbers necessarily loses nuance. This tool
        is a starting point for exploration, not a definitive classification system.</p>
      </div>
    </div>

    <!-- Bibliography -->
    <div class="method-section">
      <div class="method-heading"><span class="method-heading-icon">📚</span> Bibliography</div>
      <div>
        ${BIBLIOGRAPHY.map(b => `
          <div class="ref-item">
            <span class="ref-author">${b.author}</span>
            <span class="ref-year"> (${b.year}). </span>
            <span class="ref-title">${b.title}.</span>
            <span style="color:var(--text-3)"> ${b.publisher}.</span>
            <br/>
            <span style="font-size:10px;color:var(--text-2)">${b.note}</span>
          </div>`).join('')}
      </div>
    </div>
  `;
}
