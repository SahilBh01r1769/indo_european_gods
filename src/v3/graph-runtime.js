import { TRADITION_POSITIONS } from "./config.js";
import { deityAccent, deityGlyph, eraLabel, getDeity } from "./model.js";
import { availableClues } from "./state.js";

const edgeClass = (kind) => `edge-kind-${kind || "model"}`;

function jitter(id, amount = 24) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 1000) / 999 - 0.5) * amount;
}

export class MythGraph {
  constructor(container, handlers = {}) {
    this.container = container;
    this.handlers = handlers;
    this.positions = new Map();
    this.lastState = null;
    this.lastMode = null;
    this.simulation = null;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("class", "myth-graph")
      .attr("role", "img")
      .attr("aria-label", "Your discovered mythology network");

    this.decor = this.svg.append("g").attr("class", "graph-decoration");
    this.edgeLayer = this.svg.append("g").attr("class", "graph-edges");
    this.nodeLayer = this.svg.append("g").attr("class", "graph-nodes");

    this.zoomRoot = this.svg.append("g").attr("class", "zoom-proxy");
    this.zoom = d3
      .zoom()
      .scaleExtent([0.55, 2.2])
      .on("zoom", (event) => {
        const transform = event.transform;
        this.decor.attr("transform", transform);
        this.edgeLayer.attr("transform", transform);
        this.nodeLayer.attr("transform", transform);
        this.nodeLayer.selectAll(".node-name").style("opacity", transform.k < 0.72 ? 0 : 1);
        this.nodeLayer.selectAll(".node-meta").style("opacity", transform.k < 1.05 ? 0 : 1);
      });
    this.svg.call(this.zoom);

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() =>
        this.render(this.lastState),
      );
      this.resizeObserver.observe(container);
    } else {
      this.resizeHandler = () => this.render(this.lastState);
      window.addEventListener("resize", this.resizeHandler);
    }
  }

  destroy() {
    this.simulation?.stop();
    this.resizeObserver?.disconnect();
    if (this.resizeHandler)
      window.removeEventListener("resize", this.resizeHandler);
    this.svg.remove();
  }

  dimensions() {
    const box = this.container.getBoundingClientRect();
    return {
      width: Math.max(320, box.width || 900),
      height: Math.max(420, box.height || 620),
    };
  }

  render(state) {
    if (!state) return;
    const modeChanged = this.lastMode !== state.mode;
    this.lastMode = state.mode;
    this.lastState = state;
    const { width, height } = this.dimensions();
    this.svg.attr("viewBox", `0 0 ${width} ${height}`);
    this.container.dataset.mode = state.mode;

    const discovered = state.discoveredNodes.map(getDeity).filter(Boolean);
    const edges = state.discoveredEdges
      .map((edge) => ({
        ...edge,
        sourceDeity: getDeity(edge.source),
        targetDeity: getDeity(edge.target),
      }))
      .filter((edge) => edge.sourceDeity && edge.targetDeity);

    this.svg.call(this.zoom).classed("is-static-mode", state.mode !== "network");
    if (modeChanged) {
      this.svg.call(this.zoom.transform, d3.zoomIdentity);
    }

    if (state.mode === "time")
      return this.renderTime(discovered, edges, state, width, height);
    if (state.mode === "geography")
      return this.renderGeography(discovered, edges, state, width, height);
    return this.renderNetwork(discovered, edges, state, width, height);
  }

  clearDecoration() {
    this.decor.selectAll("*").remove();
  }

  resetZoomSilently() {
    this.decor.attr("transform", null);
    this.edgeLayer.attr("transform", null);
    this.nodeLayer.attr("transform", null);
  }

  renderNetwork(discovered, edges, state, width, height) {
    this.clearDecoration();
    this.simulation?.stop();

    const clues = availableClues(state.selectedNode);
    const deityNodes = discovered.map((deity) => ({
      type: "deity",
      id: deity.id,
      deity,
    }));
    const clueNodes = clues.map((clue) => ({
      type: "clue",
      id: clue.id,
      clue,
    }));
    const nodes = [...deityNodes, ...clueNodes];
    const nodeIds = new Set(nodes.map((node) => node.id));

    for (const node of deityNodes) {
      const remembered = this.positions.get(node.id);
      if (remembered) Object.assign(node, remembered);
    }

    const center = deityNodes.find((node) => node.id === state.selectedNode);
    if (center && !Number.isFinite(center.x)) {
      center.x = width * 0.52;
      center.y = height * 0.48;
    }

    // These are the exact link objects passed to d3.forceLink. forceLink mutates
    // source/target from ids into node objects, and the SVG edge join uses the
    // same objects, so tick positions stay valid.
    const links = [
      ...edges.map((edge) => ({
        id: edge.id,
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
        kind: edge.kind,
        type: "revealed",
      })),
      ...clues.map((clue) => ({
        id: clue.id,
        edgeId: null,
        source: clue.from,
        target: clue.id,
        kind: "mystery",
        type: "clue",
      })),
    ].filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target));

    const edgeSelection = this.edgeLayer
      .selectAll("line.graph-edge")
      .data(links, (link) => link.id);

    edgeSelection.exit().remove();

    const edgesMerged = edgeSelection
      .enter()
      .append("line")
      .attr("class", "graph-edge")
      .merge(edgeSelection)
      .attr(
        "class",
        (link) =>
          `graph-edge ${link.type === "clue" ? "edge-mystery" : edgeClass(link.kind)}`,
      )
      .classed("edge-selected", (link) => link.edgeId === state.selectedEdge)
      .on("click", (_, link) => {
        if (link.type === "revealed" && link.edgeId)
          this.handlers.onEdge?.(link.edgeId);
      });

    const edgeHits = this.edgeLayer.selectAll("line.graph-edge-hit")
      .data(links.filter((link) => link.type === "revealed"), (link) => link.id);
    edgeHits.exit().remove();
    const edgeHitsMerged = edgeHits.enter().append("line")
      .attr("class", "graph-edge-hit").attr("tabindex", 0).attr("role", "button")
      .merge(edgeHits)
      .attr("aria-label", (link) => `Inspect relationship between ${link.source.id || link.source} and ${link.target.id || link.target}`)
      .on("click", (_, link) => this.handlers.onEdge?.(link.edgeId))
      .on("keydown", (event, link) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.handlers.onEdge?.(link.edgeId);
        }
      });

    const nodeSelection = this.nodeLayer
      .selectAll("g.graph-node")
      .data(nodes, (node) => node.id);

    nodeSelection
      .exit()
      .transition()
      .duration(160)
      .style("opacity", 0)
      .remove();

    const entered = nodeSelection
      .enter()
      .append("g")
      .style("opacity", 0)
      .attr("tabindex", 0)
      .attr("role", "button")
      .on("click", (_, node) => {
        if (node.type === "deity") this.handlers.onNode?.(node.deity.id);
        else this.handlers.onReveal?.(node.clue);
      })
      .on("keydown", (event, node) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (node.type === "deity") this.handlers.onNode?.(node.deity.id);
        else this.handlers.onReveal?.(node.clue);
      });

    entered.append("circle").attr("class", "node-halo");
    entered.append("circle").attr("class", "node-disc");
    entered
      .append("text")
      .attr("class", "node-glyph")
      .attr("text-anchor", "middle")
      .attr("dy", ".36em");
    entered
      .append("text")
      .attr("class", "node-name")
      .attr("text-anchor", "middle");
    entered
      .append("text")
      .attr("class", "node-meta")
      .attr("text-anchor", "middle");

    const nodesMerged = entered
      .merge(nodeSelection)
      .attr("class", (node) => `graph-node graph-node-${node.type}`)
      .classed(
        "is-selected",
        (node) => node.type === "deity" && node.deity.id === state.selectedNode,
      )
      .attr("aria-label", (node) =>
        node.type === "deity"
          ? `${node.deity.id}, ${node.deity.pantheon}`
          : `Mystery clue: ${node.clue.label}. ${node.clue.hint}`,
      );

    nodesMerged
      .select(".node-halo")
      .attr("r", (node) =>
        node.type === "deity"
          ? node.deity.id === state.selectedNode
            ? 31
            : 27
          : 25,
      )
      .style("stroke", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#b99d68",
      );

    nodesMerged
      .select(".node-disc")
      .attr("r", (node) => (node.type === "deity" ? 20 : 18))
      .style("stroke", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#9d8d78",
      );

    nodesMerged
      .select(".node-glyph")
      .style("fill", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#6b6258",
      )
      .text((node) => (node.type === "deity" ? deityGlyph(node.deity) : "?"));

    nodesMerged
      .select(".node-name")
      .attr("y", (node) => (node.type === "deity" ? 41 : 39))
      .text((node) =>
        node.type === "deity" ? node.deity.id : node.clue.label,
      );

    nodesMerged
      .select(".node-meta")
      .attr("y", (node) => (node.type === "deity" ? 55 : 53))
      .text((node) =>
        node.type === "deity" ? node.deity.pantheon : node.clue.hint,
      );

    entered.transition().duration(240).style("opacity", 1);

    this.simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((node) => node.id)
          .distance((link) => (link.type === "clue" ? 145 : 155))
          .strength((link) => (link.type === "clue" ? 0.72 : 0.42)),
      )
      .force(
        "charge",
        d3
          .forceManyBody()
          .strength((node) => (node.type === "clue" ? -500 : -720)),
      )
      .force("center", d3.forceCenter(width * 0.52, height * 0.48))
      .force(
        "collision",
        d3.forceCollide().radius((node) => {
          const label = node.type === "clue" ? node.clue.label : node.deity.id;
          return Math.max(node.type === "clue" ? 78 : 55, Math.min(118, label.length * 3.6 + 24));
        }).iterations(4),
      )
      .alpha(0.85)
      .alphaDecay(0.04)
      .on("tick", () => {
        nodes.forEach((node) => {
          node.x = Math.max(76, Math.min(width - 76, node.x || width / 2));
          node.y = Math.max(78, Math.min(height - 82, node.y || height / 2));
          if (node.type === "deity")
            this.positions.set(node.id, { x: node.x, y: node.y });
        });

        edgesMerged
          .attr("x1", (link) => link.source.x)
          .attr("y1", (link) => link.source.y)
          .attr("x2", (link) => link.target.x)
          .attr("y2", (link) => link.target.y);
        edgeHitsMerged
          .attr("x1", (link) => link.source.x).attr("y1", (link) => link.source.y)
          .attr("x2", (link) => link.target.x).attr("y2", (link) => link.target.y);

        nodesMerged.attr(
          "transform",
          (node) => `translate(${node.x},${node.y})`,
        );
      });

    nodesMerged.call(
      d3
        .drag()
        .on("start", (event, node) => {
          if (!event.active) this.simulation.alphaTarget(0.18).restart();
          node.fx = node.x;
          node.fy = node.y;
        })
        .on("drag", (event, node) => {
          node.fx = event.x;
          node.fy = event.y;
        })
        .on("end", (event, node) => {
          if (!event.active) this.simulation.alphaTarget(0);
          node.fx = null;
          node.fy = null;
        }),
    );

    if (discovered.length && clues.length === 0) {
      this.decor
        .append("text")
        .attr("class", "graph-empty-note")
        .attr("x", width / 2)
        .attr("y", height - 32)
        .attr("text-anchor", "middle")
        .text(
          "No hidden paths remain here. Choose another discovered figure to continue.",
        );
    }
  }

  renderStatic(
    discovered,
    edges,
    state,
    positionFor,
    { dimFuture = false } = {},
  ) {
    this.simulation?.stop();
    const nodes = discovered.map((deity) => ({
      id: deity.id,
      deity,
      ...positionFor(deity),
    }));
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const links = edges
      .map((edge) => ({
        ...edge,
        s: nodeMap.get(edge.source),
        t: nodeMap.get(edge.target),
      }))
      .filter((edge) => edge.s && edge.t);

    const edgeSelection = this.edgeLayer
      .selectAll("line.graph-edge")
      .data(links, (edge) => edge.id);
    edgeSelection.exit().remove();
    edgeSelection
      .enter()
      .append("line")
      .merge(edgeSelection)
      .attr("class", (edge) => `graph-edge ${edgeClass(edge.kind)}`)
      .classed("edge-selected", (edge) => edge.id === state.selectedEdge)
      .attr("x1", (edge) => edge.s.x)
      .attr("y1", (edge) => edge.s.y)
      .attr("x2", (edge) => edge.t.x)
      .attr("y2", (edge) => edge.t.y)
      .on("click", (_, edge) => this.handlers.onEdge?.(edge.id));

    const edgeHits = this.edgeLayer.selectAll("line.graph-edge-hit").data(links, (edge) => edge.id);
    edgeHits.exit().remove();
    edgeHits.enter().append("line").attr("class", "graph-edge-hit")
      .attr("tabindex", 0).attr("role", "button").merge(edgeHits)
      .attr("x1", (edge) => edge.s.x).attr("y1", (edge) => edge.s.y)
      .attr("x2", (edge) => edge.t.x).attr("y2", (edge) => edge.t.y)
      .attr("aria-label", (edge) => `Inspect relationship between ${edge.source} and ${edge.target}`)
      .on("click", (_, edge) => this.handlers.onEdge?.(edge.id))
      .on("keydown", (event, edge) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.handlers.onEdge?.(edge.id);
        }
      });

    const nodeSelection = this.nodeLayer
      .selectAll("g.graph-node")
      .data(nodes, (node) => node.id);
    nodeSelection.exit().remove();

    const entered = nodeSelection
      .enter()
      .append("g")
      .attr("tabindex", 0)
      .attr("role", "button")
      .on("click", (_, node) => this.handlers.onNode?.(node.id))
      .on("keydown", (event, node) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        this.handlers.onNode?.(node.id);
      });

    entered.append("circle").attr("class", "node-halo");
    entered.append("circle").attr("class", "node-disc");
    entered
      .append("text")
      .attr("class", "node-glyph")
      .attr("text-anchor", "middle")
      .attr("dy", ".36em");
    entered
      .append("text")
      .attr("class", "node-name")
      .attr("text-anchor", "middle");
    entered
      .append("text")
      .attr("class", "node-meta")
      .attr("text-anchor", "middle");

    const merged = entered
      .merge(nodeSelection)
      .on(".drag", null)
      .attr("class", "graph-node graph-node-deity")
      .attr("transform", (node) => `translate(${node.x},${node.y})`)
      .classed("is-selected", (node) => node.id === state.selectedNode)
      .classed("is-future", (node) => dimFuture && node.deity.era > state.era)
      .attr("aria-label", (node) => `${node.deity.id}, ${node.deity.pantheon}`);

    merged
      .select(".node-halo")
      .attr("r", (node) => (node.id === state.selectedNode ? 31 : 27))
      .style("stroke", (node) => deityAccent(node.deity));
    merged
      .select(".node-disc")
      .attr("r", 20)
      .style(
        "fill",
        (node) => `color-mix(in srgb, ${deityAccent(node.deity)} 12%, #fffaf0)`,
      )
      .style("stroke", (node) => deityAccent(node.deity));
    merged
      .select(".node-glyph")
      .style("fill", (node) => deityAccent(node.deity))
      .style("font-size", (node) => {
        const length = [...deityGlyph(node.deity)].length;
        if (length > 3) return "11px";
        if (length > 1) return "15px";
        return "19px";
      })
      .text((node) => deityGlyph(node.deity));
    merged
      .select(".node-name")
      .attr("y", 42)
      .text((node) => node.deity.id);
    merged
      .select(".node-meta")
      .attr("y", 56)
      .text((node) => node.deity.pantheon);
  }

  renderTime(discovered, edges, state, width, height) {
    this.clearDecoration();
    const margin = { left: 86, right: 50, top: 72, bottom: 72 };
    const minEra = Math.min(-2200, ...discovered.map((deity) => deity.era));
    const maxEra = 1400;
    const x = d3
      .scaleLinear()
      .domain([minEra, maxEra])
      .range([margin.left, width - margin.right]);
    const pantheons = [...new Set(discovered.map((deity) => deity.pantheon))];
    const y = d3
      .scalePoint()
      .domain(pantheons)
      .range([margin.top + 32, height - margin.bottom - 20])
      .padding(0.45);

    const axis = d3
      .axisBottom(x)
      .ticks(Math.min(7, Math.floor(width / 130)))
      .tickFormat((value) =>
        value < 0 ? `${Math.abs(value)} BCE` : `${value} CE`,
      );

    this.decor
      .append("g")
      .attr("class", "time-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(axis);

    this.decor
      .append("line")
      .attr("class", "time-cursor")
      .attr("x1", x(state.era))
      .attr("x2", x(state.era))
      .attr("y1", margin.top - 24)
      .attr("y2", height - margin.bottom);

    this.decor
      .append("text")
      .attr("class", "time-cursor-label")
      .attr("x", x(state.era))
      .attr("y", margin.top - 34)
      .attr("text-anchor", "middle")
      .text(`Horizon ${eraLabel(state.era)}`);

    pantheons.forEach((pantheon) => {
      this.decor
        .append("text")
        .attr("class", "time-row-label")
        .attr("x", margin.left - 16)
        .attr("y", y(pantheon) + 4)
        .attr("text-anchor", "end")
        .text(pantheon);
    });

    const timelineNodes = discovered.map((deity) => ({
      id: deity.id,
      deity,
      x: x(deity.era),
      y: y(deity.pantheon),
      targetX: x(deity.era),
      targetY: y(deity.pantheon),
    }));
    d3.forceSimulation(timelineNodes)
      .force("x", d3.forceX((node) => node.targetX).strength(0.78))
      .force("y", d3.forceY((node) => node.targetY).strength(0.2))
      .force("collision", d3.forceCollide(55).iterations(5))
      .stop()
      .tick(180);
    const timelinePositions = new Map(
      timelineNodes.map((node) => [
        node.id,
        {
          x: Math.max(margin.left, Math.min(width - margin.right, node.x)),
          y: Math.max(
            margin.top,
            Math.min(height - margin.bottom - 28, node.y),
          ),
        },
      ]),
    );

    this.renderStatic(
      discovered,
      edges,
      state,
      (deity) => timelinePositions.get(deity.id),
      { dimFuture: true },
    );
  }

  renderGeography(discovered, edges, state, width, height) {
    this.clearDecoration();

    this.decor
      .append("rect")
      .attr("class", "geo-field")
      .attr("x", 28)
      .attr("y", 28)
      .attr("width", width - 56)
      .attr("height", height - 56)
      .attr("rx", 26);

    const mapX = (value) => 28 + (width - 56) * value;
    const mapY = (value) => 28 + (height - 56) * value;
    const land = d3
      .line()
      .x((point) => mapX(point[0]))
      .y((point) => mapY(point[1]))
      .curve(d3.curveBasisClosed);
    // A deliberately simplified, region-focused Old World atlas. Coastlines
    // are recognizable, while modern national borders are omitted.
    const landMasses = [
      [
        [0.08, 0.28], [0.14, 0.21], [0.22, 0.2], [0.27, 0.13],
        [0.34, 0.16], [0.38, 0.23], [0.45, 0.26], [0.49, 0.35],
        [0.44, 0.43], [0.36, 0.42], [0.32, 0.49], [0.23, 0.47],
        [0.15, 0.42], [0.09, 0.36],
      ],
      [
        [0.27, 0.45], [0.39, 0.42], [0.49, 0.46], [0.56, 0.55],
        [0.55, 0.67], [0.49, 0.83], [0.41, 0.9], [0.36, 0.77],
        [0.31, 0.63],
      ],
      [
        [0.4, 0.22], [0.52, 0.12], [0.69, 0.1], [0.85, 0.16],
        [0.95, 0.27], [0.91, 0.39], [0.83, 0.45], [0.82, 0.56],
        [0.74, 0.62], [0.65, 0.55], [0.58, 0.58], [0.51, 0.48],
        [0.44, 0.42],
      ],
      [
        [0.54, 0.47], [0.62, 0.48], [0.67, 0.61], [0.62, 0.7],
        [0.57, 0.63],
      ],
      [
        [0.68, 0.49], [0.75, 0.51], [0.79, 0.65], [0.74, 0.76],
        [0.7, 0.65],
      ],
      [
        [0.26, 0.11], [0.31, 0.05], [0.37, 0.08], [0.39, 0.2],
        [0.34, 0.27], [0.29, 0.22],
      ],
    ];
    this.decor
      .selectAll("path.geo-land")
      .data(landMasses)
      .enter()
      .append("path")
      .attr("class", "geo-land")
      .attr("d", land);

    const atlasLabels = [
      [0.27, 0.34, "EUROPE"], [0.42, 0.67, "NORTH AFRICA"],
      [0.57, 0.46, "NEAR EAST"], [0.7, 0.3, "CENTRAL ASIA"],
      [0.75, 0.68, "SOUTH ASIA"],
    ];
    this.decor.selectAll("text.geo-atlas-label").data(atlasLabels).enter()
      .append("text").attr("class", "geo-atlas-label")
      .attr("x", (item) => mapX(item[0])).attr("y", (item) => mapY(item[1]))
      .attr("text-anchor", "middle").text((item) => item[2]);

    for (let gx = 15; gx <= 85; gx += 14) {
      this.decor
        .append("line")
        .attr("class", "geo-grid")
        .attr("x1", (width * gx) / 100)
        .attr("x2", (width * gx) / 100)
        .attr("y1", 48)
        .attr("y2", height - 48);
    }
    for (let gy = 18; gy <= 82; gy += 16) {
      this.decor
        .append("line")
        .attr("class", "geo-grid")
        .attr("x1", 48)
        .attr("x2", width - 48)
        .attr("y1", (height * gy) / 100)
        .attr("y2", (height * gy) / 100);
    }

    [...new Set(discovered.map((deity) => deity.pantheon))].forEach(
      (pantheon) => {
        const position = TRADITION_POSITIONS[pantheon];
        if (!position) return;
        this.decor
          .append("text")
          .attr("class", "geo-region-label")
          .attr("x", (width * position.x) / 100)
          .attr("y", (height * position.y) / 100 - 42)
          .attr("text-anchor", "middle")
          .text(position.label);
      },
    );

    this.decor
      .append("text")
      .attr("class", "geo-caution")
      .attr("x", width - 44)
      .attr("y", height - 38)
      .attr("text-anchor", "end")
      .text("Approximate cultural regions · not historical borders");

    const geographyNodes = discovered.map((deity) => {
      const position = TRADITION_POSITIONS[deity.pantheon] || { x: 50, y: 50 };
      const targetX = (width * position.x) / 100;
      const targetY = (height * position.y) / 100;
      return {
        id: deity.id,
        deity,
        targetX,
        targetY,
        x: targetX + jitter(deity.id, 82),
        y: targetY + jitter(`${deity.id}:y`, 74),
      };
    });
    d3.forceSimulation(geographyNodes)
      .force("x", d3.forceX((node) => node.targetX).strength(0.22))
      .force("y", d3.forceY((node) => node.targetY).strength(0.22))
      .force("collision", d3.forceCollide(56).iterations(5))
      .stop()
      .tick(180);
    const geographyPositions = new Map(
      geographyNodes.map((node) => [
        node.id,
        {
          x: Math.max(62, Math.min(width - 62, node.x)),
          y: Math.max(66, Math.min(height - 76, node.y)),
        },
      ]),
    );

    this.renderStatic(discovered, edges, state, (deity) =>
      geographyPositions.get(deity.id),
    );
  }

  fit() {
    this.svg
      .transition()
      .duration(260)
      .call(this.zoom.transform, d3.zoomIdentity);
  }
}
