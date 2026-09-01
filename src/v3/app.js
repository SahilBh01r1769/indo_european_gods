import {
  START_DEITIES,
  ARCHETYPES,
  STORIES,
  STARTING_COPY,
  RELATION_META,
} from "./config.js";
import {
  DEITIES,
  deityAccent,
  deityGlyph,
  eraLabel,
  getDeity,
  compareDeities,
  emergentArchetypes,
  getStory,
  searchMythos,
  relationBetween,
} from "./model.js";
import {
  getState,
  subscribe,
  startWithDeity,
  startWithArchetype,
  beginStory,
  revealStoryNext,
  availableClues,
  revealClue,
  addToJourney,
  selectNode,
  selectEdge,
  setMode,
  setEra,
  toggleCompare,
  clearCompare,
  resetJourney,
  leaveStory,
  encodeJourney,
  restoreJourney,
} from "./state.js";
import { MythGraph } from "./graph.js";
import { getDeityRefs } from "../data/citations.js";

const app = document.querySelector("#app");
let currentView = null,
  graph = null,
  toastTimer = null,
  previousFocus = null,
  restoredPayload = null;
const esc = (v) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const iconLabel = (deity) =>
  `<span class="deity-medallion" style="--accent:${deityAccent(deity)}"><span>${esc(deityGlyph(deity))}</span></span>`;
const evidenceLegend = ({ compact = false } = {}) =>
  `<div class="evidence-legend ${compact ? "compact" : ""}" aria-label="Relationship evidence legend">${Object.entries(
    RELATION_META,
  )
    .map(
      ([kind, meta]) =>
        `<span><i class="legend-line edge-kind-${kind}" aria-hidden="true"></i>${esc(meta.short)}</span>`,
    )
    .join("")}</div>`;
function parseRoute() {
  const raw = location.hash.replace(/^#/, "") || "home";
  const [path, query = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  return { view: parts[0] || "home", parts, query: new URLSearchParams(query) };
}
function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}
function toast(message) {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
}

function shell() {
  app.innerHTML = `<a class="skip-link" href="#view">Skip to content</a><div class="site-shell"><header class="topbar"><a class="brand" href="#home" aria-label="Mythos home"><span class="brand-mark" aria-hidden="true">✦</span><span>MYTHOS</span></a><nav class="main-nav" aria-label="Primary navigation"><a href="#home" data-nav="home">Home</a><a href="#discover" data-nav="discover">Discover</a><a href="#stories" data-nav="stories">Stories</a><a href="#collection" data-nav="collection">Collection</a></nav><div class="topbar-actions"><div class="search-wrap"><button class="icon-button search-toggle" aria-label="Search">⌕</button><div class="global-search-panel" hidden><input id="global-search" type="search" autocomplete="off" placeholder="Search gods, traditions, symbols…" aria-label="Search Mythos"><div id="global-search-results" class="global-search-results"></div></div></div><button class="text-button about-button">Methodology</button></div></header><main id="view" class="view" tabindex="-1"></main><nav class="mobile-nav" aria-label="Mobile navigation"><a href="#home" data-mobile-nav="home">Home</a><a href="#discover" data-mobile-nav="discover">Discover</a><a href="#stories" data-mobile-nav="stories">Stories</a><a href="#collection" data-mobile-nav="collection">Collection</a></nav></div><div id="overlay-root"></div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
  bindShell();
}
function bindShell() {
  const toggle = document.querySelector(".search-toggle"),
    panel = document.querySelector(".global-search-panel"),
    input = document.querySelector("#global-search");
  toggle?.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) setTimeout(() => input.focus(), 20);
  });
  input?.addEventListener("input", () => renderSearchResults(input.value));
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") panel.hidden = true;
  });
  document.querySelector(".about-button")?.addEventListener("click", openAbout);
}
function closeSearch() {
  const panel = document.querySelector(".global-search-panel");
  if (panel) panel.hidden = true;
}
function setActiveNav(name) {
  document
    .querySelectorAll("[data-nav], [data-mobile-nav]")
    .forEach((a) =>
      a.classList.toggle(
        "active",
        (a.dataset.nav || a.dataset.mobileNav) === name,
      ),
    );
}

function renderSearchResults(query) {
  const root = document.querySelector("#global-search-results");
  if (!root) return;
  const hits = searchMythos(query);
  if (!query.trim()) {
    root.innerHTML =
      '<p class="search-prompt">Try a deity, tradition, symbol or theme.</p>';
    return;
  }
  if (!hits.length) {
    root.innerHTML = `<div class="empty-inline"><strong>No match for “${esc(query)}”</strong><span>Try thunder, underworld, healing, fire or a tradition name.</span></div>`;
    return;
  }
  root.innerHTML = hits
    .map((hit) => {
      if (hit.type === "deity")
        return `<button class="search-hit" data-search-deity="${esc(hit.deity.id)}">${iconLabel(hit.deity)}<span><strong>${esc(hit.deity.id)}</strong><small>${esc(hit.deity.pantheon)} · ${esc(hit.deity.epithet)}</small></span></button>`;
      if (hit.type === "archetype")
        return `<button class="search-hit archetype-hit" data-search-archetype="${hit.archetype.id}"><span class="search-symbol">◇</span><span><strong>${esc(hit.archetype.name)}</strong><small>${esc(hit.archetype.short)}</small></span></button>`;
      return `<button class="search-hit story-hit" data-search-story="${hit.story.id}"><span class="search-symbol">✦</span><span><strong>${esc(hit.story.title)}</strong><small>${esc(hit.story.deck)}</small></span></button>`;
    })
    .join("");
  root.querySelectorAll("[data-search-deity]").forEach((btn) =>
    btn.addEventListener("click", () => {
      closeSearch();
      openDossier(btn.dataset.searchDeity);
    }),
  );
  root.querySelectorAll("[data-search-archetype]").forEach((btn) =>
    btn.addEventListener("click", () => {
      closeSearch();
      startWithArchetype(btn.dataset.searchArchetype);
      go("#discover");
    }),
  );
  root.querySelectorAll("[data-search-story]").forEach((btn) =>
    btn.addEventListener("click", () => {
      closeSearch();
      go(`#story/${btn.dataset.searchStory}`);
    }),
  );
}

