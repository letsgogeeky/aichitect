"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import DetailPanel from "@/components/panels/DetailPanel";
import { useGenomeData } from "../GenomeContext";
import { GenomeReport, GenomeTier, TIER_COLORS } from "@/lib/genomeAnalysis";
import { getCategoryColor, Tool, StackArchetype } from "@/lib/types";
import { SITE_URL } from "@/lib/constants";
import { detectGraduation } from "@/lib/graduationDetection";
import { FitnessGauge } from "./FitnessGauge";
import { Stat } from "./Stat";
import { SlotGrid } from "./SlotGrid";
import { MissingPanel } from "./MissingPanel";
import { GraduationBanner } from "./GraduationBanner";
import { RoastPanel } from "./RoastPanel";
import { ChallengePanel } from "./ChallengePanel";

function scoreNarrative(report: GenomeReport): string {
  const critical = report.missingSlots.filter((m) => m.priority === "required").length;
  const recommended = report.missingSlots.filter((m) => m.priority === "recommended").length;
  const tier = report.tier;

  if (tier === "Cutting-Edge") return "Your stack is firing on all cylinders.";
  if (tier === "Production-Grade") {
    return recommended > 0
      ? `Solid foundation — ${recommended} recommended layer${recommended !== 1 ? "s" : ""} left to close.`
      : "Production-ready across the board.";
  }
  if (tier === "Competent") {
    if (critical > 0)
      return `Essentials covered, but ${critical} critical gap${critical !== 1 ? "s" : ""} need attention.`;
    return `Good coverage — ${recommended} recommended layer${recommended !== 1 ? "s" : ""} would round this out.`;
  }
  if (tier === "Emerging") {
    return critical > 0
      ? `Getting there — ${critical} required layer${critical !== 1 ? "s" : ""} still missing.`
      : "A solid start. Fill in the recommended layers to level up.";
  }
  return "Just getting started. Add the required layers to build a real stack.";
}

const ARCHETYPE_LABEL: Record<StackArchetype, string> = {
  "dev-productivity": "Dev Productivity",
  "app-infrastructure": "App Infrastructure",
  hybrid: "Hybrid Stack",
};

const ARCHETYPE_COLOR: Record<StackArchetype, string> = {
  "dev-productivity": "#7c6bff",
  "app-infrastructure": "#00d4aa",
  hybrid: "#ff9f43",
};

function ArchetypeBadge({ archetype }: { archetype: StackArchetype }) {
  const color = ARCHETYPE_COLOR[archetype];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 6,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        fontSize: 10,
        fontWeight: 600,
        color,
        letterSpacing: "0.04em",
        alignSelf: "center",
      }}
    >
      {ARCHETYPE_LABEL[archetype]}
    </div>
  );
}

function ScoreNarrative({ report }: { report: GenomeReport }) {
  const color = TIER_COLORS[report.tier as GenomeTier];
  return (
    <p style={{ fontSize: 11, color: "#8888aa", margin: 0, lineHeight: 1.5, textAlign: "center" }}>
      <span style={{ color }}>{report.tier}:</span>{" "}
      {scoreNarrative(report).replace(/^[^:]+: ?/, "")}
    </p>
  );
}

