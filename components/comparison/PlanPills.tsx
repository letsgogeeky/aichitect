interface PlanPillsProps {
  plans: { name: string; price: string }[];
}

export function PlanPills({ plans }: PlanPillsProps) {
  if (plans.length === 0) return <span className="text-xs text-[var(--text-muted)]">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {plans.slice(0, 3).map((p, i) => (
        <span
          key={i}
          className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)]"
        >
          {p.name}: {p.price}
        </span>
      ))}
    </div>
  );
}
