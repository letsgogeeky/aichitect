"use client";

interface CloseButtonProps {
  onClick: () => void;
  variant?: "muted" | "accent";
  className?: string;
}

export function CloseButton({ onClick, variant = "muted", className = "" }: CloseButtonProps) {
  const base =
    variant === "accent"
      ? "text-[#7c6bff88] hover:text-[#7c6bff] transition-colors"
      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors";
  return (
    <button onClick={onClick} className={`${base} ${className}`.trim()}>
      ✕
    </button>
  );
}
