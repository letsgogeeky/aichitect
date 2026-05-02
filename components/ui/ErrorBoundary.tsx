"use client";

import { Component, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /**
   * Custom fallback UI. If omitted, the default recovery UI is shown.
   * Use a function to receive the error and a reset callback.
   */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Called after an error is caught — useful for logging. */
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface State {
  error: Error | null;
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

/**
 * Catches render-time errors in its subtree and shows a recovery UI.
 * Must be a class component (React constraint for error boundaries).
 *
 * Usage — default recovery UI:
 *   <ErrorBoundary>
 *     <DetailPanel ... />
 *   </ErrorBoundary>
 *
 * Usage — custom fallback:
 *   <ErrorBoundary fallback={(err, reset) => (
 *     <p>Failed to load graph. <button onClick={reset}>Retry</button></p>
 *   )}>
 *     <ExploreGraph ... />
 *   </ErrorBoundary>
 *
 * Usage — with error logging:
 *   <ErrorBoundary onError={(err) => posthog.captureException(err)}>
 *     ...
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;

    if (error) {
      const { fallback } = this.props;

      if (typeof fallback === "function") {
        return fallback(error, this.reset);
      }

      if (fallback) {
        return fallback;
      }

      return <DefaultErrorUI error={error} onReset={this.reset} />;
    }

    return this.props.children;
  }
}

// ─── Default error UI ─────────────────────────────────────────────────────────

function DefaultErrorUI({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "24px 20px",
        borderRadius: 8,
        background: "rgba(255,107,107,0.04)",
        border: "1px solid rgba(255,107,107,0.18)",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)" }}>
        Something went wrong
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        {error.message || "An unexpected error occurred."}
      </span>
      <button
        onClick={onReset}
        style={{
          marginTop: 6,
          padding: "5px 14px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: "var(--btn)",
          border: "1px solid var(--btn-border)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          transition: "background 150ms",
        }}
      >
        Try again
      </button>
    </div>
  );
}
