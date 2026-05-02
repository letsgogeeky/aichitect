"use client";

interface SkeletonProps {
  /** Width as px number or CSS string. Defaults to 100%. */
  width?: number | string;
  /** Height as px number or CSS string. Defaults to 14px. */
  height?: number | string;
  className?: string;
  /** Renders as a circle (for avatars). */
  circle?: boolean;
}

/**
 * Single shimmer placeholder. aria-hidden so screen readers skip it.
 *
 * Usage:
 *   <Skeleton width={120} height={12} />
 *   <Skeleton width={32} height={32} circle />
 */
export function Skeleton({ width, height = 14, className = "", circle = false }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        width: typeof width === "number" ? `${width}px` : (width ?? "100%"),
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: circle ? "50%" : 4,
        background:
          "linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        flexShrink: 0,
      }}
    />
  );
}

interface SkeletonTextProps {
  /** Number of text lines to render. */
  lines?: number;
  /** Gap between lines in px. */
  gap?: number;
  /** Width of the final (shorter) line as a CSS string. */
  lastLineWidth?: string;
  height?: number;
}

/**
 * Multi-line text placeholder. The last line is shorter to mimic real prose.
 *
 * Usage:
 *   <SkeletonText lines={3} />
 */
export function SkeletonText({
  lines = 3,
  gap = 8,
  lastLineWidth = "55%",
  height = 12,
}: SkeletonTextProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={height} width={i === lines - 1 ? lastLineWidth : "100%"} />
      ))}
    </div>
  );
}
