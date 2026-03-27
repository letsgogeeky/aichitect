"use client";

import { useState } from "react";
import { useGenomeData } from "../GenomeContext";
import { detectGraduation } from "@/lib/graduationDetection";
import { SITE_URL } from "@/lib/constants";
import { getCategoryColor } from "@/lib/types";

const COMPLEXITY_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const COMPLEXITY_COLOR: Record<string, string> = {
  beginner: "#00d4aa",
  intermediate: "#7c6bff",
  advanced: "#26de81",
};

export function GraduationBanner({ allIds }: { allIds: string[] }) {
  const { allStacks, allTools } = useGenomeData();
  const [shared, setShared] = useState(false);

  const graduation = detectGraduation(allIds, allStacks);
  if (!graduation) return null;

  const { currentStack, targetStack, toolsToAdd } = graduation;
  const genomeUrl = `${SITE_URL}/genome?deps=${allIds.join(",")}`;
  const tweetText = `Just graduated my AI stack from "${currentStack.name}" to "${targetStack.name}" on @aichitect_dev 🎓\n\n${genomeUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  function handleShare() {
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    navigator.clipboard.writeText(tweetText).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  }

  const fromComplexity = currentStack.complexity ?? "beginner";
  const toComplexity = targetStack.complexity ?? "intermediate";
  const toColor = COMPLEXITY_COLOR[toComplexity] ?? "#7c6bff";

  return (
    <div
      style={{
        background: "#0e0e1a",
        border: `1px solid ${toColor}33`,
        borderRadius: 12,
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: toColor,
          }}
        >
          Ready to graduate
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f8", lineHeight: 1.3 }}>
          Your stack has outgrown <span style={{ color: "#8888aa" }}>{currentStack.name}</span>
        </span>
      </div>

      {/* FROM → TO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 8,
          background: "#ffffff06",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#555577",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            From
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#8888aa",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentStack.name}
          </span>
          <span
            style={{
              fontSize: 10,
              color: COMPLEXITY_COLOR[fromComplexity] ?? "#555577",
            }}
          >
            {COMPLEXITY_LABEL[fromComplexity]}
          </span>
        </div>

        <span style={{ fontSize: 14, color: "#333355", flexShrink: 0 }}>→</span>

        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: toColor,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            To
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#f0f0f8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {targetStack.name}
          </span>
          <span style={{ fontSize: 10, color: toColor }}>{COMPLEXITY_LABEL[toComplexity]}</span>
        </div>
      </div>

      {/* Tools to add */}
      {toolsToAdd.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#555577",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Consider adding
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {toolsToAdd.map((id) => {
              const tool = allTools.find((t) => t.id === id);
              const color = tool ? getCategoryColor(tool.category) : toColor;
              return (
                <span
                  key={id}
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color,
                    background: color + "18",
                    border: `1px solid ${color}33`,
                    borderRadius: 4,
                    padding: "2px 7px",
                  }}
                >
                  {tool?.name ?? id}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Share button */}
      <button
        onClick={handleShare}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
          background: shared ? "#26de8122" : toColor + "22",
          color: shared ? "#26de81" : toColor,
          transition: "all 150ms ease",
        }}
      >
        {shared ? "Shared!" : "Share milestone →"}
      </button>
    </div>
  );
}
