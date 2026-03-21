export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i < current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background: i < current ? "#7c6bff" : i === current ? "#7c6bff88" : "#2a2a3a",
            transition: "all 220ms ease",
          }}
        />
      ))}
    </div>
  );
}
