# ✦ Indo-European Mythological Trait Network

An interactive knowledge graph for exploring how Indo-European deities relate through shared **archetypal traits** — not genealogy. Built with D3.js, vanilla ES modules, and zero build steps.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![D3.js](https://img.shields.io/badge/D3.js-v7.8-orange)
![Vanilla JS](https://img.shields.io/badge/stack-Vanilla%20ES%20Modules-yellow)
![No Build Step](https://img.shields.io/badge/build-none-brightgreen)
![GitHub Pages Ready](https://img.shields.io/badge/deploy-GitHub%20Pages-blue)

---

## 🌐 Live Demo

> **[View live →](https://YOUR_USERNAME.github.io/myth-network)**
> Deploy in under 2 minutes — see [Deployment](#-deployment) below.

---

## ✨ Features

### Core graph
| Feature | Description |
|---|---|
| **55 deities × 8 pantheons × 16 traits** | Greek, Vedic, Norse, Celtic, Roman, Slavic, Mesopotamian, Iranian |
| **Force-directed D3.js graph** | Nodes = deities, edges = trait similarity, thickness = weight |
| **Expand-on-click** | Clicking a node adds its connections to the existing graph — the network grows organically |
| **Pin nodes** | Double-click any node to lock it in place; animated gold dashed ring indicator |
| **Drag & rearrange** | Full D3 drag with pin support |
| **Keyboard autocomplete** | Arrow key navigation, pantheon-colored badges, epithet search |

### Views
| View | Description |
|---|---|
| **Graph** | Force-directed deity network — the main exploration mode |
| **Matrix** | 8×8 heatmap of average pairwise similarity between all pantheon pairs. Click any cell to see the top deity pairs driving that score. Export as CSV. |
| **Archetypes** | Browse by trait rather than by deity. Click any of the 16 archetype cards to see all deities who embody it, sized by intensity, connected by overall similarity. |

### Modes
| Mode | Description |
|---|---|
| **Explore** | Default — click nodes to expand and grow the network |
| **Compare** | Click two nodes to open a side-by-side trait breakdown with similarity score and shared-trait list |
| **Find Path** | Click two nodes to find the shortest mythological bridge between them via BFS |

### Guided tours
Six pre-built narrative tours that auto-load curated networks and walk through the comparative mythology:

1. **⚡ The Thunder Warrior Cluster** — Thor, Indra, Perun, Taranis, Zeus. The oldest reconstructible PIE myth.
2. **🏹 The Archer-Healer Paradox** — Apollo, Rudra, Shiva, Artemis, Diana, Lugh. The Far-Shooter archetype.
3. **🎭 Liminal Tricksters** — Hermes, Loki, Veles, Manannán, Mercury, Cernunnos. The boundary-crossers.
4. **☁️ The Sky Father Cluster** — Zeus, Jupiter, Dyaus, Tyr, Odin, Varuna. *Dyēus Ph₂tḗr* reconstructed.
5. **🌑 Death & the Underworld** — Hades, Yama, The Morrigan, Veles, Odin, Freya, Ishtar. First of the dead.
6. **🔥 Sacred Fire & the Smith** — Agni, Brigid, Svarog, Hephaestus, Vulcan, Lugh. Civilising fire across traditions.

Each tour includes paginated narrative text drawn from the comparative mythology literature.

### Analysis tools
| Tool | Description |
|---|---|
| **Trait heatmap** | Bar chart of all 16 trait weights for the selected deity — click any trait to filter graph edges |
| **Radar chart** | Spider chart of top 8 traits for the selected deity |
| **Most surprising connection** | Surfaces the highest-scoring cross-pantheon edge after any network generation, with one-click share text |
| **Academic citations** | Per-deity collapsible reference list with page numbers and notes |
| **Methodology modal** | Full explanation of trait encoding, cosine/overlap math, era encoding, limitations, and bibliography |
| **Cognate highlighting** | Toggle gold dashed edges on all 32 known/theorized PIE cognate pairs |
| **Era timeline filter** | Restrict nodes to deities attested in a given historical period (2000 BCE → 500 CE) |
| **Pantheon clustering** | Force that groups deities by tradition |

### Export
- **JSON** — full node/edge graph with trait vectors, shared traits, cognate flags, metadata
- **SVG** — current graph state as a self-contained vector image
- **CSV** — pantheon similarity matrix (from Matrix view)

---

## 🚀 Deployment

### GitHub Pages (recommended — zero config)

```bash
# 1. Clone / fork this repo
git clone https://github.com/YOUR_USERNAME/myth-network.git
cd myth-network

# 2. Push to GitHub
git add .
git commit -m "feat: Indo-European Myth Network v2.0"
git push origin main

# 3. Enable Pages
# Settings → Pages → Source → Deploy from branch → main → / (root)
```

The included `.github/workflows/deploy.yml` auto-deploys on every push to `main`.

Your site will be live at: `https://YOUR_USERNAME.github.io/myth-network`

### Netlify (drag & drop, ~10 seconds)

1. Go to [netlify.com](https://netlify.com) → "Add new site" → "Deploy manually"
2. Drag the entire `myth-network/` folder onto the deploy zone
3. Done.

### Vercel

```bash
npm i -g vercel
cd myth-network
vercel --prod
```

### Local development

```bash
# Any static server works — no build step required
npx serve .
# or
python3 -m http.server 8080
# or
php -S localhost:8080
```

> ⚠️ **Must be served over HTTP** — ES modules don't work from `file://` due to CORS restrictions.

---

## 📁 Project structure

```
myth-network/
│
├── index.html                      ← App shell — HTML skeleton + module bootstrap
├── README.md
├── LICENSE                         ← MIT
├── .gitignore
│
├── styles/
│   ├── base.css                    ← CSS custom properties, reset, animations
│   ├── layout.css                  ← App shell, header, sidebar, main area
│   ├── components.css              ← Buttons, cards, tooltips, toggles, badges
│   ├── graph.css                   ← D3 node, edge, label styles
│   └── views.css                   ← Matrix, archetype, tour panel styles
│
├── src/
│   ├── app.js                      ← State management + module orchestration
│   │
│   ├── data/
│   │   ├── deities.js              ← 55 deity trait vectors (16 dims, 8 pantheons)
│   │   ├── cognates.js             ← 32 PIE cognate pairs with confidence + sources
│   │   ├── tours.js                ← 6 guided tour definitions with narrative text
│   │   └── citations.js            ← Per-deity academic references + bibliography
│   │
│   ├── utils/
│   │   ├── similarity.js           ← Cosine, overlap, BFS path, matrix computation
│   │   └── export.js               ← JSON, SVG, CSV export logic
│   │
│   ├── views/
│   │   ├── graph.js                ← D3 force graph — render, simulation, minimap
│   │   ├── matrix.js               ← Pantheon similarity heatmap
│   │   └── archetypes.js           ← Trait-centric cluster view
│   │
│   └── components/
│       ├── sidebar.js              ← Deity card, radar, heatmap, connections list
│       ├── tours.js                ← Tour list panel + narrative player
│       └── surprising.js           ← Surprising connection card + methodology modal
│
└── .github/
    └── workflows/
        └── deploy.yml              ← Auto-deploy to GitHub Pages on push to main
```

---

## 🧮 How similarity works

Each deity is encoded as a **16-dimensional trait vector**:

```
Apollo = [0.95, 0.90, 0.85, 0.00, 0.40, 0.70, 0.40, 0.50, 0.85, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00]
          arch  heal  dis   stor  wild  limi  ecst  wisd  sol   war   tric  smit  sea   deat  fert  fire
```

### Cosine similarity (default)

```
sim(A, B) = (A · B) / (|A| × |B|)
```

Measures the *angle* between two vectors — good for archetypal overlap regardless of overall trait intensity. Scale-invariant.

### Weighted overlap

```
sim(A, B) = Σ min(Aᵢ, Bᵢ) / Σ max(Aᵢ, Bᵢ)
```

Jaccard-like measure — rewards shared high-intensity traits directly. Use this to emphasise deities who are both highly active in the same domains.

### Edges

Edges are drawn when `similarity ≥ threshold` (default 0.35). Edge thickness = weight × 6px. Edge colour: violet (>0.75), gold (>0.55), dark (lower). Gold dashed = known PIE cognate pair.

---

## 🗺️ Deity coverage

| Pantheon | Count | Deities |
|---|---|---|
| Greek | 13 | Apollo, Artemis, Zeus, Ares, Hermes, Hephaestus, Dionysus, Athena, Poseidon, Hades, Helios, Eos, Hera |
| Vedic | 10 | Rudra, Indra, Agni, Varuna, Surya, Vishnu, Shiva, Yama, Dyaus, Ushas |
| Norse | 8 | Thor, Odin, Loki, Freyr, Freya, Tyr, Baldr, Heimdall |
| Celtic | 8 | Lugh, The Dagda, Cernunnos, The Morrigan, Brigid, Manannán, Nuada, Taranis |
| Roman | 7 | Mars, Jupiter, Mercury, Vulcan, Diana, Neptune, Mithras |
| Slavic | 4 | Perun, Veles, Svarog, Mokosh |
| Mesopotamian | 4 | Enlil, Marduk, Nergal, Ishtar |
| Iranian | 3 | Ahura Mazda, Mithra, Ahriman |

---

## 🔬 PIE cognate pairs (32 included)

The app highlights known and theorized Proto-Indo-European cognate pairs with confidence levels (`secure` / `strong` / `probable` / `proposed`) and sources:

**Secure** (etymological + functional, broad consensus):
- Zeus ↔ Jupiter ↔ Dyaus — *Dyḗus ph₂tḗr*
- Eos ↔ Ushas — *H₂éwsōs* (dawn goddess)
- Hermes ↔ Mercury, Hephaestus ↔ Vulcan, Artemis ↔ Diana

**Strong** (functional cognacy with reconstructed etymology):
- Apollo ↔ Rudra — archer-healer-disease-sender archetype
- Thor ↔ Indra ↔ Perun — thunder warrior, serpent-slayer
- Odin ↔ Varuna — sovereign magic-wielder
- Yama ↔ Hades — first of the dead
- Mithras ↔ Mithra, Mithra ↔ Surya

**Probable / Proposed**: see `src/data/cognates.js` for full list with scholarly sources.

---

## 🛠️ Extending the project

### Adding a deity

In `src/data/deities.js`, add to the `DEITIES` array:

```js
{
  id: 'Anansi',
  pantheon: 'Akan',         // Add colour to PANTHEON_COLORS too
  era: 2,                   // 5=~2000BCE … 1=~500CE
  epithet: 'Spider God, Keeper of Stories',
  desc: 'Trickster deity of stories, wisdom, and cunning.',
  traits: {
    trickster:          0.95,
    'ascetic / wisdom': 0.80,
    'liminal outsider': 0.70,
    'smith / craft':    0.40,  // narrative craft
  },
}
```

Also add its colour:
```js
export const PANTHEON_COLORS = {
  // ...existing
  Akan: '#20c997',
};
```

### Adding a guided tour

In `src/data/tours.js`:

```js
{
  id: 'my-tour',
  icon: '🌙',
  name: 'My Custom Tour',
  tagline: 'A tagline',
  deities: ['Apollo', 'Rudra', 'Lugh'],
  centerDeity: 'Apollo',
  narrative: [
    {
      heading: 'Section heading',
      text: `Narrative text here. Supports *italic* with asterisks.`,
    },
  ],
}
```

### Adding cognate pairs

In `src/data/cognates.js`:

```js
{
  a: 'Brigid', b: 'Vesta',
  confidence: 'probable',
  note: 'Sacred flame goddess — Roman Vesta and Celtic Brigid share the eternal fire institution.',
  source: 'West, 2007',
}
```

### Using as a data module

The similarity engine is pure ES module JavaScript with no framework dependencies:

```js
import { DEITIES }                           from './src/data/deities.js';
import { computeSimilarity, getConnections,
         findPath, computePantheonMatrix }   from './src/utils/similarity.js';

// Get top connections for a deity
const apollo = DEITIES.find(d => d.id === 'Apollo');
const conns  = getConnections(apollo, 'cosine', 0.35);
// → [{ deity: Rudra, score: 0.89, shared: ['archer', 'healer', ...] }, ...]

// Find path between two deities
const path = findPath('Apollo', 'Odin', 'cosine', 0.3);
// → [Apollo, Lugh, The Dagda, Odin]

// Compute the full pantheon matrix
const { pantheons, matrix, topPairs } = computePantheonMatrix('cosine');
```

---

## 📚 Academic references

| Author | Year | Work |
|---|---|---|
| West, M.L. | 2007 | *Indo-European Poetry and Myth* — Oxford University Press |
| Mallory, J.P. & Adams, D.Q. | 2006 | *The Oxford Introduction to Proto-Indo-European* |
| Dumézil, G. | 1958 | *L'idéologie tripartie des Indo-Européens* |
| Dumézil, G. | 1966 | *Archaic Roman Religion* |
| Watkins, C. | 1995 | *How to Kill a Dragon: Aspects of Indo-European Poetics* |
| Watkins, C. | 2000 | *American Heritage Dictionary of Indo-European Roots* |
| Lincoln, B. | 1991 | *Death, War, and Sacrifice* |
| Ivanov & Toporov | 1974 | *Studies in the Field of Slavic Antiquities* |
| MacKillop, J. | 1998 | *Dictionary of Celtic Mythology* |
| Beck, R. | 2006 | *The Religion of the Mithras Cult in the Roman Empire* |

---

## ⚠️ Honest caveats

- **Trait weights are interpretive** — based on scholarly consensus but remain subjective choices.
- **High similarity ≠ shared origin** — functional parallels can arise independently; the graph shows correlation, not causation.
- **Coverage is selective** — only Indo-European traditions are included by design.
- **Deities are complex** — reducing any deity to 16 numbers loses nuance. Use this as an entry point, not a definitive classification.

---

## 📄 License

MIT — free to use, modify, and deploy. Attribution appreciated.

---

*Built as a public interest project at the intersection of data visualisation and comparative mythology.*