function route() {
  closeOverlay();
  const { view, parts, query } = parseRoute();
  const sharedJourney = query.get("journey");
  if (sharedJourney && sharedJourney !== restoredPayload) {
    restoredPayload = sharedJourney;
    if (!restoreJourney(sharedJourney))
      toast("This shared journey could not be restored");
  }
  currentView = view;
  graph?.destroy();
  graph = null;
  if (view === "home") renderHome();
  else if (view === "stories") renderStories();
  else if (view === "story") renderStory(parts[1]);
  else if (view === "collection") renderCollection();
  else if (view === "deity") {
    renderDiscover();
    openDossier(decodeURIComponent(parts.slice(1).join("/")));
  } else if (view === "compare") {
    renderDiscover();
    openCompare(parts.slice(1).map(decodeURIComponent));
  } else renderDiscover();
}

function renderHome() {
  setActiveNav("home");
  renderLanding(document.querySelector("#view"), { home: true });
}

function renderDiscover() {
  setActiveNav("discover");
  const view = document.querySelector("#view"),
    state = getState();
  if (!state.started) return renderLanding(view);
  view.innerHTML = `<section class="discover-shell"><aside class="journey-panel" aria-label="Your journey"></aside><section class="graph-column"><div class="graph-heading-row"><div><span class="eyebrow">Your mythology journey</span><h1>Follow the thread</h1></div><div class="graph-heading-actions"><button class="quiet-button journey-toggle" aria-expanded="false">Journey</button><button class="quiet-button fit-graph">Fit view</button></div></div>${evidenceLegend({ compact: true })}<div id="graph-stage" class="graph-stage"></div><div class="modebar"></div></section><aside class="context-panel" aria-label="Selected mythology context"></aside></section>`;
  graph = new MythGraph(document.querySelector("#graph-stage"), {
    onNode: (id) => selectNode(id),
    onEdge: (id) => selectEdge(id),
    onReveal: (clue) => {
      const result = revealClue(clue);
      if (result?.newlyDiscovered) toast(`${result.deity.id} revealed`);
    },
  });
  document
    .querySelector(".fit-graph")
    ?.addEventListener("click", () => graph.fit());
  document
    .querySelector(".journey-toggle")
    ?.addEventListener("click", (event) => {
      const panel = document.querySelector(".journey-panel");
      const isOpen = panel.classList.toggle("mobile-open");
      event.currentTarget.setAttribute("aria-expanded", String(isOpen));
    });
  updateDiscover(state);
}

