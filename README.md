# Mythos — Interactive Comparative Mythology

[Live site](https://sahilbh01r1769.github.io/indo_european_gods/)

Mythos is a browser-based project for exploring similarities and documented connections between mythological figures from different traditions.

The main goal is to make those comparisons easier to explore without treating every resemblance as evidence of a shared origin. The site separates linguistic inheritance, historical contact, structural similarity, broad cross-cultural parallels, speculative links and similarities produced only by its own trait model.

## What you can do

- start from a deity or recurring archetype and follow related figures
- explore the same journey as a network, timeline or map
- search and filter the full collection
- open individual deity and relationship details
- compare two or three figures side by side
- follow short curated stories about inheritance, reinterpretation and recurring mythic patterns
- undo/redo an exploration path and restore recent journeys from local storage
- share a journey through a URL snapshot

The application is written in plain HTML, CSS and JavaScript. D3 is included locally for the graph and visualization work, so the site does not depend on a JavaScript framework or CDN at runtime.

## Evidence categories

Connections in the interface are labelled by type instead of being shown as one undifferentiated similarity score.

| Type | How it is used |
| --- | --- |
| Linguistic inheritance | Connections supported by historical linguistics or inherited names |
| Historical contact / fusion | Documented identification, transmission, adoption or syncretism |
| Structural comparison | Similarity in role, story or ritual structure without a direct descent claim |
| Cross-cultural parallel | A useful resemblance between otherwise separate traditions |
| Speculative curiosity | A deliberately tentative comparison |
| Model-only thematic echo | Similarity produced from the site's manually assigned trait weights |

The trait scores are an exploration tool. They are not scholarly measurements or confidence values.

Egyptian and Mesopotamian figures are included as comparative outgroups; their presence does not mean those traditions are Indo-European. The map also shows approximate cultural regions rather than exact historical borders.

## Project structure

```text
index.html
vendor/d3.min.js

src/
  data/
    deities.js       deity records and traits
    cognates.js      curated relationship records
    citations.js     bibliography and per-figure references
  utils/
    similarity.js    trait-similarity calculations
  v3/
    config.js        archetypes, stories and evidence labels
    model.js         search, comparisons and relationship logic
    metadata.js      aliases, regions and supporting metadata
    state.js         local persistence and shareable URL state
    graph-runtime.js shared visualization helpers
    graph-stable.js  network layout
    app.js           application views and interactions

styles/
tests/
scripts/
assets/
```

The current interface and data are driven mainly by the files under `src/v3/` and `src/data/`.

## Running locally

Install the development dependencies:

```bash
npm install
```

Start a local server:

```bash
npm run serve
```

Then open:

```text
http://127.0.0.1:4173
```

The `serve` script uses Python's built-in HTTP server, so Python 3 also needs to be available locally.

## Validation and tests

Run the data checks and unit tests together:

```bash
npm run check
```

The repository also includes a Playwright interaction test:

```bash
npx playwright install chromium
npm run test:e2e
```

The test setup covers the similarity logic, data/config validation and an end-to-end exploration flow.

## Map asset

`assets/old-world-map.svg` is generated from Natural Earth / world-atlas data and checked into the repository so the site can use it directly.

If the source data or map generation code changes, rebuild it with:

```bash
node scripts/build-old-world-map.mjs
```

## About the data

The project mixes two kinds of information:

1. curated historical/mythological relationships with evidence labels and references
2. manually assigned thematic traits used to surface additional similarities

Those are intentionally kept separate in the interface. A high trait overlap should not be read as proof that two figures share a historical origin.

Bibliographic entries are stored in `src/data/citations.js`, while the relationship notes and their evidence types are in `src/data/cognates.js`. Some interpretations are necessarily simplified for an interactive project, so the cited material should be treated as the stronger source when checking a claim in detail.

## Why I built it

I wanted a way to explore comparative mythology as a network rather than as a long list of isolated entries. The interesting part of the project is not just finding that two gods look similar, but keeping track of *why* they are being compared and how strong that connection actually is.
