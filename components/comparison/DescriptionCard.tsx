import type { Tool } from "@/lib/types";

interface DescriptionCardProps {
  tool: Tool;
  color: string;
}

export function DescriptionCard({ tool, color }: DescriptionCardProps) {
  return (
    <div
      className="rounded-md p-3 space-y-1"
      style={{ background: "var(--surface-2)", borderTop: `2px solid ${color}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
        {tool.name}
      </p>
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{tool.description}</p>
    </div>
  );
}