function renderLanding(view, { home = false } = {}) {
  const featured = START_DEITIES.map(getDeity).filter(Boolean);
  const visibleDeities = home ? featured.slice(0, 4) : featured;
  const visibleArchetypes = home ? ARCHETYPES.slice(0, 3) : ARCHETYPES;
  const previewNodes = ["Thor", "Indra", "Perun", "Zeus"]
    .map(getDeity)
    .filter(Boolean);
  const state = getState();

  view.innerHTML = `<section class="landing ${home ? "home-landing" : "discover-landing"}"><div class="landing-hero"><div class="hero-copy"><span class="eyebrow">Interactive comparative mythology</span><h1>${home ? "Follow the evidence. Find the pattern." : STARTING_COPY.heading}</h1><p>${home ? "Build a path through gods, names and recurring stories. Mythos keeps historical evidence distinct from resemblance, so every connection can be examined—not merely admired." : STARTING_COPY.lead}</p><div class="hero-actions">${state.started ? '<a class="primary-button resume-journey" href="#discover">Resume your journey</a>' : '<button class="primary-button surprise-start">Surprise me</button>'}<a class="quiet-link" href="#stories">Take a guided story</a></div><div class="hero-proof"><span>67 figures</span><span>9 traditions</span><span>6 evidence levels</span></div></div><div class="hero-map" aria-label="Preview of an evidence-aware mythology network"><svg class="hero-map-lines" viewBox="0 0 560 360" aria-hidden="true"><path class="preview-link linguistic" d="M118 182 C215 92 335 82 444 166"/><path class="preview-link structural" d="M118 182 C210 245 318 258 444 166"/><path class="preview-link comparative" d="M280 56 C310 120 318 225 280 304"/><path class="preview-link model" d="M118 182 C220 164 350 175 444 166"/></svg>${previewNodes.map((deity, index) => `<div class="preview-node preview-node-${index + 1}" style="--accent:${deityAccent(deity)}">${iconLabel(deity)}<strong>${esc(deity.id)}</strong><small>${esc(deity.pantheon)}</small></div>`).join("")}<div class="preview-question" aria-hidden="true">?</div>${evidenceLegend({ compact: true })}</div></div><section class="start-section"><div class="section-heading"><span>Begin with a deity</span><small>Choose a figure you recognise—or one you don’t.</small></div><div class="deity-start-grid">${visibleDeities.map((deity) => `<button class="start-deity-card" data-start-deity="${esc(deity.id)}" style="--accent:${deityAccent(deity)}">${iconLabel(deity)}<span class="card-tradition">${esc(deity.pantheon)}</span><strong>${esc(deity.id)}</strong><span>${esc(deity.domains?.slice(0, 3).join(" · ") || deity.pantheon)}</span></button>`).join("")}</div>${home ? '<a class="section-link" href="#discover">See all starting figures →</a>' : ""}</section><section class="start-section archetype-start-section"><div class="section-heading"><span>Or follow a recurring pattern</span><small>Begin with an idea and uncover the figures inside it.</small></div><div class="archetype-start-grid">${visibleArchetypes.map((a, i) => `<button class="start-archetype-card" data-start-archetype="${a.id}"><span class="pattern-number">0${i + 1}</span><span class="pattern-mark" aria-hidden="true">◇</span><strong>${esc(a.name)}</strong><span>${esc(a.short)}</span><small>Explore pattern →</small></button>`).join("")}</div>${home ? '<a class="section-link" href="#discover">Browse all patterns →</a>' : ""}</section></section>`;
  view.querySelectorAll("[data-start-deity]").forEach((btn) =>
    btn.addEventListener("click", () => {
      startWithDeity(btn.dataset.startDeity);
      go("#discover");
    }),
  );
  view.querySelectorAll("[data-start-archetype]").forEach((btn) =>
    btn.addEventListener("click", () => {
      startWithArchetype(btn.dataset.startArchetype);
      go("#discover");
    }),
  );
  view.querySelector(".surprise-start")?.addEventListener("click", () => {
    const deity = featured[Math.floor(Math.random() * featured.length)];
    startWithDeity(deity.id);
    go("#discover");
  });
}

