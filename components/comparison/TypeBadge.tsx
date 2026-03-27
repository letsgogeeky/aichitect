interface TypeBadgeProps {
  type: string;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const isOss = type === "oss";
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
      style={
        isOss
          ? { background: "#26de8122", color: "var(--success)" }
          : { background: "#4ecdc422", color: "#4ecdc4" }
      }
    >
      {isOss ? "OSS" : "SaaS"}
    </span>
  );
}
