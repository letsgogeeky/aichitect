"use client";

import { useState, useEffect, useRef } from "react";
import { useGenomeData } from "../GenomeContext";
import { INPUT_TABS, InputTab } from "../genomeConstants";
import { detectTools, ProjectSnapshot } from "@/lib/parseStack";
import { getCategoryColor } from "@/lib/types";
import { ProgressDots } from "./ProgressDots";

export function ScanStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (detectedIds: string[]) => void;
}) {
  const { allTools } = useGenomeData();
  const [activeTab, setActiveTab] = useState<InputTab>("package.json");
  const [inputs, setInputs] = useState<Record<InputTab, string>>({
    "package.json": "",
    "requirements.txt": "",
    "pyproject.toml": "",
    ".env.example": "",
  });
  const [previewIds, setPreviewIds] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const hasAny = Object.values(inputs).some((v) => v.trim().length > 0);
      if (!hasAny) {
        setPreviewIds([]);
        return;
      }
      const snapshot: ProjectSnapshot = {
        packageJson: inputs["package.json"] || undefined,
        requirementsTxt: inputs["requirements.txt"] || undefined,
        pyprojectToml: inputs["pyproject.toml"] || undefined,
        envExample: inputs[".env.example"] || undefined,
      };
      const results = detectTools(snapshot, allTools);
      setPreviewIds(results.map((r) => r.toolId));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputs, allTools]);

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
          <ProgressDots total={2} current={1} />
        </div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#555577",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Step 2 of 2 — Scan your codebase
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
                  fontSize: 12,
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
                  <span style={{ color: "var(--accent-2)", fontSize: 10 }}>✓</span>
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
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#555577",
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => onNext([])}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                color: "#555577",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                padding: 0,
              }}
            >
              Skip to results
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

      {/* Live detection preview */}
      {previewIds.length > 0 ? (
        <div
          style={{
            marginTop: 14,
            width: "100%",
            maxWidth: 560,
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#555577",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Detected so far — {previewIds.length} tool{previewIds.length !== 1 ? "s" : ""}
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {previewIds.map((id) => {
              const tool = allTools.find((t) => t.id === id);
              if (!tool) return null;
              const color = getCategoryColor(tool.category);
              return (
                <span
                  key={id}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color,
                    background: color + "18",
                    border: `1px solid ${color}33`,
                    borderRadius: 5,
                    padding: "3px 9px",
                  }}
                >
                  {tool.name}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ marginTop: 20, fontSize: 12, color: "#333355" }}>
          All processing is client-side — nothing leaves your browser.
        </p>
      )}
    </div>
  );
}