function updateDiscover(state) {
  if (
    !["discover", "deity", "compare"].includes(currentView) ||
    !state.started ||
    !document.querySelector(".discover-shell")
  )
    return;
  renderJourneyPanel(state);
  renderContextPanel(state);
  renderModebar(state);
  graph?.render(state);
}
function renderJourneyPanel(state) {
  const root = document.querySelector(".journey-panel");
  if (!root) return;
  const emergent = emergentArchetypes(state.discoveredNodes),
    recentEdges = state.discoveredEdges.slice(-3).reverse();
  root.innerHTML = `<div class="panel-kicker">Your journey</div><div class="journey-count"><strong>${state.discoveredNodes.length}</strong><span>figures uncovered</span></div><div class="journey-list">${state.discoveredNodes
    .map((id) => {
      const deity = getDeity(id);
      return `<button data-journey-node="${esc(id)}" class="journey-person ${state.selectedNode === id ? "active" : ""}"><span class="journey-dot" style="--accent:${deityAccent(deity)}"></span><span><strong>${esc(id)}</strong><small>${esc(deity?.pantheon || "")}</small></span></button>`;
    })
    .join(
      "",
    )}</div>${recentEdges.length ? `<div class="journey-subsection"><span>Recent threads</span>${recentEdges.map((edge) => `<button data-journey-edge="${esc(edge.id)}"><small>${esc(edge.label)}</small><strong>${esc(edge.source)} ↔ ${esc(edge.target)}</strong></button>`).join("")}</div>` : ""}${emergent.length ? `<div class="pattern-found"><span>Pattern emerging</span><strong>${esc(emergent[0].archetype.name)}</strong><small>${emergent[0].members.map((x) => x.deity.id).join(" · ")}</small></div>` : ""}<div class="journey-actions"><button class="quiet-button share-journey">Share journey</button><button class="text-button reset-journey">Start over</button></div>`;
  root
    .querySelectorAll("[data-journey-node]")
    .forEach((btn) =>
      btn.addEventListener("click", () => selectNode(btn.dataset.journeyNode)),
    );
  root
    .querySelectorAll("[data-journey-edge]")
    .forEach((btn) =>
      btn.addEventListener("click", () => selectEdge(btn.dataset.journeyEdge)),
    );
  root.querySelector(".reset-journey")?.addEventListener("click", () => {
    if (
      confirm(
        "Start a new journey? Your current discovered graph will be cleared.",
      )
    )
      resetJourney();
  });
  root.querySelector(".share-journey")?.addEventListener("click", async () => {
    const encoded = encodeJourney();
    const shareUrl = `${location.origin}${location.pathname}#discover?journey=${encoded}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Shareable journey link copied");
    } catch {
      toast("Copy the journey URL from your address bar");
    }
  });
}
function relationCallout(edge, { recent = false } = {}) {
  if (!edge) return "";
  return `<div class="new-thread ${recent ? "is-reveal" : ""}">${recent ? '<span class="reveal-kicker">New discovery</span>' : ""}<span class="evidence-badge evidence-${edge.kind}">${esc(edge.label)}</span><h3>${esc(edge.source)} <span>↔</span> ${esc(edge.target)}</h3><p>${esc(edge.note || edge.description)}</p>${edge.sourceText ? `<small>Source: ${esc(edge.sourceText)}</small>` : ""}</div>`;
}
function renderContextPanel(state) {
  const root = document.querySelector(".context-panel");
  if (!root) return;
  const deity = getDeity(state.selectedNode);
  if (!deity) {
    root.innerHTML =
      '<div class="empty-inline">Select a discovered figure.</div>';
    return;
  }
  const clues = availableClues(deity.id),
    selectedEdge = state.discoveredEdges.find(
      (edge) => edge.id === state.selectedEdge,
    ),
    story = state.activeStory ? getStory(state.activeStory.id) : null,
    storyIndex = state.activeStory?.index ?? 0;
  const isRecentReveal = Boolean(
    selectedEdge && state.lastReveal?.edgeId === selectedEdge.id,
  );
  root.innerHTML = `<div class="context-scroll">${selectedEdge ? relationCallout(selectedEdge, { recent: isRecentReveal }) : ""}${story ? `<div class="story-coach"><span class="eyebrow">Guided story · ${storyIndex + 1}/${story.path.length}</span><h3>${esc(story.title)}</h3><p>${esc(story.chapters[storyIndex])}</p>${storyIndex < story.path.length - 1 ? '<button class="primary-button story-next">Reveal next chapter</button>' : '<strong class="story-complete">Story path complete. Keep exploring freely.</strong>'}<button class="text-button leave-story">Leave guided story</button></div>` : ""}<div class="context-identity">${iconLabel(deity)}<div><span class="eyebrow">${esc(deity.pantheon)} · ${esc(eraLabel(deity.era))}</span><h2>${esc(deity.id)}</h2><p class="original-script">${esc(deity.originalScript || "")}</p></div></div><p class="context-epithet">${esc(deity.epithet || "")}</p><div class="context-actions"><button class="quiet-button dossier-open">Open dossier</button><button class="quiet-button compare-toggle">${state.compare.includes(deity.id) ? "Remove from compare" : "Add to compare"}</button></div><div class="context-section"><span class="panel-kicker">Available clues</span>${clues.length ? `<div class="clue-list">${clues.map((clue, i) => `<button class="clue-button" data-clue-index="${i}"><span class="clue-mark">?</span><span><strong>${esc(clue.label)}</strong><small>${esc(clue.hint)}</small></span><span class="clue-arrow">→</span></button>`).join("")}</div>` : `<div class="empty-inline compact"><strong>This branch is quiet.</strong><span>Choose another discovered figure to continue.</span></div>`}</div><div class="context-section"><span class="panel-kicker">Domains</span><div class="chip-row">${(
    deity.domains || []
  )
    .slice(0, 6)
    .map((x) => `<span>${esc(x)}</span>`)
    .join("")}</div></div></div>`;
  root
    .querySelector(".dossier-open")
    ?.addEventListener("click", () => openDossier(deity.id));
  root
    .querySelector(".compare-toggle")
    ?.addEventListener("click", () => toggleCompare(deity.id));
  root.querySelectorAll("[data-clue-index]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const result = revealClue(clues[Number(btn.dataset.clueIndex)]);
      if (result) toast(`${result.deity.id} revealed`);
    }),
  );
  root.querySelector(".story-next")?.addEventListener("click", () => {
    const target = revealStoryNext();
    if (target) toast(`${target} revealed`);
  });
  root.querySelector(".leave-story")?.addEventListener("click", leaveStory);
}
function renderModebar(state) {
  const root = document.querySelector(".modebar");
  if (!root) return;
  const compare = state.compare.map(getDeity).filter(Boolean);
  root.innerHTML = `<div class="mode-switch" role="group" aria-label="Graph view">${["network", "time", "geography"].map((mode) => `<button data-mode="${mode}" class="${state.mode === mode ? "active" : ""}">${mode[0].toUpperCase() + mode.slice(1)}</button>`).join("")}</div>${state.mode === "time" ? `<label class="era-control"><span>${esc(eraLabel(state.era))}</span><input type="range" min="-2200" max="1400" step="100" value="${state.era}" aria-label="Historical horizon"></label>` : '<span class="mode-note">The same discoveries, viewed differently.</span>'}<div class="compare-tray"><span>Compare</span><div class="compare-chips">${compare.map((d) => `<button data-remove-compare="${esc(d.id)}" style="--accent:${deityAccent(d)}">${esc(d.id)} ×</button>`).join("") || "<small>Select up to three figures</small>"}</div>${compare.length >= 2 ? `<button class="primary-button compare-now">Compare ${compare.length}</button>` : ""}</div>`;
  root
    .querySelectorAll("[data-mode]")
    .forEach((btn) =>
      btn.addEventListener("click", () => setMode(btn.dataset.mode)),
    );
  root
    .querySelector(".era-control input")
    ?.addEventListener("input", (e) => setEra(e.target.value));
  root
    .querySelectorAll("[data-remove-compare]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        toggleCompare(btn.dataset.removeCompare),
      ),
    );
  root
    .querySelector(".compare-now")
    ?.addEventListener("click", () => openCompare(state.compare));
}

function renderStories() {
  setActiveNav("stories");
  const view = document.querySelector("#view");
  view.innerHTML = `<section class="page-shell stories-page"><header class="page-intro"><span class="eyebrow">Curated journeys</span><h1>Stories that open into the network.</h1><p>Each story gives you a clear thread to follow, then lets you leave the path whenever curiosity pulls elsewhere.</p></header><div class="story-grid">${STORIES.map((story, i) => `<article class="story-card"><span class="story-index">0${i + 1}</span><div class="story-thread">${story.path.map((id, j) => `<span style="--accent:${deityAccent(getDeity(id))}">${j ? "—" : ""}●</span>`).join("")}</div><h2>${esc(story.title)}</h2><p>${esc(story.deck)}</p><small>${story.path.join(" → ")}</small><div class="card-actions"><button class="primary-button" data-begin-story="${story.id}">Begin journey</button><button class="text-button" data-read-story="${story.id}">Preview</button></div></article>`).join("")}</div></section>`;
  view.querySelectorAll("[data-begin-story]").forEach((btn) =>
    btn.addEventListener("click", () => {
      beginStory(btn.dataset.beginStory);
      go("#discover");
    }),
  );
  view
    .querySelectorAll("[data-read-story]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        go(`#story/${btn.dataset.readStory}`),
      ),
    );
}
function renderStory(id) {
  setActiveNav("stories");
  const story = getStory(id),
    view = document.querySelector("#view");
  if (!story) {
    view.innerHTML =
      '<section class="page-shell"><div class="empty-inline"><strong>Story not found.</strong><a href="#stories">Return to stories</a></div></section>';
    return;
  }
  view.innerHTML = `<section class="story-detail page-shell"><a class="back-link" href="#stories">← All stories</a><div class="story-detail-grid"><div class="story-detail-copy"><span class="eyebrow">Guided journey · ${story.path.length} stops</span><h1>${esc(story.title)}</h1><p class="story-deck">${esc(story.deck)}</p><button class="primary-button begin-detail-story">Begin interactive journey</button></div><div class="story-path-preview">${story.path
    .map((id, i) => {
      const d = getDeity(id);
      return `<div class="story-stop"><span class="stop-number">0${i + 1}</span>${iconLabel(d)}<div><strong>${esc(id)}</strong><small>${esc(d?.pantheon || "")}</small><p>${esc(story.chapters[i] || "")}</p></div></div>`;
    })
    .join("")}</div></div></section>`;
  view.querySelector(".begin-detail-story")?.addEventListener("click", () => {
    beginStory(story.id);
    go("#discover");
  });
}