export function ResultsView({
  report,
  allIds,
  onReset,
}: {
  report: GenomeReport;
  allIds: string[];
  onReset: () => void;
}) {
  const { allSlots, allStacks } = useGenomeData();
  const [copied, setCopied] = useState(false);
  const [detailTool, setDetailTool] = useState<Tool | null>(null);

  const graduation = detectGraduation(allIds, allStacks);
  const genomeUrl = `${SITE_URL}/genome?deps=${allIds.join(",")}`;

  const tweetText = graduation
    ? `Just graduated my AI stack from "${graduation.currentStack.name}" to "${graduation.targetStack.name}" on @aichitect_dev 🎓\n\n${genomeUrl}`
    : `My AI stack scored ${report.fitnessScore}/100 (${report.tier}) on @aichitect_dev 🧬\n\n${genomeUrl}`;

  function copyLink() {
    navigator.clipboard.writeText(genomeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareOnX() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {detailTool && (
        <Suspense fallback={null}>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {/* Backdrop */}
            <div
              onClick={() => setDetailTool(null)}
              style={{ position: "absolute", inset: 0, background: "#00000055" }}
            />
            {/* Panel */}
            <div
              style={{
                position: "relative",
                height: "100%",
                overflowY: "auto",
                zIndex: 1,
              }}
            >
              <DetailPanel tool={detailTool} onClose={() => setDetailTool(null)} />
            </div>
          </div>
        </Suspense>
      )}
      {/* Results header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          borderBottom: "1px solid #1e1e2e",
          padding: "11px 20px",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onReset}
            style={{
              background: "none",
              border: "none",
              fontSize: 11,
              color: "#8888aa",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Re-analyze
          </button>
          <span style={{ color: "#1e1e2e" }}>|</span>
          <span style={{ fontSize: 12, color: "#8888aa" }}>
            <span style={{ color: "#f0f0f8", fontWeight: 500 }}>{allIds.length}</span> tools in your
            genome
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={shareOnX}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "0 12px",
              height: 32,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              background: graduation ? "#26de8118" : "#7c6bff18",
              border: `1px solid ${graduation ? "#26de8144" : "#7c6bff44"}`,
              color: graduation ? "#26de81" : "var(--accent)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {graduation ? "Share graduation" : "Share on X"}
          </button>
          <button
            onClick={copyLink}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              height: 32,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              background: copied ? "#00d4aa18" : "#ffffff08",
              border: `1px solid ${copied ? "#00d4aa44" : "#1e1e2e"}`,
              color: copied ? "var(--accent-2)" : "#8888aa",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <Link
            href={`/builder?s=${allIds.join(",")}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              height: 32,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              background: "#ffffff08",
              border: "1px solid #1e1e2e",
              color: "#8888aa",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Open in Builder →
          </Link>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "22px 24px",
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* Left sidebar */}
        <div
          style={{
            width: 210,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "sticky",
            top: 0,
          }}
        >
          {/* Score */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid #1e1e2e",
              borderRadius: 12,
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ArchetypeBadge archetype={report.archetype} />
            <FitnessGauge score={report.fitnessScore} tier={report.tier} />
            <ScoreNarrative report={report} />
            <div
              style={{
                width: "100%",
                borderTop: "1px solid #1e1e2e",
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              <Stat
                label="Slots covered"
                value={`${report.filledSlots.length} / ${report.filledSlots.length + report.missingSlots.length}`}
              />
              <Stat
                label="Common pairings"
                value={`${report.criticalPairsCovered} / ${report.criticalPairsTotal}`}
              />
            </div>
          </div>

          {/* Score narrative */}
          <ScoreNarrative report={report} />

          {/* Tool list */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid #1e1e2e",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e1e2e" }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#555577",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Your tools
              </span>
            </div>
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {report.detectedTools.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: getCategoryColor(t.category),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#f0f0f8" }}>{t.name}</span>
                </div>
              ))}
              {report.detectedTools.length === 0 && (
                <p style={{ fontSize: 11, color: "#555577", margin: 0 }}>No tools detected</p>
              )}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <GraduationBanner allIds={allIds} />

          <RoastPanel report={report} allIds={allIds} />

          <ChallengePanel report={report} allIds={allIds} />

          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#555577",
                margin: "0 0 10px",
              }}
            >
              Stack genome — {report.filledSlots.length} of{" "}
              {report.filledSlots.length + report.missingSlots.length} slots filled
            </p>
            <SlotGrid report={report} />
          </div>

          <MissingPanel report={report} onLearnMore={setDetailTool} />
        </div>
      </div>
    </div>
  );
}
