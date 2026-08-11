"use client";

import { useMemo } from "react";
import { Slot, Tool, StackArchetype, LifecyclePhase, getCategoryColor } from "@/lib/types";
import { LIFECYCLE_PHASE_LABEL, PHASE_TRACK_COLOR } from "@/lib/lifecycle";

interface Props {
  selected: Record<string, string>; // slotId → toolId
  slots: Slot[];
  allTools: Tool[];
  onAddTool: (slotId: string, toolId: string) => void;
  /** Archetype used to resolve per-slot priority. Defaults to "hybrid" until AIC-68 adds detection. */
  archetype?: StackArchetype;
  /** Optional PR 7 view: surface missing lifecycle phases alongside missing slots. */
  phaseCoverage?: {
    covered: Set<LifecyclePhase>;
    missingDev: LifecyclePhase[];
    missingRuntime: LifecyclePhase[];
  };
}

interface SlotHealth {
  slot: Slot;
  filled: boolean;
  tool: Tool | null;
  suggestedTool: Tool | null;
  suggestReason: string | undefined;
}

// Which inference tool to suggest for each provider
const PROVIDER_INFERENCE_TOOL: Record<string, string> = {
  anthropic: "anthropic-api",
  openai: "openai-api",
  mistral: "mistral-api",
  cohere: "cohere-api",
};

const PROVIDER_INFERENCE_REASON: Record<string, string> = {
  anthropic: "Matches your Anthropic tooling — keep your stack consistent",
  openai: "Matches your OpenAI tooling — keep your stack consistent",
  mistral: "Matches your Mistral tooling — keep your stack consistent",
  cohere: "Matches your Cohere tooling — keep your stack consistent",
};

// Human-readable provider names
const PROVIDER_LABEL: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  mistral: "Mistral",
  cohere: "Cohere",
};

