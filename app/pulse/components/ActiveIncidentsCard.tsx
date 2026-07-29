"use client";

import Link from "next/link";
import type { ActiveIncident } from "@/lib/pulse";
import { formatRelativeTime } from "@/lib/format";

interface Props {
  incidents: ActiveIncident[];
}

const SEVERITY_COLOR: Record<ActiveIncident["severity"], string> = {
  minor: "#fdcb6e",
  major: "#ff6b6b",
  critical: "#ff3838",
};

export function ActiveIncidentsCard({ incidents }: Props) {
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
          Active Incidents
        </h2>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          live · hourly
        </span>
      </div>

      {incidents.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--success)" }}>●</span> All tracked vendors are clear.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {incidents.map((inc) => {
            const sevColor = SEVERITY_COLOR[inc.severity];
            return (
              <li key={inc.id}>
                <a
                  href={inc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-md px-2 py-2 transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderLeft: `2px solid ${sevColor}` }}
                >
                  <div className="mb-0.5 flex items-center gap-2 text-xs">
                    <Link
                      href={`/tool/${inc.tool_id}`}
                      className="font-medium hover:underline"
                      style={{ color: "var(--text-primary)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {inc.tool_name}
                    </Link>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                      style={{
                        background: sevColor + "22",
                        color: sevColor,
                        border: `1px solid ${sevColor}44`,
                      }}
                    >
                      {inc.severity}
                    </span>
                    <span className="ml-auto text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {formatRelativeTime(inc.started_at)}
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
                    {inc.title}
                  </p>
                  {inc.scope.length > 0 && (
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {inc.scope.slice(0, 3).join(" · ")}
                      {inc.scope.length > 3 && ` +${inc.scope.length - 3}`}
                    </p>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
