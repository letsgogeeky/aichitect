export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 10, color: "#555577" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 500, color: "#f0f0f8" }}>{value}</span>
    </div>
  );
}
