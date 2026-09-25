# Mythos — Interactive Comparative Mythology

[Live site](https://sahilbh01r1769.github.io/indo_european_gods/)

Mythos is a browser project I built to explore similarities and documented links between mythological figures from different traditions.

The main idea is to browse mythology as a network rather than a set of isolated articles. You can start from a deity or archetype, follow connections, switch between network, timeline and geographic views, and compare figures side by side.

I also wanted the site to make an important distinction: two gods looking similar does not automatically mean they share the same historical origin.

## Exploring the site

The application lets you:

- follow connections between deities across traditions;
- change the evidence lens between all connections, curated claims, and documented linguistic or historical links;
- search the collection by deity, archetype or story;
- view a journey as a network, timeline or map;
- compare up to three figures;
- follow a few guided stories through related figures;
- undo/redo an exploration and restore recent journeys;
- share the current journey through the URL.

Journey state is stored locally in the browser, so an exploration can be continued after leaving the page.

## Connections and similarity

Mythos uses two different kinds of relationships.

Some connections are curated from historical, linguistic or comparative sources. Others are suggestions produced by a simple trait-similarity model built from manually assigned attributes such as storm, war, healing, wilderness or the underworld.

The interface keeps those apart instead of presenting every connection as equally strong.

Curated links are labelled broadly as linguistic inheritance, historical contact or fusion, structural comparison, cross-cultural parallel, or speculative comparison. Connections produced only by the trait model are shown separately.

The evidence lens can remove the weaker categories from the current graph and its suggested leads. It does not change the stored journey, so the same exploration can be reconsidered under a stricter standard.

The similarity scores are an exploration tool, not scholarly measurements or probabilities. Egyptian and Mesopotamian figures are included as comparative outgroups; their presence does not mean those traditions are Indo-European. Geographic regions in the map are also approximate rather than exact historical borders.

## Implementation

The project is written in plain HTML, CSS and JavaScript. D3 is included locally for the graph work, and the map uses a generated Old World SVG based on public geographic data.

The current application code is mainly under:

```text
src/data/      deity records, relationships and citations
src/utils/     similarity calculations
src/v3/        application, state, search, stories and graph logic
styles/        interface styling
assets/        generated map asset
tests/         data, logic and browser tests
```

The state code handles journey persistence, undo/redo, comparisons and shareable URL snapshots. The model layer combines the curated relationships with the trait-similarity system used to suggest additional connections.

## Running locally

```bash
npm install
npm run serve
```

Then open:

```text
http://127.0.0.1:4173
```

Run the data checks and unit tests with:

```bash
npm run check
```

There is also a Playwright interaction test:

```bash
npx playwright install chromium
npm run test:e2e
```

## About the data

The collection mixes curated historical/mythological relationships with manually assigned thematic traits. Those are intentionally separate in the code and interface.

Bibliographic entries are stored in `src/data/citations.js`, while relationship notes and evidence types are in `src/data/cognates.js`. Some interpretations are simplified for an interactive project, so the cited sources should be treated as stronger evidence than the site's own similarity model.

Relationship dossiers now separate three things that are easy to confuse:

- sources explicitly attached to the relationship claim;
- wider reading associated with either figure;
- overlap produced by the manually weighted trait model.

The current source mapping identifies the works named by each curated relationship. Page-level claim review is still in progress, and editorial or proposed comparisons are marked as preliminary rather than presented as settled conclusions.

`npm run validate:data` checks figure identifiers, relationship endpoints, evidence categories, duplicate relationships, bibliography references and relationship-to-source mappings. The current dataset contains 67 figures, 51 curated relationships and nine traditions.

## Why I built it

I am interested in how similar mythic roles and stories appear across different traditions, but long lists of names make those relationships difficult to keep track of. Building the project as a network made it easier to explore those ideas visually while still showing whether a connection comes from a source or only from the site's own comparison system.
