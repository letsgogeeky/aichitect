"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useWalkthrough } from "./WalkthroughContext";

const TOOLTIP_WIDTH = 284;
const TOOLTIP_GAP = 14;
const VIEWPORT_MARGIN = 16;
const TOOLTIP_HALF_HEIGHT = 110; // approx half of tooltip height for centering

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Position {
  spotlight: SpotlightRect | null;
  tooltip: { x: number; y: number };
}

function computePosition(anchor: string | null, placement: string, padding: number): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!anchor) {
    return {
      spotlight: null,
      tooltip: {
        x: vw / 2 - TOOLTIP_WIDTH / 2,
        y: vh / 2 - TOOLTIP_HALF_HEIGHT,
      },
    };
  }

  const el = document.querySelector(`[data-tour="${anchor}"]`);
  if (!el) {
    return {
      spotlight: null,
      tooltip: {
        x: vw / 2 - TOOLTIP_WIDTH / 2,
        y: vh / 2 - TOOLTIP_HALF_HEIGHT,
      },
    };
  }

  const rect = el.getBoundingClientRect();
  const spotlight: SpotlightRect = {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  let x = 0;
  let y = 0;

  switch (placement) {
    case "right":
      x = spotlight.left + spotlight.width + TOOLTIP_GAP;
      y = spotlight.top + spotlight.height / 2 - TOOLTIP_HALF_HEIGHT;
      break;
    case "left":
      x = spotlight.left - TOOLTIP_WIDTH - TOOLTIP_GAP;
      y = spotlight.top + spotlight.height / 2 - TOOLTIP_HALF_HEIGHT;
      break;
    case "bottom":
      x = spotlight.left + spotlight.width / 2 - TOOLTIP_WIDTH / 2;
      y = spotlight.top + spotlight.height + TOOLTIP_GAP;
      break;
    case "top":
      x = spotlight.left + spotlight.width / 2 - TOOLTIP_WIDTH / 2;
      y = spotlight.top - TOOLTIP_HALF_HEIGHT * 2 - TOOLTIP_GAP;
      break;
    default:
      x = vw / 2 - TOOLTIP_WIDTH / 2;
      y = vh / 2 - TOOLTIP_HALF_HEIGHT;
  }

  // Clamp to viewport bounds
  x = Math.max(VIEWPORT_MARGIN, Math.min(x, vw - TOOLTIP_WIDTH - VIEWPORT_MARGIN));
  y = Math.max(VIEWPORT_MARGIN, Math.min(y, vh - TOOLTIP_HALF_HEIGHT * 2 - VIEWPORT_MARGIN));

  return { spotlight, tooltip: { x, y } };
}