function renderCollection() {
  setActiveNav("collection");
  const view = document.querySelector("#view"),
    pantheons = [...new Set(DEITIES.map((d) => d.pantheon))].sort();
  view.innerHTML = `<section class="page-shell collection-page"><header class="page-intro"><span class="eyebrow">Collection</span><h1>Browse the figures behind the threads.</h1><p>Use the collection when you already know what you want—or when you want to choose the next branch deliberately.</p></header><div class="collection-toolbar"><label><span class="sr-only">Search the collection</span><input id="collection-search" type="search" placeholder="Search deity, domain, symbol…"></label><label><span class="sr-only">Filter by tradition</span><select id="collection-pantheon"><option value="">All traditions</option>${pantheons.map((p) => `<option>${esc(p)}</option>`).join("")}</select></label><label><span class="sr-only">Sort collection</span><select id="collection-sort"><option value="tradition">Tradition order</option><option value="name">Name A–Z</option><option value="era">Earliest attestation</option></select></label></div><div class="collection-summary"><strong id="collection-count"></strong><span>Figures outside the Indo-European family are comparative outgroups and are labelled by tradition.</span></div><div id="collection-grid" class="collection-grid"></div><section class="collection-patterns"><div class="section-heading"><span>Patterns</span><small>Start an exploration from an archetype.</small></div><div class="archetype-collection-grid">${ARCHETYPES.map((a) => `<button data-collection-archetype="${a.id}"><span aria-hidden="true">◇</span><strong>${esc(a.name)}</strong><small>${esc(a.short)}</small></button>`).join("")}</div></section></section>`;
  const search = view.querySelector("#collection-search"),
    pantheon = view.querySelector("#collection-pantheon"),
    sort = view.querySelector("#collection-sort"),
    draw = () => renderCollectionGrid(search.value, pantheon.value, sort.value);
  search.addEventListener("input", draw);
  pantheon.addEventListener("change", draw);
  sort.addEventListener("change", draw);
  draw();
  view.querySelectorAll("[data-collection-archetype]").forEach((btn) =>
    btn.addEventListener("click", () => {
      startWithArchetype(btn.dataset.collectionArchetype);
      go("#discover");
    }),
  );
}
function renderCollectionGrid(query = "", pantheon = "", sort = "tradition") {
  const root = document.querySelector("#collection-grid");
  if (!root) return;
  const q = query.trim().toLowerCase(),
    rows = DEITIES.filter((d) => !pantheon || d.pantheon === pantheon).filter(
      (d) =>
        !q ||
        [
          d.id,
          d.epithet,
          d.pantheon,
          ...(d.domains || []),
          ...(d.symbols || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
    );
  if (sort === "name") rows.sort((a, b) => a.id.localeCompare(b.id));
  if (sort === "era") rows.sort((a, b) => a.era - b.era);
  const count = document.querySelector("#collection-count");
  if (count)
    count.textContent = `${rows.length} ${rows.length === 1 ? "figure" : "figures"}`;
  root.innerHTML = rows.length
    ? rows
        .map(
          (deity) =>
            `<article class="collection-card" style="--accent:${deityAccent(deity)}">${iconLabel(deity)}<span class="eyebrow">${esc(deity.pantheon)} · ${esc(eraLabel(deity.era))}</span><h3>${esc(deity.id)}</h3><p>${esc(deity.epithet)}</p><div class="chip-row">${(
              deity.domains || []
            )
              .slice(0, 3)
              .map((d) => `<span>${esc(d)}</span>`)
              .join(
                "",
              )}</div><div class="card-actions"><button class="quiet-button" data-collection-dossier="${esc(deity.id)}">Dossier</button><button class="text-button" data-collection-reveal="${esc(deity.id)}">Reveal in graph</button></div></article>`,
        )
        .join("")
    : '<div class="empty-inline"><strong>No figures match.</strong><span>Try a broader search or another tradition.</span></div>';
  root
    .querySelectorAll("[data-collection-dossier]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        openDossier(btn.dataset.collectionDossier),
      ),
    );
  root.querySelectorAll("[data-collection-reveal]").forEach((btn) =>
    btn.addEventListener("click", () => {
      addToJourney(btn.dataset.collectionReveal);
      go("#discover");
    }),
  );
}

function openDossier(id) {
  const deity = getDeity(id);
  if (!deity) return;
  const state = getState(),
    relationships = DEITIES.filter((d) => d.id !== deity.id)
      .map((d) => relationBetween(deity, d))
      .filter((r) => r?.curated)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    topTraits = Object.entries(deity.traits || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6),
    references = getDeityRefs(deity.id);
  openOverlay(
    `<div class="dossier-overlay overlay-card"><button class="overlay-close" aria-label="Close">×</button><div class="dossier-head">${iconLabel(deity)}<div><span class="eyebrow">${esc(deity.pantheon)} · ${esc(eraLabel(deity.era))}</span><h2>${esc(deity.id)}</h2><p class="original-script">${esc(deity.originalScript || "")}</p><strong>${esc(deity.epithet)}</strong></div></div><p class="dossier-desc">${esc(deity.desc)}</p><div class="dossier-columns"><section><span class="panel-kicker">Dominant traits</span>${topTraits.map(([trait, value]) => `<div class="trait-row"><span>${esc(trait)}</span><span class="trait-bar"><i style="width:${Math.round(value * 100)}%"></i></span></div>`).join("")}</section><section><span class="panel-kicker">Symbols</span><div class="plain-list">${(deity.symbols || []).map((s) => `<span>${esc(s)}</span>`).join("")}</div><span class="panel-kicker">Domains</span><div class="chip-row">${(deity.domains || []).map((s) => `<span>${esc(s)}</span>`).join("")}</div></section></div><section class="dossier-connections"><span class="panel-kicker">Curated threads</span>${relationships.map((r) => `<div class="dossier-thread"><span class="evidence-badge evidence-${r.kind}">${esc(r.label)}</span><strong>${esc(r.source === deity.id ? r.target : r.source)}</strong><p>${esc(r.note || r.description)}</p>${r.sourceText ? `<small>${esc(r.sourceText)}</small>` : ""}</div>`).join("") || "<p>No curated threads are currently listed for this figure.</p>"}</section>${references.length ? `<section class="dossier-sources"><span class="panel-kicker">Sources for this dossier</span><ol>${references.map((reference) => `<li><cite>${esc(reference.bib.author)} (${esc(reference.bib.year)}), <em>${esc(reference.bib.title)}</em></cite><span>${esc(reference.pages)} — ${esc(reference.note)}</span></li>`).join("")}</ol></section>` : '<section class="source-caution"><strong>Source review pending</strong><p>This entry currently has no linked per-deity bibliography. Treat its summary as an editorial overview rather than a cited research note.</p></section>'}<div class="overlay-actions"><button class="primary-button reveal-dossier">${state.started ? "Reveal in your graph" : "Begin here"}</button><button class="quiet-button compare-dossier">${state.compare.includes(deity.id) ? "Remove from compare" : "Add to compare"}</button></div></div>`,
  );
  document.querySelector(".reveal-dossier")?.addEventListener("click", () => {
    addToJourney(deity.id);
    closeOverlay();
    go("#discover");
  });
  document.querySelector(".compare-dossier")?.addEventListener("click", () => {
    toggleCompare(deity.id);
    toast(`${deity.id} compare selection updated`);
  });
}
function openCompare(ids = getState().compare) {
  const data = compareDeities(ids);
  if (data.deities.length < 2) {
    toast("Select at least two figures");
    return;
  }
  openOverlay(
    `<div class="compare-overlay overlay-card wide"><button class="overlay-close" aria-label="Close">×</button><div class="compare-title"><span class="eyebrow">Comparison</span><h2>${data.deities.map((d) => esc(d.id)).join(" · ")}</h2><p>Evidence labels are primary. Model overlap is shown only as a secondary thematic aid.</p></div><div class="compare-heads">${data.deities.map((d) => `<div>${iconLabel(d)}<strong>${esc(d.id)}</strong><small>${esc(d.pantheon)}</small></div>`).join("")}</div><div class="pair-evidence">${data.pairs.map((pair) => `<article><span class="evidence-badge evidence-${pair.kind}">${esc(pair.label)}</span><h3>${esc(pair.source)} ↔ ${esc(pair.target)}</h3><strong>${esc(pair.fit)}</strong><small>${Math.round(pair.score * 100)}% model overlap</small><p>${esc(pair.note || pair.description)}</p></article>`).join("")}</div><div class="compare-traits"><span class="panel-kicker">Trait profiles</span>${data.traitRows
      .slice(0, 10)
      .map(
        (row) =>
          `<div class="compare-trait-row"><strong>${esc(row.trait)}</strong>${row.values.map((value, i) => `<span title="${esc(data.deities[i].id)}"><i style="width:${Math.round(value * 100)}%"></i></span>`).join("")}</div>`,
      )
      .join(
        "",
      )}</div><div class="overlay-actions"><button class="primary-button add-all-graph">Add all to journey</button><button class="text-button clear-compare">Clear compare</button></div></div>`,
  );
  document.querySelector(".add-all-graph")?.addEventListener("click", () => {
    data.deities.forEach((d, i) =>
      addToJourney(d.id, i ? data.deities[i - 1].id : undefined),
    );
    closeOverlay();
    go("#discover");
  });
  document.querySelector(".clear-compare")?.addEventListener("click", () => {
    clearCompare();
    closeOverlay();
  });
}
function openAbout() {
  openOverlay(
    `<div class="about-overlay overlay-card wide"><button class="overlay-close" aria-label="Close">×</button><span class="eyebrow">How to read Mythos</span><h2>Not every line means the same thing.</h2><p class="about-lead">Mythos is a hobby project for exploring comparative mythology. It separates historical evidence from structural resemblance so curiosity does not masquerade as certainty.</p><div class="evidence-grid">${Object.entries(
      RELATION_META,
    )
      .map(
        ([kind, meta]) =>
          `<article><span class="evidence-badge evidence-${kind}">${esc(meta.label)}</span><p>${esc(meta.description)}</p></article>`,
      )
      .join(
        "",
      )}</div><div class="method-note"><strong>About model overlap</strong><p>The percentage shown in comparisons is overlap in manually curated trait weights. It is not ancestry probability, historical confidence or scholarly consensus.</p></div></div>`,
  );
}
function openOverlay(html) {
  const root = document.querySelector("#overlay-root");
  previousFocus = document.activeElement;
  root.innerHTML = `<div class="overlay-backdrop"><div class="overlay-frame" role="dialog" aria-modal="true" aria-label="Mythos detail panel">${html}</div></div>`;
  document.body.classList.add("overlay-open");
  root.querySelector(".overlay-close")?.addEventListener("click", closeOverlay);
  root
    .querySelector(".overlay-backdrop")
    ?.addEventListener("click", (event) => {
      if (event.target.classList.contains("overlay-backdrop")) closeOverlay();
    });
  root.querySelector(".overlay-close")?.focus();
}
function closeOverlay() {
  const root = document.querySelector("#overlay-root");
  const hadOverlay = Boolean(root?.children.length);
  if (root) root.innerHTML = "";
  document.body.classList.remove("overlay-open");
  if (hadOverlay && previousFocus instanceof HTMLElement) previousFocus.focus();
  previousFocus = null;
}
window.addEventListener("hashchange", route);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeOverlay();
  if (event.key !== "Tab") return;
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return;
  const focusable = [
    ...dialog.querySelectorAll(
      'button, a[href], input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => !element.hidden && !element.hasAttribute("disabled"));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
shell();
subscribe((state) => {
  if (currentView === "discover") {
    if (state.started && !document.querySelector(".discover-shell"))
      renderDiscover();
    else if (!state.started && !document.querySelector(".discover-landing"))
      renderDiscover();
    else updateDiscover(state);
  }
  if (currentView === "home") renderHome();
});
route();
