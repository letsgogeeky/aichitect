interface CategoryPillProps {
  label: string;
  color: string;
}

export function CategoryPill({ label, color }: CategoryPillProps) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: color + "22", color }}
    >
      {label}
    </span>
  );
}
