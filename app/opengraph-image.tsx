import { ImageResponse } from "next/og";
import { TOOL_COUNT, CATEGORY_COUNT } from "@/lib/constants";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse 800px 500px at 50% 40%, #7c6bff14 0%, transparent 70%)",
        }}
      />

      {/* Decorative nodes */}
      {[
        { x: 140, y: 120, r: 6, color: "#7c6bff" },
        { x: 260, y: 200, r: 5, color: "#ff6b6b" },
        { x: 180, y: 310, r: 4, color: "#fdcb6e" },
        { x: 1020, y: 160, r: 6, color: "#26de81" },
        { x: 960, y: 280, r: 5, color: "#4ecdc4" },
        { x: 1060, y: 380, r: 4, color: "#ff9f43" },
        { x: 320, y: 480, r: 5, color: "#a29bfe" },
        { x: 900, y: 480, r: 5, color: "#55efc4" },
      ].map(({ x, y, r, color }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            background: color,
            opacity: 0.5,
            boxShadow: `0 0 ${r * 4}px ${color}66`,
          }}
        />
      ))}

      {/* Logo mark */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          background: "linear-gradient(135deg, #7c6bff, #00d4aa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          flexShrink: 0,
        }}
      >
        {/* Inline SVG nodes graphic */}
        <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="9" r="3" fill="white" opacity="0.95" />
          <circle cx="8" cy="23" r="3" fill="white" opacity="0.95" />
          <circle cx="24" cy="23" r="3" fill="white" opacity="0.95" />
          <line x1="16" y1="9" x2="8" y2="23" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <line x1="16" y1="9" x2="24" y2="23" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <line x1="8" y1="23" x2="24" y2="23" stroke="white" strokeWidth="1.5" opacity="0.45" />
        </svg>
      </div>

      {/* Brand name */}
      <div
        style={{
          fontSize: 52,
          fontWeight: 800,
          color: "#f0f0f8",
          letterSpacing: -1.5,
          marginBottom: 16,
          display: "flex",
        }}
      >
        AIchitect
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 22,
          color: "#8888aa",
          textAlign: "center",
          maxWidth: 640,
          lineHeight: 1.5,
          marginBottom: 36,
          display: "flex",
        }}
      >
        Cut the noise. Pick your AI stack.
      </div>

      {/* Stats pills */}
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { label: `${TOOL_COUNT} tools`, color: "#7c6bff" },
          { label: `${CATEGORY_COUNT} categories`, color: "#00d4aa" },
          { label: "open source", color: "#26de81" },
        ].map(({ label, color }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 100,
              background: color + "18",
              border: `1px solid ${color}44`,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 15, color: "#c0c0d8", fontWeight: 500, display: "flex" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Domain */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          fontSize: 14,
          color: "#333355",
          display: "flex",
        }}
      >
        aichitect.dev
      </div>
    </div>,
    { ...size }
  );
}
