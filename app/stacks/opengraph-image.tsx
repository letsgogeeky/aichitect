import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const clusters = [
    { label: "Build", tagline: "Ship this week", color: "#7c6bff" },
    { label: "Automate", tagline: "AI does the work", color: "#ff6b6b" },
    { label: "Ship & Harden", tagline: "Make it trustworthy", color: "#26de81" },
    { label: "Comply & Restrict", tagline: "Nothing leaves the building", color: "#4ecdc4" },
    { label: "Understand", tagline: "Data is the product", color: "#fdcb6e" },
  ];

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
        padding: "0 80px",
        gap: 0,
      }}
    >
      {/* Radial gradient backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at 50% 40%, #7c6bff0a 0%, transparent 65%)",
          display: "flex",
        }}
      />

      {/* Logo + brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: "linear-gradient(135deg, #7c6bff, #00d4aa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          A
        </div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#f0f0f8",
            letterSpacing: -0.5,
          }}
        >
          AIchitect
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: "#f0f0f8",
          letterSpacing: -1,
          marginBottom: 8,
          display: "flex",
        }}
      >
        Stacks
      </div>
      <div
        style={{
          fontSize: 18,
          color: "#6666aa",
          marginBottom: 52,
          display: "flex",
        }}
      >
        25 mission-driven starting points across 5 clusters
      </div>

      {/* Cluster pills */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1000,
        }}
      >
        {clusters.map((c) => (
          <div
            key={c.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "14px 24px",
              borderRadius: 12,
              background: c.color + "12",
              border: `1px solid ${c.color}33`,
              gap: 4,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.label}</span>
            <span style={{ fontSize: 11, color: c.color + "99" }}>{c.tagline}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          fontSize: 14,
          color: "#333355",
          display: "flex",
        }}
      >
        aichitect.dev · cut the noise, pick your stack
      </div>
    </div>,
    { ...size }
  );
}
