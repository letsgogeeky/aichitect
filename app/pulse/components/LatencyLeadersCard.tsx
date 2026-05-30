import Link from "next/link";
import type { LatencyLeader } from "@/lib/pulse";
import { getCategoryColor, CATEGORIES } from "@/lib/types";

interface Props {
  leaders: LatencyLeader[];
}

export function LatencyLeadersCard({ leaders }: Props) {
  if (leaders.length === 0) return null;

  return (
    <section
      className="rounded-xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Latency Leaders
        </h2>
        <span
          className="text-[10px]"
          style={{ color: "var(--text-muted)" }}
          title="Median time-to-first-token from Artificial Analysis, refreshed weekly"
        >
          TTFT p50 · weekly
        </span>
      </div>
      <ol className="space-y-1.5">
        {leaders.map((t, i) => {
          const c = getCategoryColor(t.category);
          const catLabel = CATEGORIES.find((cat) => cat.id === t.category)?.label;
          return (
            <li key={t.id}>
              <Link
                href={`/tool/${t.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--surface-2)]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="w-4 text-[10px] tabular-nums"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate font-medium" style={{ color: "var(--text-primary)" }}>
                    {t.name}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wide"
                    style={{ color: c }}
                    title={catLabel}
                  >
                    ●
                  </span>
                </span>
                <span
                  className="flex-shrink-0 font-mono text-xs tabular-nums"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t.ttft_p50_ms} ms
                  {t.output_tokens_per_second != null && t.output_tokens_per_second > 0 && (
                    <span style={{ color: "var(--text-muted)" }}>
                      {" "}
                      · {t.output_tokens_per_second} tok/s
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Data via{" "}
        <a
          href="https://artificialanalysis.ai"
          rel="noopener noreferrer"
          target="_blank"
          className="underline"
        >
          Artificial Analysis
        </a>
      </p>
    </section>
  );
}
