"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Placement = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  /** Tooltip content. Plain text or any React node. */
  content: ReactNode;
  /** The element that triggers the tooltip. Must be a single React element. */
  children: ReactNode;
  /** Where to position the tooltip relative to the trigger. Default: "top". */
  placement?: Placement;
  /** Delay before the tooltip appears (ms). Default: 350. */
  delay?: number;
  /** When true the tooltip is never shown. */
  disabled?: boolean;
  /** Max width for multi-line content. Default: 220px. */
  maxWidth?: number;
}

// ─── Placement offsets ────────────────────────────────────────────────────────

const OFFSET: Record<Placement, React.CSSProperties> = {
  top: { bottom: "calc(100% + 7px)", left: "50%", transform: "translateX(-50%)" },
  bottom: { top: "calc(100% + 7px)", left: "50%", transform: "translateX(-50%)" },
  left: { right: "calc(100% + 7px)", top: "50%", transform: "translateY(-50%)" },
  right: { left: "calc(100% + 7px)", top: "50%", transform: "translateY(-50%)" },
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

/**
 * Accessible tooltip. Implements the ARIA tooltip pattern:
 * - role="tooltip" on the popup
 * - aria-describedby linking trigger → tooltip
 * - ESC dismisses the tooltip
 * - Appears on hover + focus; hides on blur/mouseLeave
 *
 * Usage:
 *   <Tooltip content="Go to GitHub">
 *     <a href={url}>★ {stars}</a>
 *   </Tooltip>
 *
 *   <Tooltip content="Score computed from stars, recency, and archive status" placement="bottom">
 *     <span>Health: {score}</span>
 *   </Tooltip>
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  delay = 350,
  disabled = false,
  maxWidth = 220,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  function show() {
    timer.current = setTimeout(() => setVisible(true), delay);
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }

  // ESC dismisses
  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setVisible(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  if (disabled) return <>{children}</>;

  // Inject aria-describedby into the trigger element
  const trigger = Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<Record<string, unknown>>, {
        "aria-describedby": visible ? tooltipId : undefined,
      });
    }
    return child;
  });

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {trigger}

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: "absolute",
            ...OFFSET[placement],
            maxWidth,
            padding: "5px 9px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.45,
            color: "var(--text-primary)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            pointerEvents: "none",
            zIndex: 200,
            whiteSpace: typeof content === "string" ? "nowrap" : undefined,
            animation: "fadeIn 100ms ease-out",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
