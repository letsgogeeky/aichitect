"use client";

import { useState } from "react";
import { useGenomeData } from "../GenomeContext";
import { INPUT_TABS, InputTab } from "../genomeConstants";
import { detectTools, ProjectSnapshot } from "@/lib/parseStack";
import { ProgressDots } from "./ProgressDots";

export function ScanStep({ onNext }: { onNext: (detectedIds: string[]) => void }) {
  const { allTools } = useGenomeData();
  const [activeTab, setActiveTab] = useState<InputTab>("package.json");
  const [inputs, setInputs] = useState<Record<InputTab, string>>({
    "package.json": "",
    "requirements.txt": "",
    "pyproject.toml": "",
    ".env.example": "",
  });

  function handleNext() {
    const snapshot: ProjectSnapshot = {
      packageJson: inputs["package.json"] || undefined,
      requirementsTxt: inputs["requirements.txt"] || undefined,
      pyprojectToml: inputs["pyproject.toml"] || undefined,
      envExample: inputs[".env.example"] || undefined,
    };
    const results = detectTools(snapshot, allTools);
    onNext(results.map((r) => r.toolId));
  }

  return (
    <div
      className="flex flex-col items-center justify-center flex-1"
      style={{ padding: "48px 24px", minHeight: 0 }}
    >
      {/* Header */}
      <div className="text-center mb-8" style={{ maxWidth: 500 }}>
        <div className="flex justify-center mb-4">
          <ProgressDots total={2} current={0} />
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#555577",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Step 1 of 2 — Scan your codebase
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#f0f0f8",
            margin: "0 0 8px",
            letterSpacing: -0.3,
          }}
        >
          What does your project use?
        </h1>
        <p style={{ fontSize: 13, color: "#8888aa", lineHeight: 1.6, margin: 0 }}>
          Paste your dependency file to auto-detect your LLM providers, frameworks, vector DBs, and
          observability tools.
        </p>
      </div>

      {/* Input card */}
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--surface)",
          border: "1px solid #1e1e2e",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "#1e1e2e", background: "#111118" }}>
          {INPUT_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const filled = !!inputs[tab.id].trim();
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 14px",
                  fontSize: 11,
                  fontWeight: active ? 500 : 400,
                  color: active ? "#f0f0f8" : filled ? "var(--accent-2)" : "#555577",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {filled && !active && (
                  <span style={{ color: "var(--accent-2)", fontSize: 9 }}>✓</span>
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Textarea */}
        <div style={{ padding: 16 }}>
          <textarea
            value={inputs[activeTab]}
            onChange={(e) => setInputs((p) => ({ ...p, [activeTab]: e.target.value }))}
            placeholder={INPUT_TABS.find((t) => t.id === activeTab)?.placeholder}
            spellCheck={false}
            style={{
              width: "100%",
              height: 180,
              resize: "none",
              background: "#0a0a0f",
              border: "1px solid #1e1e2e",
              borderRadius: 8,
              padding: "12px 14px",
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.6,
              color: "#f0f0f8",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#7c6bff66")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e2e")}
          />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t"
          style={{ borderColor: "#1e1e2e", padding: "12px 16px", background: "#111118" }}
        >
          <span style={{ fontSize: 11, color: "#555577" }}>
            Fill one or more tabs — more = better coverage
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => onNext([])}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                color: "#555577",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                padding: 0,
              }}
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: "0 20px",
                height: 34,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 11, color: "#333355" }}>
        All processing is client-side — nothing leaves your browser.
      </p>
    </div>
  );
}
