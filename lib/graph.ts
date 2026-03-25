import dagre from "@dagrejs/dagre";
import { Node, Edge } from "reactflow";

/**
 * Returns a consistent edge style for a given relationship type.
 * Used by BuilderClient and ExploreGraph to keep edge rendering consistent.
 */
export function relationshipEdgeStyle(type: string, categoryColor: string) {
  if (type === "commonly-paired-with") {
    return { stroke: "#4a4a7a", strokeWidth: 1.5, strokeDasharray: "5,4" } as const;
  }
  if (type === "integrates-with") {
    return { stroke: categoryColor, strokeWidth: 1.5, strokeDasharray: undefined } as const;
  }
  // competes-with and anything else
  return { stroke: "#3a3a4a", strokeWidth: 1, strokeDasharray: "2,4" } as const;
}

export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR",
  nodeWidth = 200,
  nodeHeight = 80
): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    return {
      ...node,
      position: { x: x - nodeWidth / 2, y: y - nodeHeight / 2 },
    };
  });
}

export function gridLayout(
  nodes: Node[],
  cols = 6,
  nodeWidth = 220,
  nodeHeight = 90,
  gap = 24
): Node[] {
  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: (i % cols) * (nodeWidth + gap),
      y: Math.floor(i / cols) * (nodeHeight + gap),
    },
  }));
}

export interface LaneGroup {
  label: string;
  question: string;
}

export function swimlaneLayout(
  nodes: Node[],
  getLayerIndex: (nodeId: string) => number,
  layers: LaneGroup[],
  cols = 5,
  nodeWidth = 220,
  nodeHeight = 90,
  gap = 24,
  laneGap = 52,
  headerHeight = 40,
  padH = 20,
  padV = 14
): { toolNodes: Node[]; laneNodes: Node[] } {
  const groups: Node[][] = layers.map(() => []);
  const orphans: Node[] = [];

  for (const node of nodes) {
    const idx = getLayerIndex(node.id);
    if (idx >= 0 && idx < layers.length) {
      groups[idx].push(node);
    } else {
      orphans.push(node);
    }
  }

  const toolNodes: Node[] = [];
  const laneNodes: Node[] = [];
  const totalWidth = cols * (nodeWidth + gap) - gap;
  let currentY = 0;

  for (let li = 0; li < layers.length; li++) {
    const group = groups[li];
    if (group.length === 0) continue;

    const rows = Math.ceil(group.length / cols);
    const contentHeight = rows * (nodeHeight + gap) - gap;
    const laneHeight = headerHeight + contentHeight + padV;

    laneNodes.push({
      id: `__lane_${li}`,
      type: "laneLabel",
      data: {
        label: layers[li].label,
        question: layers[li].question,
        width: totalWidth + padH * 2,
        height: laneHeight,
      },
      position: { x: -padH, y: currentY },
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
    } as Node);

    group.forEach((node, i) => {
      toolNodes.push({
        ...node,
        position: {
          x: (i % cols) * (nodeWidth + gap),
          y: currentY + headerHeight + Math.floor(i / cols) * (nodeHeight + gap),
        },
      });
    });

    currentY += laneHeight + laneGap;
  }

  orphans.forEach((node, i) => {
    toolNodes.push({
      ...node,
      position: {
        x: (i % cols) * (nodeWidth + gap),
        y: currentY + Math.floor(i / cols) * (nodeHeight + gap),
      },
    });
  });

  return { toolNodes, laneNodes };
}