export default function StackHealthPanel({
  selected,
  slots,
  allTools,
  onAddTool,
  archetype = "hybrid",
  phaseCoverage,
}: Props) {
  // Collect all selected Tool objects that carry a provider tag
  const providerTools = useMemo(() => {
    return Object.values(selected)
      .map((id) => allTools.find((t) => t.id === id))
      .filter((t): t is Tool => !!t?.provider);
  }, [selected, allTools]);

  // Map provider → tools using it
  const byProvider = useMemo(() => {
    const map = new Map<string, Tool[]>();
    for (const t of providerTools) {
      const p = t.provider!;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(t);
    }
    return map;
  }, [providerTools]);

  // Dominant provider = the one with the most provider-tagged tools selected
  const dominantProvider = useMemo(() => {
    if (byProvider.size === 0) return null;
    return [...byProvider.entries()].sort((a, b) => b[1].length - a[1].length)[0][0];
  }, [byProvider]);

  // Conflict: ≥2 distinct providers in the selected stack
  const conflictingProviders = useMemo(() => {
    if (byProvider.size < 2) return null;
    // Return pairs: each minority provider vs the dominant one
    return [...byProvider.entries()].filter(([p]) => p !== dominantProvider);
  }, [byProvider, dominantProvider]);

  const health = useMemo<SlotHealth[]>(() => {
    return slots.map((slot) => {
      const toolId = selected[slot.id];
      const tool = toolId ? (allTools.find((t) => t.id === toolId) ?? null) : null;

      let suggestedToolId = slot.suggest ?? null;
      let suggestReason = slot.suggest_reason;

      // Override inference/llm-provider suggestion if we know the dominant provider
      if (!tool && dominantProvider && slot.id === "inference") {
        const override = PROVIDER_INFERENCE_TOOL[dominantProvider];
        if (override) {
          suggestedToolId = override;
          suggestReason = PROVIDER_INFERENCE_REASON[dominantProvider];
        }
      }

      const suggestedTool =
        !tool && suggestedToolId ? (allTools.find((t) => t.id === suggestedToolId) ?? null) : null;

      return { slot, filled: !!tool, tool, suggestedTool, suggestReason };
    });
  }, [selected, slots, allTools, dominantProvider]);

  const required = health.filter((h) => h.slot.priority[archetype] === "required");
  const recommended = health.filter((h) => h.slot.priority[archetype] === "recommended");

  const requiredFilled = required.filter((h) => h.filled).length;
  const recommendedFilled = recommended.filter((h) => h.filled).length;
  const totalEssentials = required.length + recommended.length;
  const totalFilled = requiredFilled + recommendedFilled;

  const missingRequired = required.filter((h) => !h.filled);
  const missingRecommended = recommended.filter((h) => !h.filled);

  const allEssentialsFilled = missingRequired.length === 0 && missingRecommended.length === 0;

  // Don't render if everything essential is filled and no conflicts
  if (allEssentialsFilled && !conflictingProviders) {
    return (
      <div
        className="rounded-lg px-3 py-2.5 text-center"
        style={{ background: "#26de8110", border: "1px solid #26de8122" }}
      >
        <p className="text-[11px] font-semibold" style={{ color: "var(--success)" }}>
          Stack looks solid
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "#26de81cc" }}>
          All essentials covered
        </p>
      </div>
    );
  }

  const pct = totalEssentials > 0 ? Math.round((totalFilled / totalEssentials) * 100) : 0;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: "var(--surface-2)" }}
      >
        <p className="text-[11px] font-semibold text-[var(--text-primary)]">Stack health</p>
        <div className="flex items-center gap-1.5">
          <div
            className="w-16 h-1 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background:
                  pct === 100 ? "var(--success)" : pct >= 60 ? "#fd9644" : "var(--danger)",
              }}
            />
          </div>
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            {totalFilled}/{totalEssentials}
          </span>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {/* Provider alignment warnings */}
        {conflictingProviders?.map(([minority, minorityTools]) => (
          <ProviderConflictRow
            key={minority}
            dominantProvider={dominantProvider!}
            conflictProvider={minority}
            conflictTools={minorityTools}
            dominantTools={byProvider.get(dominantProvider!) ?? []}
          />
        ))}

        {/* Missing required slots */}
        {missingRequired.map(({ slot, suggestedTool, suggestReason }) => (
          <HealthRow
            key={slot.id}
            slot={slot}
            suggestedTool={suggestedTool}
            suggestReason={suggestReason}
            variant="required"
            onAdd={onAddTool}
          />
        ))}

        {/* Missing recommended slots */}
        {missingRecommended.map(({ slot, suggestedTool, suggestReason }) => (
          <HealthRow
            key={slot.id}
            slot={slot}
            suggestedTool={suggestedTool}
            suggestReason={suggestReason}
            variant="recommended"
            onAdd={onAddTool}
          />
        ))}

        {/* PR 7: lifecycle phase gaps — complements missing-slot rows with
            "which end-to-end phases is this stack missing?" — only renders when
            there's actually a gap to report. */}
        {phaseCoverage && phaseCoverage.missingDev.length > 0 && (
          <PhaseGapRow
            track="development"
            missing={phaseCoverage.missingDev}
            color={PHASE_TRACK_COLOR.development}
          />
        )}
        {phaseCoverage && phaseCoverage.missingRuntime.length > 0 && (
          <PhaseGapRow
            track="runtime"
            missing={phaseCoverage.missingRuntime}
            color={PHASE_TRACK_COLOR.runtime}
          />
        )}
      </div>
    </div>
  );
}

