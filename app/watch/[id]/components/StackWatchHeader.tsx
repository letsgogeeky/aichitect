"use client";

import { useState } from "react";
import Link from "next/link";
import { SavedStack } from "@/lib/types";
import { GenomeReport, TIER_COLORS } from "@/lib/genomeAnalysis";

interface Props {
  stack: SavedStack;
  report: GenomeReport;
}

export function StackWatchHeader({ stack, report }: Props) {
  const [copied, setCopied] = useState(false);
  const tierColor = TIER_COLORS[report.tier];

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const filledCount = report.filledSlots.length;
  const totalSlots = report.filledSlots.length + report.missingSlots.length;

  return (
    <div>
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-xs mb-6"
        style={{ color: "var(--text-muted)" }}
      >
        <Link href="/" className="hover:underline">
          AIchitect
        </Link>
        <span>/</span>
        <Link href="/builder" className="hover:underline">
          Builder
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{stack.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          {/* Tier badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: tierColor + "18",
                border: `1px solid ${tierColor}44`,
                color: tierColor,
              }}
            >
              {report.tier}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {report.fitnessScore}/100
            </span>
          </div>

          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {stack.name}
          </h1>

          <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
            {filledCount} of {totalSlots} slots filled
            {report.missingSlots.filter((m) => m.priority === "required").length > 0 && (
              <span style={{ color: "#ff6b6b" }}>
                {" "}
                · {report.missingSlots.filter((m) => m.priority === "required").length} required gap
                {report.missingSlots.filter((m) => m.priority === "required").length !== 1
                  ? "s"
                  : ""}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: copied ? "#26de8118" : "var(--surface)",
              border: `1px solid ${copied ? "#26de8144" : "var(--border)"}`,
              color: copied ? "#26de81" : "var(--text-secondary)",
            }}
          >
            {copied ? "Copied!" : "Share"}
          </button>
          <Link
            href={`/builder?s=${stack.tool_ids.join(",")}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: "#7c6bff18",
              border: "1px solid #7c6bff33",
              color: "var(--accent)",
            }}
          >
            Edit in Builder →
          </Link>
        </div>
      </div>
    </div>
  );
}
