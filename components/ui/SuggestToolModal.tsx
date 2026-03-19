"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, CategoryId } from "@/lib/types";
import toolsData from "@/data/tools.json";
import { Tool } from "@/lib/types";
import { GITHUB_URL, GITHUB_SUGGEST_URL, SITE_URL } from "@/lib/constants";

const allTools = toolsData as Tool[];

function findDuplicates(name: string): Tool[] {
  if (!name || name.length < 2) return [];
  const q = name.toLowerCase().trim();
  return allTools.filter((t) => {
    const tn = t.name.toLowerCase();
    return tn.includes(q) || q.includes(tn);
  });
}

interface FormData {
  name: string;
  website: string;
  github: string;
  category: CategoryId | "";
  tagline: string;
  isOss: boolean;
  hasFreeTier: boolean;
  startingPrice: string;
}

const INITIAL: FormData = {
  name: "",
  website: "",
  github: "",
  category: "",
  tagline: "",
  isOss: false,
  hasFreeTier: false,
  startingPrice: "",
};

// --- Step components ---

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 11,
        fontWeight: 500,
        color: "#8888aa",
        marginBottom: 5,
        letterSpacing: 0.3,
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 10px",
        borderRadius: 7,
        background: "#1c1c28",
        border: "1px solid #2a2a3a",
        color: "#f0f0f8",
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function Toggle({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        background: value ? accent + "15" : "#1c1c28",
        border: `1px solid ${value ? accent + "50" : "#2a2a3a"}`,
        color: value ? accent : "#8888aa",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "background 150ms, border-color 150ms, color 150ms",
      }}
    >
      <div
        style={{
          width: 32,
          height: 18,
          borderRadius: 9,
          background: value ? accent : "#2a2a3a",
          position: "relative",
          flexShrink: 0,
          transition: "background 150ms",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: value ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 150ms",
          }}
        />
      </div>
      {label}
    </button>
  );
}

