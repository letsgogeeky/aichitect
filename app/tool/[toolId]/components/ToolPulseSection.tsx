import type { BenchmarkPoint, ReliabilitySummary } from "@/lib/pulse";
import { formatRelativeTime } from "@/lib/format";
import { computeSparklinePath } from "@/lib/sparkline";

interface Props {
  reliability: ReliabilitySummary | null;
  benchmarkHistory: BenchmarkPoint[];
}

const SEV_COLOR = {
  minor: "#fdcb6e",
  major: "#ff6b6b",
  critical: "#ff3838",
  none: "#8888aa",
} as const;

const SPARK_W = 220;
const SPARK_H = 40;
const SPARK_PAD = 2;

function LatencySparkline({ points }: { points: BenchmarkPoint[] }) {
  const geom = computeSparklinePath(
    points.map((p) => p.ttft_p50_ms),
    { width: SPARK_W, height: SPARK_H, padding: SPARK_PAD }
  );

  if (!geom.path) return null;

  const stroke = geom.trendUp ? "#ff6b6b" : "#26de81"; // up = slower = bad
  const range = Math.max(1, geom.max - geom.min);
  const endpointY =
    SPARK_H - SPARK_PAD - ((geom.lastValue - geom.min) / range) * (SPARK_H - SPARK_PAD * 2);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          TTFT (last {geom.pointCount} runs)
        </span>
        <span className="font-mono text-xs tabular-nums" style={{ color: stroke }}>
          {geom.lastValue} ms
        </span>
      </div>
      <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} className="block">
        <path d={geom.path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
        <circle cx={SPARK_W - SPARK_PAD} cy={endpointY} r={2.5} fill={stroke} />
      </svg>
      <div className="flex justify-between text-[9px]" style={{ color: "var(--text-muted)" }}>
        <span>{geom.firstValue} ms</span>
        <span>
          min {geom.min} · max {geom.max}
        </span>
      </div>
    </div>
  );
}

function ReliabilityStrip({ reliability }: { reliability: ReliabilitySummary }) {
  const { total_90d, major_or_worse_90d, ongoing, last_major_at, recent } = reliability;

  if (total_90d === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs leading-snug" style={{ color: "var(--success)" }}>
          ● No incidents in the last 90 days
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="90d total" value={total_90d} />
        <Stat
          label="major+"
          value={major_or_worse_90d}
          tint={major_or_worse_90d > 0 ? "#ff6b6b" : undefined}
        />
        <Stat label="ongoing" value={ongoing} tint={ongoing > 0 ? "#fdcb6e" : undefined} />
      </div>
      {last_major_at && (
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          Last major incident {formatRelativeTime(last_major_at)}
        </p>
      )}
      {recent.length > 0 && (
        <ul className="space-y-1.5">
          {recent.map((inc) => (
            <li key={inc.id}>
              <a
                href={inc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded px-2 py-1.5 text-[11px] leading-snug transition-colors hover:bg-[var(--surface-2)]"
                style={{ borderLeft: `2px solid ${SEV_COLOR[inc.severity]}` }}
              >
                <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                  {inc.title}
                </span>
                <span className="ml-2 text-[9px]" style={{ color: "var(--text-muted)" }}>
                  {formatRelativeTime(inc.started_at)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <div className="rounded-lg px-2 py-1.5" style={{ background: "var(--surface-2)" }}>
      <div
        className="font-mono text-base font-semibold tabular-nums"
        style={{ color: tint ?? "var(--text-primary)" }}
      >
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}

export function ToolPulseSection({ reliability, benchmarkHistory }: Props) {
  const hasReliability = reliability !== null;
  const hasBenchmarks = benchmarkHistory.length >= 2;

  if (!hasReliability && !hasBenchmarks) return null;

  return (
    <section
      className="rounded-xl p-5 space-y-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        Pulse
      </h2>

      {hasBenchmarks && <LatencySparkline points={benchmarkHistory} />}

      {hasReliability && hasBenchmarks && (
        <div className="border-t" style={{ borderColor: "var(--border)" }} />
      )}

      {hasReliability && <ReliabilityStrip reliability={reliability!} />}
    </section>
  );
}
