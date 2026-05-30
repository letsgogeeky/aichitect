/**
 * Pure helpers for the inline TTFT sparkline on /tool/[toolId].
 *
 * Kept here (not co-located with the component) so the path math can be
 * tested independently — edge cases like a flat series or a single-point
 * series are easy to get wrong with inline render-time math.
 */

export interface SparklineGeometry {
  /** SVG path `d` attribute, or null when there is too little data to draw. */
  path: string | null;
  /** True when the latest value is higher than the first — for TTFT, higher = worse. */
  trendUp: boolean;
  /** Number of points actually plotted (after filtering null/zero). */
  pointCount: number;
  min: number;
  max: number;
  firstValue: number;
  lastValue: number;
}

export interface SparklineOptions {
  width: number;
  height: number;
  /** Inset from each edge, in px. */
  padding?: number;
}

/**
 * Build the SVG path for a sparkline from a series of numeric values.
 *
 * Returns `path: null` when fewer than two valid points exist — the
 * caller should not render the chart in that case.
 *
 * Zero and null entries are treated as "no measurement" and excluded.
 * This matches how Artificial Analysis reports unmeasured TTFT.
 */
export function computeSparklinePath(
  values: (number | null)[],
  opts: SparklineOptions
): SparklineGeometry {
  const series = values.filter((v): v is number => v != null && v > 0);
  const pad = opts.padding ?? 2;

  if (series.length < 2) {
    return {
      path: null,
      trendUp: false,
      pointCount: series.length,
      min: series[0] ?? 0,
      max: series[0] ?? 0,
      firstValue: series[0] ?? 0,
      lastValue: series[0] ?? 0,
    };
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  // A flat series has range 0 — fall back to 1 so the path still draws
  // at the bottom of the chart instead of dividing by zero.
  const range = Math.max(1, max - min);
  const innerW = opts.width - pad * 2;
  const innerH = opts.height - pad * 2;

  const path = series
    .map((v, i) => {
      const x = pad + (i * innerW) / (series.length - 1);
      const y = opts.height - pad - ((v - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const firstValue = series[0];
  const lastValue = series[series.length - 1];

  return {
    path,
    trendUp: lastValue > firstValue,
    pointCount: series.length,
    min,
    max,
    firstValue,
    lastValue,
  };
}
