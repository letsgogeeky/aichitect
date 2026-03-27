"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Tool, Stack, Relationship, Slot } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";
import { IconCopy, IconArrowRight, IconShare } from "@/components/icons";

const PRINT_STYLES = `
@media print {
  nav, .case-actions { display: none !important; }
  .case-graph { height: 280px !important; break-inside: avoid; }
  body { background: white !important; color: black !important; }
  a { color: inherit !important; text-decoration: none !important; }
}
`;

const StaticStackGraph = dynamic(() => import("@/components/graph/StaticStackGraph"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center text-xs"
      style={{ color: "var(--text-muted)" }}
    >
      Loading graph…
    </div>
  ),
});

interface CaseClientProps {
  toolIds: string[];
  stackId?: string;
  tools: Tool[];
  stacks: Stack[];
  relationships: Relationship[];
  slots: Slot[];
}

export function CaseClient({
  toolIds,
  stackId,
  tools,
  stacks,
  relationships,
  slots,
}: CaseClientProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  function exportPdf() {
    window.print();
  }

  function shareUrl() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      })
      .catch(() => {});
  }

  const curatedStack = stackId ? stacks.find((s) => s.id === stackId) : undefined;
  const effectiveToolIds = curatedStack ? curatedStack.tools : toolIds;

  const selectedTools = effectiveToolIds
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  // Group selected tools by slot
  const toolsBySlot = selectedTools.reduce<Record<string, Tool[]>>((acc, tool) => {
    if (!acc[tool.slot]) acc[tool.slot] = [];
    acc[tool.slot].push(tool);
    return acc;
  }, {});

  // For custom stacks: derive slot alternatives as rejection proxy
  const slotAlternatives: { slot: Slot; chosen: Tool; alternatives: Tool[] }[] = [];
  if (!curatedStack) {
    for (const [slotId, chosenTools] of Object.entries(toolsBySlot)) {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) continue;
      const chosenIds = new Set(chosenTools.map((t) => t.id));
      const alternatives = slot.tools
        .map((id) => tools.find((t) => t.id === id))
        .filter((t): t is Tool => !!t && !chosenIds.has(t.id))
        .slice(0, 3);
      for (const chosen of chosenTools) {
        slotAlternatives.push({ slot, chosen, alternatives });
      }
    }
  }

  // Graduation stack (curated only)
  const graduationStack = curatedStack?.graduates_to
    ? stacks.find((s) => s.id === curatedStack.graduates_to)
    : undefined;

  // Back URL
  const backUrl = curatedStack
    ? `/stacks?stack=${curatedStack.id}`
    : `/builder?s=${effectiveToolIds.join(",")}`;

  function buildMarkdown(): string {
    const lines: string[] = [];
    const title = curatedStack ? curatedStack.name : "My AI Stack";

    // ── Header ──
    lines.push(`# Make a case for ${title}`, "");
    if (curatedStack?.mission) {
      lines.push(`> ${curatedStack.mission}`, "");
    }
    lines.push("---", "");

    // ── Stack ──
    lines.push("## Stack", "");
    for (const tool of selectedTools) {
      const slot = slots.find((s) => s.id === tool.slot);
      const pricingNote = tool.pricing.free_tier
        ? "Free tier available"
        : tool.pricing.plans[0]?.price
          ? `From ${tool.pricing.plans[0].price}`
          : null;

      lines.push(`### ${tool.name}`);
      lines.push(
        `**${slot?.name ?? tool.slot}** · ${tool.type === "oss" ? "Open Source" : "Commercial"}${pricingNote ? ` · ${pricingNote}` : ""}`
      );
      lines.push("");
      lines.push(tool.description);
      if (tool.choose_if && tool.choose_if.length > 0) {
        lines.push("");
        lines.push("Choose this if:");
        for (const c of tool.choose_if) {
          lines.push(`- ${c}`);
        }
      }
      lines.push("");
    }
    lines.push("---", "");

    // ── Why this stack (curated) ──
    if (curatedStack?.why) {
      lines.push("## Why this stack", "", curatedStack.why, "", "---", "");
    }

    // ── Alternatives considered ──
    const rejections = curatedStack?.not_in_stack ?? [];
    if (rejections.length > 0) {
      lines.push("## What was considered and rejected", "");
      for (const r of rejections) {
        const tool = tools.find((t) => t.id === r.tool);
        lines.push(`**${tool?.name ?? r.tool}**`);
        lines.push(`Rejected because: ${r.reason}`);
        if (tool?.tagline) lines.push(`> ${tool.tagline}`);
        lines.push("");
      }
      lines.push("---", "");
    } else if (slotAlternatives.length > 0) {
      lines.push("## Alternatives considered", "");
      for (const { slot, chosen, alternatives } of slotAlternatives) {
        if (alternatives.length === 0) continue;
        lines.push(`### ${slot.name} → ${chosen.name}`);
        if (chosen.choose_if && chosen.choose_if.length > 0) {
          lines.push("");
          lines.push(`**Why ${chosen.name}:**`);
          for (const c of chosen.choose_if) {
            lines.push(`- ${c}`);
          }
        }
        lines.push("");
        lines.push("**What was passed on:**", "");
        for (const alt of alternatives) {
          lines.push(`**${alt.name}** — ${alt.tagline}`);
          if (alt.choose_if && alt.choose_if.length > 0) {
            lines.push(`Better if: ${alt.choose_if.slice(0, 2).join(" · ")}`);
          }
          lines.push("");
        }
      }
      lines.push("---", "");
    }

    // ── Tradeoffs ──
    if (curatedStack?.tradeoffs) {
      lines.push("## Tradeoffs", "", curatedStack.tradeoffs, "", "---", "");
    }

    // ── Kill conditions ──
    const killConditions = curatedStack?.kill_conditions ?? [];
    if (killConditions.length > 0) {
      lines.push("## When to move on", "");
      for (const k of killConditions) {
        lines.push(`- ${k}`);
      }
      lines.push("", "---", "");
    }

    // ── Graduation path ──
    if (graduationStack) {
      lines.push("## What's next", "");
      lines.push(`Graduate to: **${graduationStack.name}**`);
      if (graduationStack.description) lines.push("", graduationStack.description);
      lines.push("", "---", "");
    }

    lines.push(
      "*Built with [AIchitect](https://aichitect.dev) — cut the noise, pick your AI stack.*"
    );

    return lines.join("\n");
  }

  function copyMarkdown() {
    navigator.clipboard
      .writeText(buildMarkdown())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  if (selectedTools.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No tools selected. Go to the{" "}
          <Link href="/builder" style={{ color: "var(--accent)" }}>
            Builder
          </Link>{" "}
          and pick your stack first.
        </p>
      </div>
    );
  }

  const title = curatedStack ? curatedStack.name : "My AI Stack";
  const rejections = curatedStack?.not_in_stack ?? [];
  const killConditions = curatedStack?.kill_conditions ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-16">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-2 case-actions">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={shareUrl}
            className="flex items-center gap-1.5 shrink-0 transition-all"
            style={{
              padding: "0 12px",
              height: 32,
              borderRadius: 7,
              background: shared ? "#fdcb6e20" : "var(--surface-2)",
              border: `1px solid ${shared ? "#fdcb6e66" : "var(--border)"}`,
              color: shared ? "#fdcb6e" : "var(--text-muted)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <IconShare size={12} />
            {shared ? "Copied!" : "Share"}
          </button>
          <button
            onClick={copyMarkdown}
            className="flex items-center gap-1.5 shrink-0 transition-all"
            style={{
              padding: "0 12px",
              height: 32,
              borderRadius: 7,
              background: copied ? "#00d4aa20" : "var(--surface-2)",
              border: `1px solid ${copied ? "#00d4aa66" : "var(--border)"}`,
              color: copied ? "var(--accent-2)" : "var(--text-muted)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <IconCopy size={12} />
            {copied ? "Copied!" : "Copy as Markdown"}
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 shrink-0 transition-all"
            style={{
              padding: "0 12px",
              height: 32,
              borderRadius: 7,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            To PDF
          </button>
        </div>
      </div>

      {/* Intent banner */}
      <div
        className="rounded-xl px-4 py-3 mb-6 mt-4"
        style={{ background: "#7c6bff0e", border: "1px solid #7c6bff22" }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>Make a case</span> turns your
          stack into a shareable document — tools chosen, alternatives rejected, tradeoffs named,
          and exit conditions defined. Send it to your team or manager to get alignment without a
          meeting.
        </p>
      </div>

      {/* Title block */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {curatedStack?.mission && (
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {curatedStack.mission}
          </p>
        )}
        {/* Meta chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="chip">{selectedTools.length} tools</span>
          {curatedStack?.monthly_cost && (
            <span className="chip">{curatedStack.monthly_cost}/mo</span>
          )}
          {curatedStack?.complexity && (
            <span className="chip" style={{ textTransform: "capitalize" }}>
              {curatedStack.complexity}
            </span>
          )}
          {curatedStack?.archetype && (
            <span className="chip" style={{ textTransform: "capitalize" }}>
              {curatedStack.archetype.replace("-", " ")}
            </span>
          )}
        </div>
      </div>

      {/* Static graph snapshot */}
      <div
        className="case-graph w-full rounded-xl overflow-hidden mb-8"
        style={{
          height: 300,
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <StaticStackGraph
          toolIds={effectiveToolIds}
          allTools={tools}
          relationships={relationships}
        />
      </div>

      {/* Stack tools list */}
      <Section title="Stack">
        <div className="flex flex-col gap-2">
          {selectedTools.map((tool) => {
            const slot = slots.find((s) => s.id === tool.slot);
            const color = getCategoryColor(tool.category);
            return (
              <div
                key={tool.id}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div
                  className="shrink-0 mt-0.5 w-2 h-2 rounded-full"
                  style={{ background: color, marginTop: 6 }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {tool.name}
                    </span>
                    {slot && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: `${color}18`,
                          color: color,
                          border: `1px solid ${color}33`,
                        }}
                      >
                        {slot.name}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {tool.tagline}
                  </p>
                  {tool.choose_if && tool.choose_if.length > 0 && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                      Choose if: {tool.choose_if.join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Why this stack (curated only) */}
      {curatedStack?.why && (
        <Section title="Why this stack">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {curatedStack.why}
          </p>
        </Section>
      )}

      {/* Rejection reasoning */}
      {rejections.length > 0 && (
        <Section title="What was considered and rejected">
          <div className="flex flex-col gap-2">
            {rejections.map((r) => {
              const tool = tools.find((t) => t.id === r.tool);
              return (
                <div
                  key={r.tool}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="text-sm font-medium shrink-0"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tool?.name ?? r.tool}
                  </span>
                  <span className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    — {r.reason}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Slot alternatives (custom stacks only) */}
      {rejections.length === 0 && slotAlternatives.some((a) => a.alternatives.length > 0) && (
        <Section title="Alternatives considered">
          <div className="flex flex-col gap-3">
            {slotAlternatives
              .filter((a) => a.alternatives.length > 0)
              .map(({ slot, chosen, alternatives }) => (
                <div key={`${slot.id}-${chosen.id}`}>
                  <p
                    className="text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {slot.name}: chose <span style={{ color: "var(--accent)" }}>{chosen.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map((alt) => (
                      <span
                        key={alt.id}
                        className="text-xs px-2 py-1 rounded-md"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {alt.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* Tradeoffs */}
      {curatedStack?.tradeoffs && (
        <Section title="Tradeoffs">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {curatedStack.tradeoffs}
          </p>
        </Section>
      )}

      {/* Kill conditions */}
      {killConditions.length > 0 && (
        <Section title="When to move on">
          <ul className="flex flex-col gap-1.5">
            {killConditions.map((k, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: "var(--text-muted)", marginTop: 1 }}>·</span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {k}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Graduation path */}
      {graduationStack && (
        <Section title="What's next">
          <Link
            href={`/case?stack=${graduationStack.id}`}
            className="flex items-center justify-between rounded-lg px-4 py-3 transition-opacity hover:opacity-80"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              textDecoration: "none",
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {graduationStack.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {graduationStack.description}
              </p>
            </div>
            <span style={{ color: "var(--text-muted)" }}>
              <IconArrowRight size={14} />
            </span>
          </Link>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
