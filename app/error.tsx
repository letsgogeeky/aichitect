"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#08080f",
        gap: 16,
        padding: 32,
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 13, color: "#8888aa", maxWidth: 360 }}>
        Something went wrong rendering this view.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "8px 20px",
          borderRadius: 8,
          background: "#7c6bff22",
          border: "1px solid #7c6bff66",
          color: "var(--accent)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
