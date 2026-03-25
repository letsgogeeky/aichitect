"use client";

import { useState } from "react";
import type { GenomeReport } from "@/lib/genomeAnalysis";
import type { RoastRequest, RoastResponse } from "@/app/api/roast/route";
import { SITE_URL } from "@/lib/constants";

interface RoastPanelProps {
  report: GenomeReport;
  allIds: string[];
}

type RoastState = "idle" | "loading" | "done" | "error" | "rate-limited";

const ROAST_LEVELS = [
  { level: 1, name: "Gentle Nudge", color: "#00d4aa" },
  { level: 2, name: "Honest Opinion", color: "#7c6bff" },
  { level: 3, name: "No Mercy", color: "#fd9644" },
  { level: 4, name: "Brutally Honest", color: "#ff6b6b" },
  { level: 5, name: "Full Destruction", color: "#ff2255" },
] as const;

const DEFAULT_LEVEL = 3;

export function RoastPanel({ report, allIds }: RoastPanelProps) {
  const [state, setState] = useState<RoastState>("idle");
  const [lines, setLines] = useState<string[]>([]);
  const [tweetCopied, setTweetCopied] = useState(false);
  const [roastnessLevel, setRoastnessLevel] = useState(DEFAULT_LEVEL);

  const currentLevel = ROAST_LEVELS[roastnessLevel - 1];
  const accentColor =
    state === "done" ? currentLevel.color : state === "rate-limited" ? "#fdcb6e" : "#ff6b6b";

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
      roastnessLevel: roastnessLevel as 1 | 2 | 3 | 4 | 5,
    };

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setState("rate-limited");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: RoastResponse = await res.json();
      setLines(data.lines);
      setState("done");
    } catch {
      setState("error");
    }
  }

  function handleReRoast() {
    setLines([]);
    setState("idle");
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
        border: `1px solid ${accentColor}22`,
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
          borderBottom: state === "done" ? `1px solid ${accentColor}22` : "none",
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
              color: accentColor,
            }}
          >
            Roast my stack
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {state === "idle" && (
            <button
              onClick={requestRoast}
              style={{
                padding: "4px 12px",
                height: 28,
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 500,
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}44`,
                color: accentColor,
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

          {(state === "error" || state === "rate-limited") && (
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
            <>
              <button
                onClick={handleReRoast}
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
                  whiteSpace: "nowrap",
                }}
              >
                Re-roast
              </button>
              <button
                onClick={shareRoast}
                style={{
                  padding: "4px 12px",
                  height: 28,
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 500,
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}44`,
                  color: accentColor,
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
            </>
          )}
        </div>
      </div>

      {/* Slider — always visible */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: state === "done" ? `1px solid ${accentColor}22` : "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 10, color: "#555577", whiteSpace: "nowrap" }}>Gentle Nudge</span>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={roastnessLevel}
            disabled={state === "loading"}
            onChange={(e) => {
              setRoastnessLevel(Number(e.target.value));
              if (state === "done") setState("idle");
            }}
            style={{
              width: "100%",
              accentColor: currentLevel.color,
              cursor: state === "loading" ? "not-allowed" : "pointer",
            }}
          />
        </div>
        <span style={{ fontSize: 10, color: "#555577", whiteSpace: "nowrap" }}>
          Full Destruction
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: currentLevel.color,
            whiteSpace: "nowrap",
            minWidth: 90,
            textAlign: "right",
          }}
        >
          {currentLevel.name}
        </span>
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
                borderLeft: `2px solid ${accentColor}55`,
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

      {state === "rate-limited" && (
        <div style={{ padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#fdcb6e" }}>
            Rate limit reached. Wait a moment before trying again.
          </p>
        </div>
      )}
    </div>
  );
}
