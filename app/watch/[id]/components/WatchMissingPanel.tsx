import { GenomeReport } from "@/lib/genomeAnalysis";
import { getCategoryColor } from "@/lib/types";
import { PRIORITY_COLOR } from "@/app/genome/genomeConstants";

interface Props {
  report: GenomeReport;
}

export function WatchMissingPanel({ report }: Props) {
  const visible = report.missingSlots.filter((m) => m.priority !== "optional" || m.suggestTool);

  if (visible.length === 0) return null;

  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-4"
        style={{ color: "#555577" }}
      >
        Missing layers
      </p>
      <div className="space-y-2">
        {visible.map((m) => {
          const color = PRIORITY_COLOR[m.priority];
          const suggestColor = m.suggestTool ? getCategoryColor(m.suggestTool.category) : undefined;

          return (
            <div
              key={m.slotId}
              className="rounded-xl px-4 py-3 flex items-start gap-3"
              style={{
                background: "var(--surface)",
                border: `1px solid ${color}33`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {m.slotName}
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: color + "18", color: color + "cc" }}
                  >
                    {m.priority}
                  </span>
                </div>
                {m.suggestTool && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Consider{" "}
                    <span style={{ color: suggestColor, fontWeight: 500 }}>
                      {m.suggestTool.name}
                    </span>
                    {m.suggestReason && ` — ${m.suggestReason}`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