function PhaseGapRow({
  track,
  missing,
  color,
}: {
  track: "development" | "runtime";
  missing: LifecyclePhase[];
  color: string;
}) {
  const label = track === "development" ? "Dev workflow" : "Runtime arch";
  return (
    <div className="px-3 py-2.5" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[11px] font-medium text-[var(--text-primary)] leading-tight">
          {label}
        </span>
        <span
          className="ml-auto text-[11px] font-semibold uppercase tracking-wide flex-shrink-0"
          style={{ color: color + "cc" }}
        >
          {missing.length} phase{missing.length === 1 ? "" : "s"} missing
        </span>
      </div>
      <p className="text-[11px] leading-relaxed pl-2.5" style={{ color: "var(--text-muted)" }}>
        Add tools that cover{" "}
        <span style={{ color }}>{missing.map((p) => LIFECYCLE_PHASE_LABEL[p]).join(", ")}</span>.
      </p>
    </div>
  );
}

function ProviderConflictRow({
  dominantProvider,
  conflictProvider,
  conflictTools,
  dominantTools,
}: {
  dominantProvider: string;
  conflictProvider: string;
  conflictTools: Tool[];
  dominantTools: Tool[];
}) {
  const dominantLabel = PROVIDER_LABEL[dominantProvider] ?? dominantProvider;
  const conflictLabel = PROVIDER_LABEL[conflictProvider] ?? conflictProvider;
  const conflictNames = conflictTools.map((t) => t.name).join(", ");
  const dominantNames = dominantTools.map((t) => t.name).join(", ");

  return (
    <div className="px-3 py-2.5" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#fd9644" }} />
        <span className="text-[11px] font-medium text-[var(--text-primary)] leading-tight">
          Mixed providers
        </span>
        <span
          className="ml-auto text-[11px] font-semibold uppercase tracking-wide flex-shrink-0"
          style={{ color: "#fd9644cc" }}
        >
          heads up
        </span>
      </div>
      <p className="text-[11px] leading-relaxed pl-2.5" style={{ color: "var(--text-muted)" }}>
        <span style={{ color: "#f0f0f8" }}>{dominantNames}</span> ({dominantLabel}) and{" "}
        <span style={{ color: "#f0f0f8" }}>{conflictNames}</span> ({conflictLabel}) serve different
        layers but are from competing providers — intentional if you&apos;re comparing, but consider
        aligning to one.
      </p>
    </div>
  );
}

function HealthRow({
  slot,
  suggestedTool,
  suggestReason,
  variant,
  onAdd,
}: {
  slot: Slot;
  suggestedTool: Tool | null;
  suggestReason: string | undefined;
  variant: "required" | "recommended";
  onAdd: (slotId: string, toolId: string) => void;
}) {
  const isRequired = variant === "required";
  const accentColor = isRequired ? "var(--danger)" : "#fd9644";
  const label = isRequired ? "required" : "recommended";

  return (
    <div className="px-3 py-2.5" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: accentColor }} />
        <span className="text-[11px] font-medium text-[var(--text-primary)] truncate leading-tight">
          {slot.name}
        </span>
        <span
          className="ml-auto text-[11px] font-semibold uppercase tracking-wide flex-shrink-0"
          style={{ color: accentColor + "cc" }}
        >
          {label}
        </span>
      </div>

      {suggestedTool ? (
        <div className="flex items-start gap-2 mt-1.5">
          <div
            className="w-1 h-1 rounded-full flex-shrink-0 mt-1"
            style={{ background: getCategoryColor(suggestedTool.category) }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-medium leading-tight"
              style={{ color: getCategoryColor(suggestedTool.category) }}
            >
              {suggestedTool.name}
            </p>
            {suggestReason && (
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-0.5">
                {suggestReason}
              </p>
            )}
          </div>
          <button
            onClick={() => onAdd(slot.id, suggestedTool.id)}
            className="flex-shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded transition-colors"
            style={{
              background: getCategoryColor(suggestedTool.category) + "18",
              color: getCategoryColor(suggestedTool.category),
              border: `1px solid ${getCategoryColor(suggestedTool.category)}33`,
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-[var(--text-muted)] pl-2.5">Not set</p>
      )}
    </div>
  );
}
