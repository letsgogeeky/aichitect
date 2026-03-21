"use client";

import { useState } from "react";
import Link from "next/link";
import { useGenomeData } from "../GenomeContext";
import { GenomeReport } from "@/lib/genomeAnalysis";
import { getCategoryColor } from "@/lib/types";
import { FitnessGauge } from "./FitnessGauge";
import { Stat } from "./Stat";
import { SlotGrid } from "./SlotGrid";
import { MissingPanel } from "./MissingPanel";

export function ResultsView({
  report,
  allIds,
  onReset,
}: {
  report: GenomeReport;
  allIds: string[];
  onReset: () => void;
}) {
  const { allSlots } = useGenomeData();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/genome?deps=${allIds.join(",")}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href={`/builder?s=${allIds.join(",")}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              height: 32,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              background: "#7c6bff18",
              border: "1px solid #7c6bff44",
              color: "#7c6bff",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Open in Builder →
          </Link>
          <button
            onClick={copyLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "0 14px",
              height: 32,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              background: copied ? "#00d4aa30" : "#00d4aa18",
              border: `1px solid ${copied ? "#00d4aa88" : "#00d4aa44"}`,
              color: "#00d4aa",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Share genome"}
          </button>
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
              background: "#0e0e18",
              border: "1px solid #1e1e2e",
              borderRadius: 12,
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <FitnessGauge score={report.fitnessScore} tier={report.tier} />
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
                value={`${report.filledSlots.length} / ${allSlots.length}`}
              />
              <Stat
                label="Integration pairs"
                value={`${report.criticalPairsCovered} / ${report.criticalPairsTotal}`}
              />
            </div>
          </div>

          {/* Tool list */}
          <div
            style={{
              background: "#0e0e18",
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
              Stack genome — {report.filledSlots.length} of {allSlots.length} slots filled
            </p>
            <SlotGrid report={report} />
          </div>

          <MissingPanel report={report} />
        </div>
      </div>
    </div>
  );
}
