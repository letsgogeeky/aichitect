"use client";

import { useState } from "react";
import type { GenomeReport } from "@/lib/genomeAnalysis";
import type { ChallengeItem, ChallengeInput, ChallengeOutput } from "@/lib/ai/challenge";
import { SITE_URL } from "@/lib/constants";

interface ChallengePanelProps {
  report: GenomeReport;
  allIds: string[];
}

type ChallengeState = "idle" | "loading" | "done" | "error" | "rate-limited";

const ACCENT = "#7c6bff";

export function ChallengePanel({ report, allIds }: ChallengePanelProps) {
  const [state, setState] = useState<ChallengeState>("idle");
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [copied, setCopied] = useState(false);

  async function requestChallenge() {
    setState("loading");

    const payload: ChallengeInput = {
      filledSlots: report.filledSlots.map((s) => ({
        slotName: s.slotName,
        toolName: s.tool.name,
      })),
      missingRequired: report.missingSlots
        .filter((s) => s.priority === "required")
        .map((s) => s.slotName),
      tier: report.tier,
      fitnessScore: report.fitnessScore,
      archetype: report.archetype,
    };

    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setState("rate-limited");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ChallengeOutput = await res.json();
      setChallenges(data.challenges);
      setState("done");
    } catch {
      setState("error");
    }
  }

  function handleRedo() {
    setChallenges([]);
    setState("idle");
  }

  function copyResult() {
    const genomeUrl = `${SITE_URL}/genome?deps=${allIds.join(",")}`;
    const lines = challenges.map((c) => `${c.tool}: ${c.challenge} → ${c.recommendation}`);
    const text = `My AI stack was challenged on AIchitect:\n\n${lines.join("\n\n")}\n\n${genomeUrl}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareOnX() {
    const genomeUrl = `${SITE_URL}/genome?deps=${allIds.join(",")}`;
    const preview =
      challenges.length > 0
        ? `"${challenges[0].tool}: ${challenges[0].challenge}"`
        : "Challenged my AI stack choices";
    const tweet = `I challenged my AI stack on @aichitect_dev ⚔️\n\n${preview}\n\n${genomeUrl}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${ACCENT}22`,
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
          borderBottom: state === "done" ? `1px solid ${ACCENT}22` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13 }}>⚔️</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: ACCENT,
            }}
          >
            Challenge my stack
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#555577",
              fontStyle: "italic",
            }}
          >
            argue against each choice
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {state === "idle" && (
            <button
              onClick={requestChallenge}
              style={{
                padding: "4px 12px",
                height: 28,
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 500,
                background: `${ACCENT}18`,
                border: `1px solid ${ACCENT}44`,
                color: ACCENT,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Challenge
            </button>
          )}

          {state === "loading" && (
            <span style={{ fontSize: 12, color: "#555577" }}>analyzing choices…</span>
          )}

          {(state === "error" || state === "rate-limited") && (
            <button
              onClick={requestChallenge}
              style={{
                padding: "4px 12px",
                height: 28,
                borderRadius: 7,
                fontSize: 12,
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
                onClick={handleRedo}
                style={{
                  padding: "4px 12px",
                  height: 28,
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  background: "#ffffff08",
                  border: "1px solid #1e1e2e",
                  color: "#8888aa",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Re-challenge
              </button>
              <button
                onClick={shareOnX}
                style={{
                  padding: "4px 12px",
                  height: 28,
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  background: `${ACCENT}18`,
                  border: `1px solid ${ACCENT}44`,
                  color: ACCENT,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Share on X
              </button>
              <button
                onClick={copyResult}
                style={{
                  padding: "4px 12px",
                  height: 28,
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  background: copied ? "#00d4aa18" : "#ffffff08",
                  border: `1px solid ${copied ? "#00d4aa44" : "#1e1e2e"}`,
                  color: copied ? "#00d4aa" : "#8888aa",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Challenge cards */}
      {state === "done" && challenges.length > 0 && (
        <div
          style={{
            padding: "14px 14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {challenges.map((item, i) => (
            <div
              key={i}
              style={{
                borderLeft: `2px solid ${ACCENT}55`,
                paddingLeft: 10,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: ACCENT,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {item.tool}
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "#f0f0f8",
                }}
              >
                {item.challenge}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "#00d4aa",
                }}
              >
                → {item.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}

      {state === "error" && (
        <div style={{ padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#555577" }}>
            Failed to generate challenge. Make sure GOOGLE_AI_API_KEY is set.
          </p>
        </div>
      )}

      {state === "rate-limited" && (
        <div style={{ padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#fdcb6e" }}>
            Rate limit reached. Wait a moment before trying again.
          </p>
        </div>
      )}
    </div>
  );
}