export default function WalkthroughOverlay() {
  const { steps, stepIndex, exiting, next, prev, dismiss, route } = useWalkthrough();
  const router = useRouter();
  const step = steps[stepIndex];
  const [position, setPosition] = useState<Position>({
    spotlight: null,
    tooltip: { x: 0, y: 0 },
  });

  const recompute = useCallback(() => {
    if (!step) return;
    setPosition(computePosition(step.anchor, step.placement, step.spotlightPadding ?? 8));
  }, [step]);

  useEffect(() => {
    // Small delay so the DOM has settled after step change
    const t = setTimeout(recompute, 50);
    window.addEventListener("resize", recompute);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", recompute);
    };
  }, [recompute]);

  useEffect(() => {
    // Scroll anchored element into view
    if (!step?.anchor) return;
    const el = document.querySelector(`[data-tour="${step.anchor}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dismiss, next, prev]);

  if (!step) return null;

  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;
  const { spotlight, tooltip } = position;

  const overlay = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        animation: exiting ? "tourFadeOut 200ms ease forwards" : "tourFadeIn 200ms ease",
        pointerEvents: "auto",
      }}
    >
      {/* SVG spotlight mask */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "auto",
        }}
        onClick={dismiss}
      >
        {spotlight ? (
          <>
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlight.left}
                  y={spotlight.top}
                  width={spotlight.width}
                  height={spotlight.height}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tour-mask)" />
            {/* Spotlight accent ring */}
            <rect
              x={spotlight.left}
              y={spotlight.top}
              width={spotlight.width}
              height={spotlight.height}
              rx="8"
              fill="none"
              stroke="#7c6bff"
              strokeWidth="1.5"
              opacity="0.5"
            />
          </>
        ) : (
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" />
        )}
      </svg>

      {/* Tooltip card */}
      <div
        key={`step-${stepIndex}`}
        style={{
          position: "fixed",
          top: tooltip.y,
          left: tooltip.x,
          width: TOOLTIP_WIDTH,
          background: "#111118",
          border: "1px solid #2a2a3a",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,107,255,0.08)",
          zIndex: 10000,
          animation: "tourStepIn 180ms ease",
          pointerEvents: "auto",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient accent strip */}
        <div
          style={{
            height: 2,
            background: "linear-gradient(90deg, #7c6bff 0%, #00d4aa 100%)",
          }}
        />

        <div style={{ padding: "14px 16px 12px" }}>
          {/* Step counter */}
          <p
            style={{
              fontSize: 10,
              color: "#555577",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            {stepIndex + 1} / {steps.length}
          </p>

          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#f0f0f8",
              margin: "0 0 7px",
              lineHeight: 1.35,
            }}
          >
            {step.title}
          </h3>

          <p
            style={{
              fontSize: 11.5,
              color: "#8888aa",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {step.body}
          </p>

          {/* "Go to Builder" CTA on the last explore step */}
          {isLast && route === "explore" && (
            <button
              onClick={() => {
                dismiss();
                router.push("/builder");
              }}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "8px 0",
                borderRadius: 8,
                background: "#7c6bff22",
                border: "1px solid #7c6bff44",
                color: "#7c6bff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go to Builder →
            </button>
          )}
        </div>

        {/* Footer: back / step dots / next */}
        <div
          style={{
            padding: "10px 16px 14px",
            borderTop: "1px solid #1e1e2e",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={prev}
            disabled={isFirst}
            style={{
              background: "transparent",
              border: "none",
              color: isFirst ? "#2a2a3a" : "#8888aa",
              fontSize: 12,
              cursor: isFirst ? "default" : "pointer",
              padding: "4px 0",
              transition: "color 150ms",
            }}
            onMouseEnter={(e) => {
              if (!isFirst) e.currentTarget.style.color = "#f0f0f8";
            }}
            onMouseLeave={(e) => {
              if (!isFirst) e.currentTarget.style.color = "#8888aa";
            }}
          >
            ← Back
          </button>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === stepIndex ? 18 : 5,
                  height: 5,
                  borderRadius: 3,
                  background: i === stepIndex ? "#7c6bff" : "#222233",
                  transition: "width 200ms ease, background 200ms ease",
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            style={{
              background: isLast ? "#00d4aa22" : "#7c6bff",
              border: isLast ? "1px solid #00d4aa44" : "none",
              color: isLast ? "#00d4aa" : "#fff",
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: 7,
              cursor: "pointer",
              transition: "background 150ms",
            }}
          >
            {isLast ? "Done ✓" : "Next →"}
          </button>
        </div>
      </div>

      {/* Dismiss X — always accessible at top-right */}
      <button
        onClick={dismiss}
        title="Close tour (Esc)"
        style={{
          position: "fixed",
          top: 14,
          right: 14,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#1c1c28",
          border: "1px solid #2a2a3a",
          color: "#555577",
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10001,
          pointerEvents: "auto",
          transition: "color 150ms, border-color 150ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#f0f0f8";
          e.currentTarget.style.borderColor = "#3a3a4a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#555577";
          e.currentTarget.style.borderColor = "#2a2a3a";
        }}
      >
        ✕
      </button>
    </div>
  );

  return createPortal(overlay, document.body);
}
