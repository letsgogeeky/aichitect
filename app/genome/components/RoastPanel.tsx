"use client";

import { useState } from "react";
import type { GenomeReport } from "@/lib/genomeAnalysis";
import type { RoastRequest, RoastResponse } from "@/app/api/roast/route";
import { SITE_URL } from "@/lib/constants";

interface RoastPanelProps {
  report: GenomeReport;
  allIds: string[];
}

type RoastState = "idle" | "loading" | "done" | "error";

export function RoastPanel({ report, allIds }: RoastPanelProps) {
  const [state, setState] = useState<RoastState>("idle");
  const [lines, setLines] = useState<string[]>([]);
  const [tweetCopied, setTweetCopied] = useState(false);

  async function requestRoast() {
    setState("loading");

    const payload: RoastRequest = {
      tools: report.detectedTools.map((t) => t.name),
      tier: report.tier,
      fitnessScore: report.fitnessScore,
      missingRequired: report.missingSlots
        .filter((s) => s.priority === "required")
        .map((s) => s.slotName),
      missingRecommended: report.missingSlots
        .filter((s) => s.priority === "recommended")
        .map((s) => s.slotName),
      criticalPairsCovered: report.criticalPairsCovered,
      criticalPairsTotal: report.criticalPairsTotal,
    };

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: RoastResponse = await res.json();
      setLines(data.lines);
      setState("done");
    } catch {
      setState("error");
    }
  }

  function shareRoast() {
    const genomeUrl = `${SITE_URL}/genome?deps=${allIds.join(",")}`;
    const roastText = lines.map((l) => `"${l}"`).join("\n");
    const tweet = `My AI stack just got roasted 🔥\n\n${roastText}\n\n${genomeUrl}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function copyRoast() {
    const genomeUrl = `${SITE_URL}/genome?deps=${allIds.join(",")}`;
    const roastText = lines.map((l) => `"${l}"`).join("\n");
    const tweet = `My AI stack just got roasted 🔥\n\n${roastText}\n\n${genomeUrl}`;
    navigator.clipboard.writeText(tweet).then(() => {
      setTweetCopied(true);
      setTimeout(() => setTweetCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid #2e1e1e",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: state === "done" ? "1px solid #2e1e1e" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13 }}>🔥</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#ff6b6b",
            }}
          >
            Roast my stack
          </span>
        </div>

        {state === "idle" && (
          <button
            onClick={requestRoast}
            style={{
              padding: "4px 12px",
              height: 28,
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 500,
              background: "#ff6b6b18",
              border: "1px solid #ff6b6b44",
              color: "#ff6b6b",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Get roasted
          </button>
        )}

        {state === "loading" && (
          <span style={{ fontSize: 11, color: "#555577" }}>reading your stack…</span>
        )}

        {state === "error" && (
          <button
            onClick={requestRoast}
            style={{
              padding: "4px 12px",
              height: 28,
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 500,
              background: "#ffffff08",
              border: "1px solid #1e1e2e",
              color: "#8888aa",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        )}

        {state === "done" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={shareRoast}
              style={{
                padding: "4px 12px",
                height: 28,
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 500,
                background: "#ff6b6b18",
                border: "1px solid #ff6b6b44",
                color: "#ff6b6b",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Share on X
            </button>
            <button
              onClick={copyRoast}
              style={{
                padding: "4px 12px",
                height: 28,
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 500,
                background: tweetCopied ? "#00d4aa18" : "#ffffff08",
                border: `1px solid ${tweetCopied ? "#00d4aa44" : "#1e1e2e"}`,
                color: tweetCopied ? "#00d4aa" : "#8888aa",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tweetCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* Roast lines */}
      {state === "done" && lines.length > 0 && (
        <div
          style={{
            padding: "14px 14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.55,
                color: "#f0f0f8",
                paddingLeft: 10,
                borderLeft: "2px solid #ff6b6b55",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      {state === "error" && (
        <div style={{ padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#555577" }}>
            Failed to generate roast. Make sure GOOGLE_AI_API_KEY is set.
          </p>
        </div>
      )}
    </div>
  );
}