function Step1({
  form,
  update,
  dupes,
}: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  dupes: Tool[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <FieldLabel>Tool name *</FieldLabel>
        <TextInput
          value={form.name}
          onChange={(v) => update("name", v)}
          placeholder="e.g. Dify, Flowise, Rivet…"
        />
        {dupes.length > 0 && (
          <div
            style={{
              marginTop: 6,
              padding: "7px 10px",
              borderRadius: 6,
              background: "#ff9f4318",
              border: "1px solid #ff9f4340",
              fontSize: 11,
              color: "#ff9f43",
            }}
          >
            Heads up —{" "}
            {dupes.map((d) => (
              <strong key={d.id}>{d.name}</strong>
            ))}{" "}
            {dupes.length === 1 ? "is" : "are"} already in AIchitect. Still a different tool?
            Continue anyway.
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Website</FieldLabel>
        <TextInput
          value={form.website}
          onChange={(v) => update("website", v)}
          placeholder="https://…"
          type="url"
        />
      </div>

      <div>
        <FieldLabel>GitHub URL</FieldLabel>
        <TextInput
          value={form.github}
          onChange={(v) => update("github", v)}
          placeholder="https://github.com/org/repo (optional)"
          type="url"
        />
        <p style={{ marginTop: 4, fontSize: 10, color: "#555577" }}>
          Providing a GitHub URL will auto-flag the tool as Open Source in the next step.
        </p>
      </div>
    </div>
  );
}

function Step2({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <FieldLabel>Category *</FieldLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
          }}
        >
          {CATEGORIES.map((cat) => {
            const active = form.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => update("category", cat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 9px",
                  borderRadius: 7,
                  background: active ? cat.color + "20" : "#1c1c28",
                  border: `1px solid ${active ? cat.color + "60" : "#2a2a3a"}`,
                  color: active ? cat.color : "#8888aa",
                  fontSize: 11,
                  fontWeight: active ? 500 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 120ms, border-color 120ms, color 120ms",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: cat.color,
                    flexShrink: 0,
                    opacity: active ? 1 : 0.4,
                  }}
                />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>
          Tagline *{" "}
          <span style={{ fontWeight: 400, textTransform: "none" }}>({form.tagline.length}/80)</span>
        </FieldLabel>
        <input
          type="text"
          value={form.tagline}
          maxLength={80}
          onChange={(e) => update("tagline", e.target.value)}
          placeholder="One punchy line — what does it do?"
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 7,
            background: "#1c1c28",
            border: "1px solid #2a2a3a",
            color: "#f0f0f8",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

function Step3({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  // Auto-flip isOss when GitHub is provided
  const githubProvided = form.github.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Toggle
        label="Open Source"
        value={form.isOss || githubProvided}
        onChange={(v) => update("isOss", v)}
        accent="#26de81"
      />
      <Toggle
        label="Has a Free Tier"
        value={form.hasFreeTier}
        onChange={(v) => update("hasFreeTier", v)}
        accent="#00d4aa"
      />
      <div style={{ marginTop: 4 }}>
        <FieldLabel>Starting paid price (optional)</FieldLabel>
        <TextInput
          value={form.startingPrice}
          onChange={(v) => update("startingPrice", v)}
          placeholder="e.g. $20/mo, $49/mo, free…"
        />
      </div>
    </div>
  );
}

function PreviewCard({ form, color }: { form: FormData; color: string }) {
  const isOss = form.isOss || form.github.trim().length > 0;
  const catLabel = CATEGORIES.find((c) => c.id === form.category)?.label ?? form.category;

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${color}80`,
        background: "#0e0e18",
        overflow: "hidden",
        boxShadow: `0 0 20px ${color}15`,
      }}
    >
      {/* Colored accent strip */}
      <div style={{ height: 2, background: color }} />

      <div style={{ padding: "10px 12px 12px" }}>
        {/* Category row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: color,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {catLabel}
          </span>
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#f0f0f8",
            marginBottom: 6,
          }}
        >
          {form.name || "Tool Name"}
        </div>

        {/* Tags */}
        {(isOss || form.hasFreeTier) && (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            {isOss && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#26de8120",
                  color: "#26de81",
                  border: "1px solid #26de8140",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                ◆ Open Source
              </span>
            )}
            {form.hasFreeTier && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#00d4aa15",
                  color: "#00d4aa",
                  border: "1px solid #00d4aa40",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                ✦ Free Tier
              </span>
            )}
          </div>
        )}

        {/* Tagline */}
        <p
          style={{
            fontSize: 11,
            color: "#8888aa",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {form.tagline || "Your tagline will appear here…"}
        </p>

        {/* Price */}
        {form.startingPrice && (
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 12,
                border: "1px solid #2a2a3a",
                color: "#555577",
              }}
            >
              {form.startingPrice}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Step4({ form, color, onSubmit }: { form: FormData; color: string; onSubmit: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ fontSize: 11, color: "#8888aa", marginBottom: 10 }}>
          Here&apos;s how your tool card will look in the graph:
        </p>
        <PreviewCard form={form} color={color} />
      </div>

      <div
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          background: "#1c1c28",
          border: "1px solid #2a2a3a",
          fontSize: 11,
          color: "#8888aa",
          lineHeight: 1.5,
        }}
      >
        Clicking <strong style={{ color: "#f0f0f8" }}>Open GitHub Issue</strong> opens a pre-filled
        issue in a new tab. You&apos;ll need a GitHub account to submit — or{" "}
        <a
          href={GITHUB_SUGGEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#7c6bff", textDecoration: "underline" }}
        >
          browse existing suggestions
        </a>{" "}
        to upvote one.
      </div>
    </div>
  );
}

function SuccessView({
  toolName,
  onClose,
  onAnother,
}: {
  toolName: string;
  onClose: () => void;
  onAnother: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 12,
        padding: "16px 0",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#7c6bff22",
          border: "1px solid #7c6bff44",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        ✓
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f8", margin: 0 }}>
          Issue opened for <span style={{ color: "#7c6bff" }}>{toolName}</span>
        </p>
        <p
          style={{
            fontSize: 11,
            color: "#8888aa",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          Thanks for contributing to the dataset. Every suggestion helps make AIchitect more
          complete.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={onAnother}
          style={{
            padding: "7px 14px",
            borderRadius: 7,
            fontSize: 12,
            background: "#1c1c28",
            border: "1px solid #2a2a3a",
            color: "#8888aa",
            cursor: "pointer",
          }}
        >
          Suggest another
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "7px 14px",
            borderRadius: 7,
            fontSize: 12,
            background: "#7c6bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

// --- Main modal ---

interface Props {
  onClose: () => void;
  prefillName?: string;
}

const TOTAL_STEPS = 4;

export default function SuggestToolModal({ onClose, prefillName = "" }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...INITIAL, name: prefillName });
  const [submitted, setSubmitted] = useState(false);

  const dupes = findDuplicates(form.name);

  const categoryColor = CATEGORIES.find((c) => c.id === form.category)?.color ?? "#7c6bff";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canAdvance(): boolean {
    if (step === 1) return form.name.trim().length >= 2;
    if (step === 2) return form.category !== "" && form.tagline.trim().length >= 5;
    return true;
  }

  function buildIssueUrl(): string {
    const isOss = form.isOss || form.github.trim().length > 0;
    const title = `Tool Suggestion: ${form.name}`;
    const jsonBlock = JSON.stringify(
      {
        id: "",
        name: form.name,
        category: form.category,
        tagline: form.tagline,
        description: "",
        type: isOss ? "oss" : "commercial",
        pricing: {
          free_tier: form.hasFreeTier,
          plans: form.startingPrice ? [{ name: "Paid", price: form.startingPrice }] : [],
        },
        github_stars: null,
        slot: "",
        urls: {
          website: form.website || null,
          github: form.github || null,
        },
      },
      null,
      2
    );

    const rows = [
      `| Website | ${form.website || "N/A"} |`,
      `| GitHub | ${form.github || "N/A"} |`,
      `| Category | \`${form.category}\` |`,
      `| Type | ${isOss ? "Open Source" : "Commercial"} |`,
      `| Free Tier | ${form.hasFreeTier ? "Yes" : "No"} |`,
      `| Tagline | ${form.tagline} |`,
      form.startingPrice ? `| Starting Price | ${form.startingPrice} |` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const body = [
      `## Tool Suggestion: ${form.name}`,
      "",
      `| Field | Value |`,
      `|---|---|`,
      rows,
      "",
      "---",
      "",
      "**JSON block (paste into tools.json):**",
      "```json",
      jsonBlock,
      "```",
      "",
      `*Submitted via [aichitect.dev](${SITE_URL})*`,
    ].join("\n");

    return `${GITHUB_URL}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=suggested-tool`;
  }

  function handleSubmit() {
    window.open(buildIssueUrl(), "_blank", "noopener,noreferrer");
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col rounded-xl overflow-hidden"
        style={{
          background: "#111118",
          border: "1px solid #2a2a3a",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #1e1e2e" }}
        >
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f8", margin: 0 }}>
              Suggest a Tool
            </h2>
            <p style={{ fontSize: 11, color: "#8888aa", marginTop: 3, marginBottom: 0 }}>
              Help grow the dataset — every submission counts
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              color: "#555577",
              fontSize: 16,
              lineHeight: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              marginTop: 2,
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div
            className="flex items-center gap-1.5 flex-shrink-0"
            style={{ padding: "12px 20px 0" }}
          >
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 2,
                  borderRadius: 2,
                  background: i < step ? "#7c6bff" : "#2a2a3a",
                  transition: "background 200ms",
                }}
              />
            ))}
          </div>
        )}

        {/* Step label */}
        {!submitted && (
          <p
            style={{
              fontSize: 10,
              color: "#555577",
              padding: "6px 20px 0",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              flexShrink: 0,
            }}
          >
            Step {step} of {TOTAL_STEPS} —{" "}
            {step === 1
              ? "Discovery"
              : step === 2
                ? "Classify"
                : step === 3
                  ? "Pricing"
                  : "Preview"}
          </p>
        )}

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {submitted ? (
            <SuccessView
              toolName={form.name}
              onClose={onClose}
              onAnother={() => {
                setForm(INITIAL);
                setStep(1);
                setSubmitted(false);
              }}
            />
          ) : step === 1 ? (
            <Step1 form={form} update={update} dupes={dupes} />
          ) : step === 2 ? (
            <Step2 form={form} update={update} />
          ) : step === 3 ? (
            <Step3 form={form} update={update} />
          ) : (
            <Step4 form={form} color={categoryColor} onSubmit={handleSubmit} />
          )}
        </div>

        {/* Footer nav */}
        {!submitted && (
          <div
            className="flex items-center justify-between flex-shrink-0"
            style={{
              padding: "12px 20px 16px",
              borderTop: "1px solid #1e1e2e",
            }}
          >
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  fontSize: 12,
                  color: "#8888aa",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={() => {
                  if (canAdvance()) setStep((s) => s + 1);
                }}
                disabled={!canAdvance()}
                style={{
                  padding: "7px 18px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  background: canAdvance() ? "#7c6bff" : "#2a2a3a",
                  color: canAdvance() ? "#fff" : "#555577",
                  border: "none",
                  cursor: canAdvance() ? "pointer" : "not-allowed",
                  transition: "background 150ms, color 150ms",
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                style={{
                  padding: "7px 18px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  background: "#7c6bff",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Open GitHub Issue ↗
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
