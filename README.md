# 🏛️ Mythos Network — Indo-European Gods

An interactive, computational tool for exploring the archetypal, linguistic, and historical connections between Indo-European deities. Instead of a genealogy chart, deities are represented as 16-dimensional trait vectors and connected by similarity math — so the graph reflects what gods *do* (storm, death, trickery, fire...) rather than who they're descended from.

Built with **zero build step and zero framework** — plain ES modules, no npm install, no bundler. Open `index.html` behind any static server and it runs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![D3.js](https://img.shields.io/badge/D3.js-v7-orange)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900)
![Vanilla JS](https://img.shields.io/badge/JS-ES6_Modules-yellow)

---

## ✨ Features

**Graph View (D3.js)**
- Force-directed network of 67 deities across 9 pantheons, physics-tuned for fast stabilization
- Pantheon clustering — toggle nodes into distinct color-coded bands
- Node pinning (animated dashed gold ring), drag-and-drop, zoom/pan, and a live canvas minimap
- Edge width scales with similarity weight; cognate connections render as dashed gold lines
- Trait highlighting — click a trait to dim everything not connected by it

**Map View (Leaflet.js)**
- Plots deities geographically on a CARTO dark basemap
- Custom color-coded markers per pantheon
- Synced with the era filter to show how myths spread geographically over time

**Matrix & Archetype Views**
- Similarity matrix: heatmap of average trait overlap between entire pantheons, with top connecting pairs on hover
- Archetype view: clusters deities by dominant trait instead of pantheon of origin

**Smart Interactions**
- **Pathfinding (BFS)** — shortest similarity-chain between any two deities, visualizing "conceptual distance"
- **Comparison modal** — side-by-side trait bars for two selected deities
- **Guided tours** — six curated narrative paths (e.g. *The Thunder Warrior Cluster*, *Liminal Tricksters*, *Sacred Fire & the Divine Smith*)
- **Trie-backed search** — prefix tree autocomplete over deity names, pantheons, and traits for instant results regardless of dataset size

**Exports**
- SVG (self-contained, inlined styles), JSON (node/edge snapshot), and CSV (pantheon similarity matrix, for analysis in Excel/R)

---

## 🧮 The Data Model

Each deity is a **16-dimensional trait vector** (values 0.0–1.0), covering things like *archer, healer, storm god, trickster, death/underworld, fertility, fire*, and more — scored by academic consensus of mythological prominence, not vibes.

Two similarity metrics drive the graph edges:
- **Cosine similarity** — angle between two trait vectors; finds deities with the same *proportional* trait profile regardless of overall intensity
- **Weighted overlap** (Jaccard-like) — `Σ min(A,B) / Σ max(A,B)`; rewards deities that share the same traits at similarly high strength

Deities also carry a **numeric era** (earliest widespread attestation, e.g. `-800` for ~800 BCE), letting you filter the graph by historical period — from Early Bronze Age Rigvedic deities through Norse/Slavic material as late as ~1200 CE.

A separate **cognates dataset** links deities that share a verified Proto-Indo-European etymological root (Zeus / Jupiter / Dyaus Pita, for example) — these render as distinct dashed gold edges regardless of trait similarity.

---

## 🗂️ Project Structure

```
index.html
src/
  app.js                     # Entry point — state, event wiring, view switching
  data/
    deities.js                # 67 deities, 16-trait vectors, pantheon color map
    cognates.js                # PIE etymological cognate pairs
    tours.js                    # Guided tour definitions
    citations.js                 # Academic sourcing
  utils/
    similarity.js              # Cosine similarity, weighted overlap, BFS pathfinding
    trie.js                     # Prefix tree for search autocomplete
    store.js                     # Lightweight pub/sub state store
    workerClient.js               # Main-thread wrapper around the similarity worker
    export.js                      # SVG / JSON / CSV export
  workers/
    similarityWorker.js         # Offloads similarity/matrix/pathfinding math off the main thread
  views/
    graph.js                   # D3 force-directed graph
    map.js                      # Leaflet geographic view
    matrix.js                    # Pantheon similarity heatmap
    archetypes.js                 # Trait-clustered view
  components/
    search.js                   # Trie-backed search box
    sidebar.js                    # Deity detail panel
    tours.js                       # Guided tour UI
    surprising.js                   # "Most surprising connection" finder
styles/
  base.css, layout.css, components.css, graph.css, views.css, search.css
```

---

## 🎨 Design

Dark theme — deep indigo-ink backgrounds with warm gold and violet accents, built for contrast against a graph full of colored nodes and edges. `Cinzel` for headings (classical feel), `Inter` for UI text, `JetBrains Mono` for scores and coordinates, plus `Noto Sans Greek`/`Devanagari` so original-script names (Ζεύς, इन्द्र) render correctly. Tooltips and modals use `backdrop-filter` glass panels.

---

## 🚀 Running Locally

No build step — just needs to be served (ES modules require `http://`, not `file://`):

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`.

---

## 🗺️ Roadmap

- Deep-linkable state via URL hash routing (share exact graph views)
- 3D graph migration (Three.js) for denser clustering
- "Ask the Oracle" — natural-language querying over the dataset via RAG
- Community data submissions via GitHub PRs
- Expanded pantheons: Baltic, Armenian, Hittite

---

## 📚 Sources

Trait scoring and cognate relationships are drawn from standard comparative mythology references, including Georges Dumézil's trifunctional hypothesis, Mallory & Adams' *Encyclopedia of Indo-European Culture*, and M.L. West's *Indo-European Poetry and Myth*. See `src/data/citations.js` for per-deity sourcing.

---

## License

MIT
