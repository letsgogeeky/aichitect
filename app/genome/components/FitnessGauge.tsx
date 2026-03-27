import { GenomeTier, TIER_COLORS } from "@/lib/genomeAnalysis";

export function FitnessGauge({ score, tier }: { score: number; tier: GenomeTier }) {
  const color = TIER_COLORS[tier];
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 104, height: 104 }}>
        <svg width="104" height="104" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="52" cy="52" r={r} fill="none" stroke="#1e1e2e" strokeWidth="8" />
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 700, color: "#f0f0f8", lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 10, color: "#8888aa", marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <div
        style={{
          padding: "2px 10px",
          borderRadius: 20,
          fontSize: 10,
          fontWeight: 600,
          background: color + "18",
          border: `1px solid ${color}44`,
          color,
        }}
      >
        {tier}
      </div>
    </div>
  );
}
