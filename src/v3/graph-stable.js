import { MythGraph as RuntimeGraph } from "./graph-runtime.js";
import { deityAccent, deityGlyph, getDeity } from "./model.js";
import { availableClues } from "./state.js";

const edgeClass = (kind) => `edge-kind-${kind || "model"}`;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashUnit(id) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export class MythGraph extends RuntimeGraph {
  constructor(container, handlers = {}) {
    super(container, handlers);

    this.resizeObserver?.disconnect();
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }

    this.networkPositions = new Map();
    this.networkLayoutKey = null;
    this.resizeFrame = null;
    this.lastObservedSize = this.dimensions();
    this.pendingReveal = null;
    this.animatedRevealId = null;

    const scheduleResize = () => {
      const next = this.dimensions();
      const previous = this.lastObservedSize;
      if (
        Math.abs(next.width - previous.width) < 2 &&
        Math.abs(next.height - previous.height) < 2
      )
        return;
      this.lastObservedSize = next;
      if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = null;
        if (this.lastState) this.render(this.lastState);
      });
    };

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(scheduleResize);
      this.resizeObserver.observe(container);
    } else {
      this.resizeHandler = scheduleResize;
      window.addEventListener("resize", this.resizeHandler, { passive: true });
    }
  }

  destroy() {
    if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
    super.destroy();
  }

  renderNetwork(discovered, edges, state, width, height) {
    this.clearDecoration();
    this.simulation?.stop();

    const revealId = state.lastReveal?.edgeId;
    const reveal =
      this.pendingReveal ||
      (revealId && revealId !== this.animatedRevealId
        ? state.lastReveal
        : null);
    const clues = state.activeStory ? [] : availableClues(state.selectedNode);
    const compactLayout = width < 520;
    const previousPositions = new Map(this.networkPositions);
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

    const selected = deityNodes.find((node) => node.id === state.selectedNode);
    const selectedRemembered = selected
      ? this.networkPositions.get(selected.id) ||
        this.positions.get(selected.id)
      : null;
    const anchor = {
      x: selectedRemembered?.x ?? width * 0.52,
      y: selectedRemembered?.y ?? height * 0.48,
    };

    deityNodes.forEach((node, index) => {
      const remembered =
        this.networkPositions.get(node.id) || this.positions.get(node.id);
      if (remembered) {
        node.x = remembered.x;
        node.y = remembered.y;
        return;
      }
      if (reveal && node.id === reveal.target) {
        const sourcePosition =
          this.networkPositions.get(reveal.from) ||
          this.positions.get(reveal.from) ||
          anchor;
        node.x = sourcePosition.x;
        node.y = sourcePosition.y;
        return;
      }
      if (node.id === state.selectedNode) {
        node.x = anchor.x;
        node.y = anchor.y;
        return;
      }
      const angle = hashUnit(node.id) * Math.PI * 2;
      const radius = 125 + (index % 4) * 22;
      node.x = anchor.x + Math.cos(angle) * radius;
      node.y = anchor.y + Math.sin(angle) * radius;
    });

    clueNodes.forEach((node, index) => {
      const remembered = this.networkPositions.get(node.id);
      if (remembered) {
        node.x = remembered.x;
        node.y = remembered.y;
        return;
      }
      const spread = Math.max(1, clueNodes.length);
      const angle =
        -Math.PI / 2 +
        (index / spread) * Math.PI * 2 +
        hashUnit(node.id) * 0.18;
      const radius = 128 + (index % 2) * 18;
      node.x = anchor.x + Math.cos(angle) * radius;
      node.y = anchor.y + Math.sin(angle) * radius;
    });

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

    const edgeEntered = edgeSelection
      .enter()
      .append("line")
      .attr("class", "graph-edge");

    const edgesMerged = edgeEntered
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

    nodeSelection.exit().remove();

    const entered = nodeSelection
      .enter()
      .append("g")
      .style("opacity", 0)
      .attr("tabindex", 0)
      .attr("role", "button")
      .on("click", (_, node) => {
        if (node.type === "deity") {
          this.handlers.onNode?.(node.deity.id);
        } else {
          this.pendingReveal = {
            clueId: node.id,
            target: node.clue.target,
            from: node.clue.from,
            x: node.x,
            y: node.y,
          };
          this.handlers.onReveal?.(node.clue);
        }
      })
      .on("keydown", (event, node) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (node.type === "deity") {
          this.handlers.onNode?.(node.deity.id);
        } else {
          this.pendingReveal = {
            clueId: node.id,
            target: node.clue.target,
            from: node.clue.from,
            x: node.x,
            y: node.y,
          };
          this.handlers.onReveal?.(node.clue);
        }
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
      .classed(
        "is-recent",
        (node) =>
          node.type === "deity" && node.deity.id === state.lastReveal?.target,
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
            ? 52
            : 45
          : 31,
      )
      .style("stroke", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#aa9877",
      );

    nodesMerged
      .select(".node-disc")
      .attr("r", (node) => (node.type === "deity" ? 36 : 24))
      .style("fill", (node) =>
        node.type === "deity"
          ? `color-mix(in srgb, ${deityAccent(node.deity)} 12%, #fffaf0)`
          : "#fbf3e6",
      )
      .style("stroke", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#918575",
      );

    nodesMerged
      .select(".node-glyph")
      .style("fill", (node) =>
        node.type === "deity" ? deityAccent(node.deity) : "#625b52",
      )
      .style("font-size", (node) => {
        if (node.type !== "deity") return "19px";
        const length = [...deityGlyph(node.deity)].length;
        if (length > 10) return "8px";
        if (length > 7) return "10px";
        if (length > 5) return "12px";
        if (length > 3) return "15px";
        return "20px";
      })
      .text((node) => (node.type === "deity" ? deityGlyph(node.deity) : "?"));

    nodesMerged
      .select(".node-name")
      .attr("y", (node) => (node.type === "deity" ? 62 : 53))
      .text((node) =>
        node.type === "deity"
          ? node.deity.id
          : `${getDeity(node.clue.target)?.pantheon || "Hidden"} clue`,
      );

    nodesMerged
      .select(".node-meta")
      .attr("y", (node) => (node.type === "deity" ? 79 : 69))
      .text((node) =>
        node.type === "deity" ? node.deity.pantheon : "Select to reveal",
      );

    const layoutKey = [
      Math.round(width / 8),
      Math.round(height / 8),
      state.selectedNode,
      ...nodes.map((node) => node.id).sort(),
      "|",
      ...links.map((link) => link.id).sort(),
    ].join(":");

    const hasAllPositions = nodes.every((node) =>
      this.networkPositions.has(node.id),
    );

    if (layoutKey !== this.networkLayoutKey || !hasAllPositions) {
      const selectedNode = deityNodes.find(
        (node) => node.id === state.selectedNode,
      );
      if (selectedNode) {
        selectedNode.fx = clamp(
          anchor.x,
          compactLayout ? 72 : 116,
          width - (compactLayout ? 72 : 116),
        );
        selectedNode.fy = clamp(
          anchor.y,
          compactLayout ? 82 : 118,
          height - (compactLayout ? 94 : 124),
        );
      }

      this.simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((node) => node.id)
            .distance((link) =>
              compactLayout
                ? link.type === "clue"
                  ? 138
                  : 162
                : link.type === "clue"
                  ? 184
                  : 208,
            )
            .strength((link) => (link.type === "clue" ? 0.58 : 0.28)),
        )
        .force(
          "charge",
          d3
            .forceManyBody()
            .strength((node) => (node.type === "clue" ? -620 : -880)),
        )
        .force("center", d3.forceCenter(width * 0.52, height * 0.48))
        .force(
          "collision",
          d3
            .forceCollide()
            .radius((node) =>
              compactLayout
                ? node.type === "clue"
                  ? 64
                  : 84
                : node.type === "clue"
                  ? 82
                  : 108,
            ),
        )
        .alpha(0.82)
        .alphaDecay(0.055)
        .stop();

      for (let i = 0; i < (compactLayout ? 220 : 150); i++)
        this.simulation.tick();

      if (selectedNode) {
        selectedNode.x = selectedNode.fx;
        selectedNode.y = selectedNode.fy;
        selectedNode.fx = null;
        selectedNode.fy = null;
      }

      if (state.activeStory && compactLayout) {
        const storyLayouts = {
          1: [[0.5, 0.48]],
          2: [
            [0.28, 0.48],
            [0.72, 0.48],
          ],
          3: [
            [0.28, 0.3],
            [0.72, 0.3],
            [0.5, 0.7],
          ],
          4: [
            [0.28, 0.29],
            [0.72, 0.29],
            [0.28, 0.68],
            [0.72, 0.68],
          ],
        };
        const positions = storyLayouts[Math.min(deityNodes.length, 4)];
        if (positions) {
          deityNodes.forEach((node, index) => {
            node.x = width * positions[index][0];
            node.y = height * positions[index][1];
          });
        }
      }
      nodes.forEach((node) => {
        node.x = clamp(
          Number.isFinite(node.x) ? node.x : width / 2,
          compactLayout ? 66 : 112,
          width - (compactLayout ? 66 : 112),
        );
        node.y = clamp(
          Number.isFinite(node.y) ? node.y : height / 2,
          compactLayout ? 72 : 112,
          height - (compactLayout ? 88 : 120),
        );
        this.networkPositions.set(node.id, { x: node.x, y: node.y });
        if (node.type === "deity")
          this.positions.set(node.id, { x: node.x, y: node.y });
      });
      this.networkLayoutKey = layoutKey;
    } else {
      nodes.forEach((node) => {
        const remembered = this.networkPositions.get(node.id);
        node.x = clamp(
          remembered.x,
          compactLayout ? 66 : 112,
          width - (compactLayout ? 66 : 112),
        );
        node.y = clamp(
          remembered.y,
          compactLayout ? 72 : 112,
          height - (compactLayout ? 88 : 120),
        );
      });
    }

    const place = () => {
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      edgesMerged
        .attr(
          "x1",
          (link) =>
            (typeof link.source === "object"
              ? link.source
              : nodeMap.get(link.source)
            )?.x ?? 0,
        )
        .attr(
          "y1",
          (link) =>
            (typeof link.source === "object"
              ? link.source
              : nodeMap.get(link.source)
            )?.y ?? 0,
        )
        .attr(
          "x2",
          (link) =>
            (typeof link.target === "object"
              ? link.target
              : nodeMap.get(link.target)
            )?.x ?? 0,
        )
        .attr(
          "y2",
          (link) =>
            (typeof link.target === "object"
              ? link.target
              : nodeMap.get(link.target)
            )?.y ?? 0,
        );
      nodesMerged.attr("transform", (node) => `translate(${node.x},${node.y})`);
    };

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (reduceMotion) {
      entered.style("opacity", 1);
      place();
    } else {
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      const idOf = (endpoint) =>
        typeof endpoint === "object" ? endpoint.id : endpoint;
      const finalPoint = (endpoint) => nodeMap.get(idOf(endpoint));
      const oldPoint = (endpoint) =>
        previousPositions.get(idOf(endpoint)) || finalPoint(endpoint);
      const revealSource = reveal
        ? previousPositions.get(reveal.from) || finalPoint(reveal.from)
        : null;
      const motion = d3
        .transition()
        .duration(reveal ? 860 : 560)
        .ease(d3.easeCubicInOut);

      entered.attr("transform", (node) => {
        const start =
          reveal && node.id === reveal.target
            ? revealSource
            : previousPositions.get(node.id) || node;
        const scale = reveal && node.id === reveal.target ? " scale(.42)" : "";
        return `translate(${start?.x ?? node.x},${start?.y ?? node.y})${scale}`;
      });

      edgeEntered
        .attr("x1", (link) => oldPoint(link.source)?.x ?? 0)
        .attr("y1", (link) => oldPoint(link.source)?.y ?? 0)
        .attr("x2", (link) =>
          reveal && idOf(link.target) === reveal.target
            ? (revealSource?.x ?? 0)
            : (oldPoint(link.target)?.x ?? 0),
        )
        .attr("y2", (link) =>
          reveal && idOf(link.target) === reveal.target
            ? (revealSource?.y ?? 0)
            : (oldPoint(link.target)?.y ?? 0),
        )
        .style("opacity", 0);

      nodesMerged
        .interrupt()
        .transition(motion)
        .style("opacity", 1)
        .attr("transform", (node) => `translate(${node.x},${node.y}) scale(1)`);
      edgesMerged
        .interrupt()
        .transition(motion)
        .style("opacity", null)
        .attr("x1", (link) => finalPoint(link.source)?.x ?? 0)
        .attr("y1", (link) => finalPoint(link.source)?.y ?? 0)
        .attr("x2", (link) => finalPoint(link.target)?.x ?? 0)
        .attr("y2", (link) => finalPoint(link.target)?.y ?? 0);
    }

    if (revealId) this.animatedRevealId = revealId;
    this.pendingReveal = null;

    nodesMerged.call(
      d3
        .drag()
        .on("start", (event) => {
          event.sourceEvent?.stopPropagation();
        })
        .on("drag", (event, node) => {
          node.x = clamp(event.x, 112, width - 112);
          node.y = clamp(event.y, 112, height - 120);
          this.networkPositions.set(node.id, { x: node.x, y: node.y });
          if (node.type === "deity")
            this.positions.set(node.id, { x: node.x, y: node.y });
          place();
        }),
    );

    if (discovered.length && clues.length === 0 && !state.activeStory) {
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
}
