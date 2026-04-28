"use client";

import type { ToolRiskSignal, RiskSignal } from "@/app/api/pulse/events/route";
import type { ToolEventMetadata } from "@/lib/types";

interface SlotRiskBadgeProps {
  signal: ToolRiskSignal;
  onSeeAlternatives?: () => void;
}

interface BadgeConfig {
  icon: string;
  label: string;
  bg: string;
  text: string;
  showAction: boolean;
}

const BADGE_CONFIG: Record<RiskSignal, BadgeConfig> = {
  at_risk: {
    icon: "⚠",
    label: "At risk",
    bg: "rgba(225, 112, 85, 0.15)",
    text: "#e17055",
    showAction: true,
  },
  pricing_changed: {
    icon: "$",
    label: "Pricing changed",
    bg: "rgba(116, 185, 255, 0.15)",
    text: "#74b9ff",
    showAction: true,
  },
  gaining_traction: {
    icon: "⭑",
    label: "Gaining traction",
    bg: "rgba(0, 184, 148, 0.15)",
    text: "#00b894",
    showAction: false,
  },
};

function buildTooltip(signal: ToolRiskSignal): string {
  if (!signal.event_type || !signal.metadata) return "";
  const meta = signal.metadata as ToolEventMetadata;

  switch (signal.event_type) {
    case "stale_transition": {
      const days = (meta as { days_since_commit?: number }).days_since_commit;
      return days != null ? `No commits in ${days} days` : "No recent commits";
    }
    case "archived_detected":
      return "Repository archived on GitHub";
    case "health_score_change": {
      const delta = (meta as { delta?: number }).delta ?? 0;
      return delta < 0
        ? `Health score dropped ${Math.abs(delta)}pts this month`
        : `Health score up ${delta}pts this month`;
    }
    case "pricing_change": {
      if (!signal.detected_at) return "Pricing recently updated";
      const date = new Date(signal.detected_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return `Pricing updated ${date}`;
    }
    case "star_milestone": {
      const milestone = (meta as { milestone?: number }).milestone;
      return milestone != null
        ? `Crossed ${milestone.toLocaleString()} stars`
        : "Reached a star milestone";
    }
    default:
      return "";
  }
}

export function SlotRiskBadge({ signal, onSeeAlternatives }: SlotRiskBadgeProps) {
  if (!signal.signal) return null;

  const config = BADGE_CONFIG[signal.signal];
  const tooltipText = buildTooltip(signal);

  return (
    <div className="flex items-center gap-2">
      <span
        title={tooltipText || undefined}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
      {config.showAction && onSeeAlternatives && (
        <button
          onClick={onSeeAlternatives}
          className="text-[11px] text-white/40 underline-offset-2 hover:text-white/70 hover:underline transition-colors"
        >
          See alternatives →
        </button>
      )}
    </div>
  );
}
