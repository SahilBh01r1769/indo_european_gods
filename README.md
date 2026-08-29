# 🏛️ Mythos Network — Indo-European Gods

An interactive knowledge graph for exploring **mythological, functional and linguistic connections** between deities across Indo-European traditions.

Rather than treating mythology as a family tree, the project represents each deity as a **16-dimensional curated trait vector** and compares those vectors computationally. This makes it possible to explore questions such as:

- Which storm-warrior figures have the closest functional profiles?
- How similar are two pantheons on average?
- Which deities share an attested Proto-Indo-European cognate relationship?
- What is the shortest similarity-chain between two figures?
- Which archetypal roles recur across otherwise distant traditions?

The application is deliberately **zero-build and framework-free**: plain ES modules, D3.js and Leaflet. The optional Node tooling is only for validation/tests.

---

## What is in the dataset?

The main Indo-European traditions represented are **Greek, Vedic, Roman, Norse, Celtic, Slavic and Iranian**.

**Egyptian and Mesopotamian material is included as a comparative outgroup**, not because those traditions are Indo-European. Their presence makes it possible to distinguish specifically Indo-European continuities from broader cross-cultural mythological patterns.

Trait values are **curated heuristic weights informed by comparative-mythology sources**. They should be read as a computational model for exploration, not as measurements directly reported by the cited scholars.

---

## Features

### Graph view — D3.js

- Force-directed similarity network
- Cosine similarity or weighted overlap
- Kin / Top 5 / Top 10 / All connection modes
- Similarity threshold control
- Historical attestation cutoff
- Optional pantheon clustering
- Node pinning, drag, zoom/pan and minimap
- Cognate highlighting
- Compare mode and shortest similarity-chain mode
- Shareable URL state

### Map view — Leaflet

- Dark CARTO basemap matching the main interface
- Approximate cultural centers for each tradition
- Deterministic marker spreading to avoid overlap without implying false geographic precision
- Synchronized historical cutoff
- Clicking a marker opens that deity in the graph

> Map coordinates are visualization anchors for traditions, **not deity-specific archaeological coordinates**.

### Matrix view

- Average pairwise similarity between traditions
- Top deity pairs behind each matrix cell
- CSV export

### Archetype explorer

- Browse the 16 canonical traits
- See their strongest representatives and cultural spread
- Open an archetype directly as a graph

### Guided tours

Curated, deterministic subgraphs with narrative steps for selected mythological patterns. Tour membership is explicit rather than being expanded by the normal Top-N graph behavior.

### Search

- Prefix autocomplete over names, epithets, pantheons and strong traits
- Fuzzy fallback for near-matches
- Keyboard navigation
- `/` or `Ctrl/Cmd + K` to focus search

### Export

- Graph snapshot as JSON
- Current graph as SVG
- Pantheon matrix as CSV

---

## Similarity model

Each deity maps onto the same 16 canonical dimensions, including:

- archer
- healer
- disease sender
- storm god
- wilderness
- liminal outsider
- ecstasy / madness
- ascetic / wisdom
- solar
- war / victory
- trickster
- smith / craft
- sea / water
- death / underworld
- fertility
- fire

The application supports two metrics.

### Cosine similarity

```text
cos(θ) = (A · B) / (|A| × |B|)
```

This emphasizes the overall *shape* of two trait profiles.

### Weighted overlap

```text
Σ min(Ai, Bi) / Σ max(Ai, Bi)
```

This is more sensitive to agreement in the actual trait strengths.

All graph, comparison, matrix, path, export and Web Worker calculations use the **same canonical similarity module** so the results cannot drift between features.

---

## Project structure

```text
index.html
package.json                 # optional Node validation/test scripts
scripts/
  validate-data.js           # dataset/schema sanity checks
tests/
  similarity.test.js         # core similarity regression tests
src/
  core/
    main.js                  # boot
    App.js                   # composition + global wiring
    Generator.js             # graph generation/orchestration
    Router.js                # URL hash state
  data/
    deities.js               # deity records + canonical trait metadata
    cognates.js              # linguistic cognate pairs
    tours.js                 # guided-tour definitions
    citations.js             # bibliography + per-deity references
  utils/
    similarity.js            # canonical math/path/matrix engine
    store.js                 # lightweight pub/sub store
    trie.js                  # search index
    workerClient.js          # similarity worker client
    export.js                # JSON/SVG/CSV export
  workers/
    similarityWorker.js      # module worker reusing similarity.js
  views/
    GraphView.js
    MatrixView.js
    ArchetypesView.js
    MapView.js
  components/
    Sidebar.js
    SearchBar.js
    GraphControls.js
    CompareModal.js
    MethodologyModal.js
    Legend.js
    PathStrip.js
    Surprising.js
    Tours.js
  ui/
    Feedback.js
styles/
  base.css
  layout.css
  components.css
  graph.css
  views.css
  search.css
```

---

## Run locally

Because the application uses ES modules and a Web Worker, serve it over HTTP rather than opening `index.html` with `file://`.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

No install or build step is required to run the application.

---

## Validation and tests

Node 20+ can run the optional checks with no third-party dependencies:

```bash
npm run check
```

This validates the deity dataset and runs regression tests for the core similarity model. Pull requests to `master` run the same checks in GitHub Actions.

---

## Sources and interpretation

The project draws on comparative mythology and Indo-European studies including M. L. West, J. P. Mallory & D. Q. Adams, Calvert Watkins, Georges Dumézil and tradition-specific references. See `src/data/citations.js` for the bibliography and per-deity references.

The project deliberately separates two kinds of relationship:

1. **Computational similarity** — produced by the curated trait-vector model.
2. **Linguistic cognacy** — explicitly recorded only where a historical/etymological relationship is asserted in the cognates dataset.

Functional similarity alone does **not** imply common linguistic descent.

---

## Roadmap

Possible future directions:

- Split the large Sidebar renderer into smaller context-specific panels
- Move pantheon metadata/colors/locations into one canonical configuration object
- Improve accessibility and mobile control density
- Replace shortest-hop BFS with an optional weighted conceptual-distance path
- Improve the “surprising connection” score relative to pantheon baselines
- Add confidence/provenance metadata to individual trait weights
- Expand Baltic, Armenian and Anatolian/Hittite material
- Community data submissions through reviewed pull requests
