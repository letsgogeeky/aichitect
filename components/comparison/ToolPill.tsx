import { Tool, getCategoryColor } from "@/lib/types";

interface ToolPillProps {
  tool: Tool;
}

export function ToolPill({ tool }: ToolPillProps) {
  const color = getCategoryColor(tool.category);
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full"
      style={{ background: color + "18", color, border: `1px solid ${color}33` }}
    >
      {tool.name}
    </span>
  );
}
