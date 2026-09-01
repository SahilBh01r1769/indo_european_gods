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
        this.edgeLayer.attr("transform", transform);
        this.nodeLayer.attr("transform", transform);
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
            ? 37
            : 31
          : 29,
      )
      .style("stroke", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#b99d68",
      );

    nodesMerged
      .select(".node-disc")
      .attr("r", (node) => (node.type === "deity" ? 24 : 21))
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
      .attr("y", (node) => (node.type === "deity" ? 50 : 48))
      .text((node) =>
        node.type === "deity" ? node.deity.id : node.clue.label,
      );

    nodesMerged
      .select(".node-meta")
      .attr("y", (node) => (node.type === "deity" ? 66 : 63))
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
          .distance((link) => (link.type === "clue" ? 135 : 170))
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
        d3.forceCollide().radius((node) => (node.type === "clue" ? 78 : 88)),
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
      .attr("class", "graph-node graph-node-deity")
      .attr("transform", (node) => `translate(${node.x},${node.y})`)
      .classed("is-selected", (node) => node.id === state.selectedNode)
      .classed("is-future", (node) => dimFuture && node.deity.era > state.era)
      .attr("aria-label", (node) => `${node.deity.id}, ${node.deity.pantheon}`);

    merged
      .select(".node-halo")
      .attr("r", (node) => (node.id === state.selectedNode ? 34 : 29))
      .style("stroke", (node) => deityAccent(node.deity));
    merged
      .select(".node-disc")
      .attr("r", 23)
      .style("stroke", (node) => deityAccent(node.deity));
    merged
      .select(".node-glyph")
      .style("fill", (node) => deityAccent(node.deity))
      .text((node) => deityGlyph(node.deity));
    merged
      .select(".node-name")
      .attr("y", 48)
      .text((node) => node.deity.id);
    merged
      .select(".node-meta")
      .attr("y", 63)
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

    this.renderStatic(
      discovered,
      edges,
      state,
      (deity) => ({ x: x(deity.era), y: y(deity.pantheon) }),
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
    const landMasses = [
      [
        [0.06, 0.26],
        [0.18, 0.15],
        [0.34, 0.16],
        [0.46, 0.27],
        [0.43, 0.44],
        [0.29, 0.51],
        [0.12, 0.46],
      ],
      [
        [0.34, 0.43],
        [0.49, 0.42],
        [0.58, 0.57],
        [0.53, 0.82],
        [0.42, 0.76],
        [0.35, 0.58],
      ],
      [
        [0.4, 0.18],
        [0.6, 0.1],
        [0.86, 0.17],
        [0.94, 0.34],
        [0.83, 0.56],
        [0.62, 0.6],
        [0.47, 0.43],
      ],
    ];
    this.decor
      .selectAll("path.geo-land")
      .data(landMasses)
      .enter()
      .append("path")
      .attr("class", "geo-land")
      .attr("d", land);

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

    this.renderStatic(discovered, edges, state, (deity) => {
      const position = TRADITION_POSITIONS[deity.pantheon] || { x: 50, y: 50 };
      return {
        x: (width * position.x) / 100 + jitter(deity.id, 54),
        y: (height * position.y) / 100 + jitter(`${deity.id}:y`, 46),
      };
    });
  }

  fit() {
    this.svg
      .transition()
      .duration(260)
      .call(this.zoom.transform, d3.zoomIdentity);
  }
}
