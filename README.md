# Mythos — Interactive Comparative Mythology

**Mythos** is a zero-build interactive exploration of mythological connections across ancient traditions.

The central experience is not an encyclopedia page or a pre-rendered knowledge graph. The network begins small. You choose a deity or an archetype, follow a mystery clue, reveal another figure, and gradually build a persistent map of the paths you decided to investigate.

Live site: https://sahilbh01r1769.github.io/indo_european_gods/

## What the project is trying to do

Comparative mythology becomes more interesting when the visitor can discover the pattern rather than being handed a wall of matches.

A typical journey might begin with **Thor**, reveal a storm-warrior clue leading to **Indra**, continue toward **Perun**, and later expose a completely different kind of connection such as the linguistic relationship between **Zeus** and **Dyaus**.

The interface deliberately distinguishes these relationships. A structural parallel is not presented as linguistic descent, and a model-generated thematic echo is not presented as historical evidence.

## Main experience

### Discover

The primary view is a persistent D3 network.

- Start with a deity or an archetype.
- Selected figures expose a small number of mystery clues rather than every possible neighbour.
- Revealing a clue adds the deity and connection to the current journey.
- Previous discoveries remain visible, so the graph becomes a record of the visitor's curiosity.
- The same discovered network can be viewed in **Network**, **Time**, or **Geography** mode.
- A journey panel tracks discovered figures and recent threads.
- A context panel explains the currently selected figure, clue, or relationship.

### Stories

Guided stories provide approachable entry points such as:

- The Thunderer and the Serpent
- The Archer Who Heals
- Names of the Daylight Sky
- Guides Beyond the Last Boundary
- Fire That Carries a Message

Story steps reveal directly into the same persistent graph. At any point the visitor can stop following the curated route and explore freely.

### Collection

The collection is the reference layer rather than the centre of the product.

It supports:

- deity search
- tradition filtering
- dossier overlays
- archetype entry points
- revealing a chosen figure into the current graph

### Comparison

Two or three discovered figures can be compared without leaving the exploration.

Evidence type and qualitative interpretation are shown first. Numeric model overlap is deliberately secondary because the percentage represents overlap in manually curated trait weights — not historical confidence, ancestry probability, or scholarly consensus.

## Evidence hierarchy

Mythos uses separate relationship categories:

1. **Linguistic inheritance** — historical linguistic or inherited divine-name evidence.
2. **Historical contact / fusion** — documented identification, reinterpretation, transmission, or contact.
3. **Structural comparison** — strong resemblance in mythic role, narrative structure, or ritual function.
4. **Cross-cultural parallel** — a useful comparison without a claim of shared origin.
5. **Speculative curiosity** — a deliberately cautious, loose comparison.
6. **Model-only thematic echo** — a connection suggested only by the curated trait model.

This hierarchy is part of the interface, not merely a methodology note.

## Visual direction

The v3 interface uses a **Luminous Salon** design system:

- warm ivory, parchment, pale stone, smoke blue, graphite, and soft brass form the quiet interface shell;
- deity medallions and newly revealed nodes provide occasional jewel-toned accents;
- typography and spacing carry most of the visual hierarchy;
- motion is reserved for reveal, focus, and continuity rather than game-like effects.

The intent is a refined digital exhibit that still feels magical because of what the user uncovers, not because the interface behaves like a fantasy game HUD.

## Dataset

The current dataset contains **67 deities**, **16 canonical trait dimensions**, and **9 traditions**.

The principal Indo-European traditions represented include Greek, Vedic, Roman, Norse, Celtic, Slavic, and Iranian material. Egyptian and Mesopotamian figures are included as comparative outgroups; their inclusion does not imply that those traditions are Indo-European.

Trait values are curated heuristic weights used for exploration. They are not measurements reported by the cited scholars.

The reusable data and similarity layers remain under `src/data/` and `src/utils/`.

## Project structure

```text
index.html
package.json

src/
  data/
    deities.js              # deity records + trait metadata
    cognates.js             # curated relationship evidence
    citations.js            # bibliography and references
    tours.js                # retained historical tour data

  utils/
    similarity.js           # canonical similarity calculations

  v3/
    config.js               # starts, archetypes, stories, evidence metadata
    model.js                # discovery candidates, relationship model, search, compare
    state.js                # persistent journey state
    graph.js                # Network / Time / Geography renderer
    app.js                  # Discover, Stories, Collection, overlays and routing

styles/
  v3.css                    # Luminous Salon design system
  v3-refinement.css         # final restrained jewel-accent treatment

tests/
  similarity.test.js
  v3.test.js

scripts/
  validate-data.js
```

## Running locally

The application is framework-free and does not require a build step. Because it uses ES modules, serve the repository over HTTP:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

D3 is loaded from a CDN by `index.html`.

## Validation

Run the complete data and interaction test suite with:

```bash
npm run check
```

The validation suite currently checks the dataset, core similarity behaviour, evidence categorisation, mystery connection generation, persistent graph growth, archetype membership, guided-story reveals, and comparison output. GitHub Actions also performs syntax checks on every v3 module.

## Sources and interpretation

The project draws on comparative mythology, Indo-European studies, and tradition-specific sources. Bibliographic material and per-deity references are retained in `src/data/citations.js`.

Mythos is an exploratory hobby project. It is designed to make relationships inspectable and interesting while keeping the difference between historical evidence and comparative resemblance visible to the visitor.

## Branches

- `master` — live GitHub Pages deployment.
- `v3/luminous-discovery` — current interactive discovery source branch.
- `legacy/museum-atlas-v1` — frozen historical version.

The earlier v2 museum-style interface is obsolete after the v3 rebuild.
