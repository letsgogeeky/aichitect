import { describe, it, expect } from "vitest";
import { gridLayout, swimlaneLayout } from "@/lib/graph";
import type { Node } from "reactflow";

function makeNode(id: string): Node {
  return { id, data: {}, position: { x: 0, y: 0 } };
}

// ─── gridLayout ────────────────────────────────────────────────────────────

describe("gridLayout", () => {
  const NODE_W = 220;
  const NODE_H = 90;
  const GAP = 24;
  const COLS = 6;

  it("places the first node at the origin", () => {
    const [first] = gridLayout([makeNode("a")]);
    expect(first.position).toEqual({ x: 0, y: 0 });
  });

  it("places subsequent nodes in the same row until cols is reached", () => {
    const nodes = Array.from({ length: COLS }, (_, i) => makeNode(String(i)));
    const laid = gridLayout(nodes, COLS, NODE_W, NODE_H, GAP);

    laid.forEach((node, i) => {
      expect(node.position.x).toBe(i * (NODE_W + GAP));
      expect(node.position.y).toBe(0);
    });
  });

  it("wraps to a new row after cols nodes", () => {
    const nodes = Array.from({ length: COLS + 1 }, (_, i) => makeNode(String(i)));
    const laid = gridLayout(nodes, COLS, NODE_W, NODE_H, GAP);
    const overflow = laid[COLS];

    expect(overflow.position.x).toBe(0);
    expect(overflow.position.y).toBe(NODE_H + GAP);
  });

  it("preserves node id and data", () => {
    const node = { id: "tool-1", data: { name: "Cursor" }, position: { x: 0, y: 0 } };
    const [result] = gridLayout([node]);
    expect(result.id).toBe("tool-1");
    expect(result.data).toEqual({ name: "Cursor" });
  });

  it("returns an empty array for empty input", () => {
    expect(gridLayout([])).toEqual([]);
  });
});

// ─── swimlaneLayout ────────────────────────────────────────────────────────

describe("swimlaneLayout", () => {
  const layers = [
    { label: "Development", question: "How do you code?" },
    { label: "AI Logic", question: "How does AI think?" },
  ];

  // node "a" → layer 0, node "b" → layer 1, node "c" → orphan
  const getLayerIndex = (id: string) => (id === "a" ? 0 : id === "b" ? 1 : -1);

  it("produces a lane node for each non-empty layer", () => {
    const { laneNodes } = swimlaneLayout(
      [makeNode("a"), makeNode("b")],
      getLayerIndex,
      layers
    );
    expect(laneNodes).toHaveLength(2);
    expect(laneNodes[0].data.label).toBe("Development");
    expect(laneNodes[1].data.label).toBe("AI Logic");
  });

  it("does not produce a lane node for an empty layer", () => {
    // Only provide a node for layer 0 — layer 1 stays empty
    const { laneNodes } = swimlaneLayout([makeNode("a")], getLayerIndex, layers);
    expect(laneNodes).toHaveLength(1);
    expect(laneNodes[0].data.label).toBe("Development");
  });

  it("places orphan nodes after all lanes", () => {
    const { toolNodes } = swimlaneLayout(
      [makeNode("a"), makeNode("c")],
      getLayerIndex,
      layers
    );
    const orphan = toolNodes.find((n) => n.id === "c");
    const layered = toolNodes.find((n) => n.id === "a");
    expect(orphan).toBeDefined();
    expect(orphan!.position.y).toBeGreaterThan(layered!.position.y);
  });

  it("returns empty arrays for empty input", () => {
    const { toolNodes, laneNodes } = swimlaneLayout([], getLayerIndex, layers);
    expect(toolNodes).toHaveLength(0);
    expect(laneNodes).toHaveLength(0);
  });
});
