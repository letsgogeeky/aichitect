interface FreeTierCellProps {
  has: boolean;
}

export function FreeTierCell({ has }: FreeTierCellProps) {
  return (
    <span className={`text-xs font-medium ${has ? "text-[#26de81]" : "text-[var(--text-muted)]"}`}>
      {has ? "✓ Yes" : "✗ No"}
    </span>
  );
}
