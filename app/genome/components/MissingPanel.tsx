import { PRIORITY_COLOR } from "../genomeConstants";
import { GenomeReport } from "@/lib/genomeAnalysis";
import { getCategoryColor, Tool } from "@/lib/types";

export function MissingPanel({
  report,
  onLearnMore,
}: {
  report: GenomeReport;
  onLearnMore: (tool: Tool) => void;
}) {
  const visible = report.missingSlots.filter((m) => m.priority !== "optional");
  if (visible.length === 0) return null;

  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#555577",
          margin: "0 0 8px",
        }}
      >
        Missing layers
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.map((m) => {
          const color = PRIORITY_COLOR[m.priority];
          return (
            <div
              key={m.slotId}
              style={{
                borderRadius: 8,
                padding: "10px 12px",
                background: "var(--surface)",
                border: `1px solid ${color}33`,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                  marginTop: 5,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#f0f0f8" }}>
                    {m.slotName}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: color + "cc",
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: color + "18",
                    }}
                  >
                    {m.priority}
                  </span>
                </div>
                {m.suggestTool && (
                  <p style={{ fontSize: 11, color: "#8888aa", margin: 0 }}>
                    Consider{" "}
                    <span
                      style={{ color: getCategoryColor(m.suggestTool.category), fontWeight: 500 }}
                    >
                      {m.suggestTool.name}
                    </span>
                    {m.suggestReason && ` — ${m.suggestReason}`}
                  </p>
                )}
              </div>
              {m.suggestTool && (
                <button
                  onClick={() => onLearnMore(m.suggestTool!)}
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "#8888aa",
                    background: "#ffffff08",
                    border: "1px solid #1e1e2e",
                    borderRadius: 6,
                    padding: "3px 8px",
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  Learn more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
