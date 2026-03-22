import type { Tool } from "@/lib/types";

interface ChooseIfCardProps {
  tool: Tool;
  color: string;
}

export function ChooseIfCard({ tool, color }: ChooseIfCardProps) {
  if (!tool.choose_if || tool.choose_if.length === 0) {
    return (
      <div
        className="rounded-md p-3"
        style={{ background: "var(--surface-2)", borderTop: `2px solid ${color}` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color }}>
          Choose {tool.name} when…
        </p>
        <p className="text-[10px] text-[var(--text-muted)] italic">No signals added yet</p>
      </div>
    );
  }
  return (
    <div
      className="rounded-md p-3"
      style={{ background: "var(--surface-2)", borderTop: `2px solid ${color}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color }}>
        Choose {tool.name} when…
      </p>
      <ul className="space-y-1.5">
        {tool.choose_if.map((signal, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-[9px] mt-0.5 flex-shrink-0" style={{ color }}>
              •
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] leading-snug">{signal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
