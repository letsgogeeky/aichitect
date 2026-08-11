"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Replaces icon with a spinner and sets aria-busy. */
  loading?: boolean;
  /** Icon rendered before children. Hidden while loading. */
  icon?: ReactNode;
  /** Icon rendered after children. Hidden while loading. */
  iconRight?: ReactNode;
  /** Stretch to fill parent container. */
  fullWidth?: boolean;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const HEIGHT: Record<ButtonSize, number> = { sm: 28, md: 32, lg: 38 };
const FONT_SIZE: Record<ButtonSize, number> = { sm: 11, md: 12, lg: 13 };
const PADDING: Record<ButtonSize, string> = { sm: "0 10px", md: "0 14px", lg: "0 18px" };
const ICON_SIZE: Record<ButtonSize, number> = { sm: 10, md: 12, lg: 14 };

function variantStyles(v: ButtonVariant): React.CSSProperties {
  switch (v) {
    case "primary":
      return {
        background: "var(--accent)",
        borderColor: "var(--accent)",
        // white on var(--accent) is 3.89:1 (fails AA); var(--bg) on accent
        // is 5.08:1 — same dark-on-bright pattern used for other solid CTAs.
        color: "var(--bg)",
      };
    case "ghost":
      return {
        background: "transparent",
        borderColor: "transparent",
        color: "var(--text-secondary)",
      };
    case "outline":
      return {
        background: "var(--btn)",
        borderColor: "var(--btn-border)",
        color: "var(--text-secondary)",
      };
    case "danger":
      return {
        background: "rgba(255,107,107,0.08)",
        borderColor: "rgba(255,107,107,0.35)",
        color: "var(--danger)",
      };
    case "success":
      return {
        background: "rgba(38,222,129,0.08)",
        borderColor: "rgba(38,222,129,0.35)",
        color: "var(--success)",
      };
  }
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "spin 0.65s linear infinite", flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

/**
 * Reusable button component with variant, size, loading, and icon support.
 *
 * Usage:
 *   <Button variant="primary" onClick={save}>Save</Button>
 *   <Button variant="outline" size="sm" icon={<IconPlus size={11} />}>Add tool</Button>
 *   <Button variant="danger" loading={deleting}>Delete</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "outline",
    size = "md",
    loading = false,
    icon,
    iconRight,
    fullWidth = false,
    children,
    disabled,
    style,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: HEIGHT[size],
        padding: PADDING[size],
        borderRadius: 7,
        fontSize: FONT_SIZE[size],
        fontWeight: 600,
        border: "1px solid transparent",
        cursor: isDisabled ? "default" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        transition: "background 150ms, border-color 150ms, color 150ms, opacity 150ms",
        width: fullWidth ? "100%" : undefined,
        flexShrink: 0,
        lineHeight: 1,
        ...variantStyles(variant),
        ...style,
      }}
    >
      {loading ? <Spinner size={ICON_SIZE[size]} /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});
