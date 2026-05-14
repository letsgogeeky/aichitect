"use client";

interface Props {
  label: string;
  min: number;
  max: number;
  value: number;
  logScale: boolean;
  formatValue: (n: number) => string;
  onChange: (v: number) => void;
  hint?: string;
}

const STEPS = 100;

function valueToPosition(value: number, min: number, max: number, logScale: boolean): number {
  if (logScale) {
    const a = Math.log10(min);
    const b = Math.log10(max);
    return ((Math.log10(value) - a) / (b - a)) * STEPS;
  }
  return ((value - min) / (max - min)) * STEPS;
}

function positionToValue(pos: number, min: number, max: number, logScale: boolean): number {
  if (logScale) {
    const a = Math.log10(min);
    const b = Math.log10(max);
    return Math.round(Math.pow(10, a + (pos / STEPS) * (b - a)));
  }
  return Math.round(min + (pos / STEPS) * (max - min));
}

export default function LogSlider({
  label,
  min,
  max,
  value,
  logScale,
  formatValue,
  onChange,
  hint,
}: Props) {
  const position = valueToPosition(value, min, max, logScale);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</label>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={Math.round(position)}
        onChange={(e) => onChange(positionToValue(Number(e.target.value), min, max, logScale))}
        style={{
          width: "100%",
          appearance: "none",
          height: 4,
          background: "var(--border)",
          borderRadius: 999,
          outline: "none",
          accentColor: "var(--accent)",
        }}
        aria-label={label}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        <span>{formatValue(min)}</span>
        {hint && <span>{hint}</span>}
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
