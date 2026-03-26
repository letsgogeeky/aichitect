"use client";

import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  Node,
  NodeTypes,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { getCategoryColor, Relationship, Tool } from "@/lib/types";
import { applyDagreLayout, relationshipEdgeStyle } from "@/lib/graph";
import ToolNode from "@/components/graph/ToolNode";

const nodeTypes: NodeTypes = { tool: ToolNode };

function StaticGraphInner({
  toolIds,
  allTools,
  relationships,
}: {
  toolIds: string[];
  allTools: Tool[];
  relationships: Relationship[];
}) {
  const toolSet = new Set(toolIds);

  const nodes: Node[] = toolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => ({
      id: t!.id,
      type: "tool",
      data: { ...t!, highlighted: true, expanded: false },
      position: { x: 0, y: 0 },
    }));

  const edges: Edge[] = relationships
    .filter(
      (r) =>
        toolSet.has(r.source) &&
        toolSet.has(r.target) &&
        (r.type === "integrates-with" || r.type === "commonly-paired-with")
    )
    .map((r) => {
      const sourceTool = allTools.find((t) => t.id === r.source);
      const color = sourceTool ? getCategoryColor(sourceTool.category) : "var(--accent-2)";
      const isPaired = r.type === "commonly-paired-with";
      return {
        id: `static-${r.source}-${r.target}`,
        source: r.source,
        target: r.target,
        animated: !isPaired,
        style: relationshipEdgeStyle(r.type, color),
        label: isPaired ? "often used together" : undefined,
        labelStyle: isPaired ? { fill: "#555577", fontSize: 9 } : undefined,
        labelBgStyle: isPaired ? { fill: "var(--surface)", fillOpacity: 0.8 } : undefined,
      };
    });

  const laidOut = applyDagreLayout(nodes, edges, "LR", 280, 130);

  if (laidOut.length === 0) return null;

  return (
    <ReactFlow
      nodes={laidOut}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      panOnScroll={false}
    >
      <Background variant={BackgroundVariant.Dots} color="#1e1e2e" gap={20} size={1} />
    </ReactFlow>
  );
}

export default function StaticStackGraph({
  toolIds,
  allTools,
  relationships,
}: {
  toolIds: string[];
  allTools: Tool[];
  relationships: Relationship[];
}) {
  return (
    <ReactFlowProvider>
      <StaticGraphInner toolIds={toolIds} allTools={allTools} relationships={relationships} />
    </ReactFlowProvider>
  );
}
