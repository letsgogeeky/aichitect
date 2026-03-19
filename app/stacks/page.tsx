"use client";

import { useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  NodeTypes,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import stacksData from "@/data/stacks.json";
import toolsData from "@/data/tools.json";
import { Stack, Tool, getCategoryColor } from "@/lib/types";
import { applyDagreLayout } from "@/lib/graph";
import ToolNode from "@/components/graph/ToolNode";

const stacks = stacksData as Stack[];
const allTools = toolsData as Tool[];
const nodeTypes: NodeTypes = { tool: ToolNode };

function StackGraph({ stack }: { stack: Stack }) {
  const nodes: Node[] = stack.tools
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => ({
      id: t!.id,
      type: "tool",
      data: { ...t!, expanded: true },
      position: { x: 0, y: 0 },
    }));

  const edges: Edge[] = stack.flow.map((f, i) => {
    const sourceTool = allTools.find((t) => t.id === f.from);
    const color = sourceTool ? getCategoryColor(sourceTool.category) : "#7c6bff";
    return {
      id: `flow-${i}`,
      source: f.from,
      target: f.to,
      label: f.label,
      labelStyle: { fill: "#8888aa", fontSize: 10 },
      labelBgStyle: { fill: "#0e0e18", fillOpacity: 0.9 },
      style: { stroke: color, strokeWidth: 1.5 },
      animated: true,
    };
  });

  const laidOut = applyDagreLayout(nodes, edges, "LR", 280, 130);

  return (
    <ReactFlow
      nodes={laidOut}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2, duration: 300 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.3}
    >
      <Background variant={BackgroundVariant.Dots} color="#1e1e2e" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default function StacksPage() {
  const [selected, setSelected] = useState<Stack>(stacks[0]);

  return (
    <div className="flex h-full">
      {/* Stack list sidebar */}
      <aside
        className="w-60 flex-shrink-0 border-r overflow-y-auto"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="p-3">
          <div className="px-2 mb-4">
            <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
              8 proven stacks.
            </p>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              No research required. Each one is a battle-tested combination — click to see how the tools connect.
            </p>
          </div>
          <div className="space-y-0.5">
            {stacks.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  background: selected.id === s.id ? "#7c6bff22" : "transparent",
                  border: selected.id === s.id ? "1px solid #7c6bff44" : "1px solid transparent",
                }}
              >
                <div
                  className="text-xs font-medium leading-tight"
                  style={{ color: selected.id === s.id ? "#7c6bff" : "var(--text-primary)" }}
                >
                  {s.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                  {s.target}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Graph */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stack info header */}
        <div
          className="px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{selected.name}</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{selected.description}</p>
        </div>

        <div className="flex-1">
          <ReactFlowProvider key={selected.id}>
            <StackGraph stack={selected} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
