# Mythos — Interactive Comparative Mythology

[Mythos](https://sahilbh01r1769.github.io/indo_european_gods/) is a zero-build digital humanities project for exploring connections among mythological figures. A visitor starts with one figure or recurring pattern, follows a limited set of clues, and builds a personal network instead of receiving an undifferentiated wall of matches.

The interface distinguishes historical and linguistic evidence from structural comparison, cross-cultural resemblance, speculation, and similarity produced only by the site's hand-curated trait model.

## The experience

### Home and Discover

- The home page explains the premise and shows the visual grammar before asking for a commitment.
- Discover begins with a deity or archetype and presents one progressive, guessable lead at a time.
- Every reveal selects the new figure, explains the relationship, and remains in the visitor's journey.
- Network, chronological, and fixed Old World atlas views show the same discoveries from different angles. The atlas uses Natural Earth coastline data beneath approximate cultural-region overlays.
- Journeys support clear, undo, redo and recent-journey restoration, persist locally, and can be shared through a compact URL snapshot.
- Curated relationships and model-only echoes use visibly different line treatments and labels.

### Stories, Collection, and comparison

- Six paced transformation tours show what a divine identity retains and changes through inherited ancestry, cultural contact and reinterpretation; a control tour demonstrates the limits of resemblance.
- The collection supports search, tradition filtering, sorting, result counts, and cited dossiers.
- Deity dossiers combine native names, approximate historical-language pronunciation guides, aliases, memory hooks, periods, regions, provenance-labelled marks and scoped sources.
- Relationship dossiers explain what supports a connection, how cautiously to read it, and where the compared figures differ.
- Two or three figures can be compared without losing the graph. Qualitative evidence appears before the trait-overlap score.

## Evidence vocabulary

| Type                        | Meaning in Mythos                                                                 |
| --------------------------- | --------------------------------------------------------------------------------- |
| Linguistic inheritance      | A relationship grounded in historical linguistics or inherited naming             |
| Historical contact / fusion | Documented contact, identification, transmission, or reinterpretation             |
| Structural comparison       | A strong likeness in role, narrative, or ritual structure without a descent claim |
| Cross-cultural parallel     | A useful resemblance that is not evidence of shared origin                        |
| Speculative curiosity       | A deliberately tentative connection with limited support                          |
| Model-only thematic echo    | Similarity produced by manually assigned trait weights, not historical evidence   |

Egyptian and Mesopotamian figures are comparative outgroups. Their presence does not imply that those traditions are Indo-European. The geography view shows approximate cultural regions, not historical borders. Its coastline asset is generated from Natural Earth 1:110m public-domain land data.

## Visual direction

The interface uses an editorial-atlas system: warm paper, ink, restrained mineral pigments, fine cartographic rules, and serif display typography. Colour is semantic—traditions and evidence types carry it—rather than decorative. Components use squared editorial geometry, modest motion, and ordinary language instead of glass panels, oversized pills, gradients, or promotional copy associated with generic generated interfaces.

The UI includes keyboard-operable graph nodes, visible focus states, a skip link, dialog focus trapping and restoration, reduced-motion support, and a persistent mobile navigation bar.

## Data and architecture

The dataset currently contains 67 figures, 16 canonical trait dimensions, 51 curated relationships, 17 bibliography records, and 9 represented traditions. Trait weights are editorial heuristics for exploration; they are not scholarly measurements or confidence values.

```text
index.html
vendor/d3.min.js             # pinned D3 7.9 runtime; no CDN dependency

src/
  data/
    deities.js               # figures, traditions, symbols, eras, traits
    cognates.js              # curated relationship records and source notes
    citations.js             # bibliography and per-figure citations
  utils/
    similarity.js            # canonical trait calculations
  v3/
    config.js                # starts, archetypes, stories, evidence vocabulary
    model.js                 # search, candidates, relations, comparison
    metadata.js              # marks, aliases, regions, memory hooks, guesses
    state.js                 # validated persistence and URL snapshots
    graph-runtime.js         # shared SVG, time, and geography rendering
    graph-stable.js          # stable interactive network layout
    app.js                   # routes, views, overlays, and interaction wiring

tests/
  similarity.test.js
  v3.test.js
  e2e/journey.spec.js
```

The application is framework-free and deploys directly from `master` on GitHub Pages.

`assets/old-world-map.svg` is a checked-in build artifact. Regenerate it after installing dependencies with `node scripts/build-old-world-map.mjs`.

## Run and validate

```bash
npm install
npm run serve
```

Open `http://127.0.0.1:4173`.

Run data and unit validation:

```bash
npm run check
```

Run the Chromium interaction suite after installing the browser once:

```bash
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs both suites for changes to `master` and pull requests.

## Interpretation

Bibliographic material and per-figure references live in `src/data/citations.js`. Relationship notes in `src/data/cognates.js` are editorial summaries, not substitutes for the cited works. Entries without linked references are identified as awaiting source review in the interface.

Mythos is an exploratory project. Its purpose is to make comparisons inspectable while keeping resemblance, historical contact, linguistic inheritance, and algorithmic similarity visibly separate.
