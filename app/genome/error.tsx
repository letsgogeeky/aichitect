"use client";

import { useEffect } from "react";

export default function GenomeError({
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
        height: "100%",
        minHeight: 320,
        gap: 12,
        padding: 32,
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 13, color: "#8888aa", maxWidth: 360 }}>
        Something went wrong in the Genome analyzer. Try pasting your dependencies again.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "8px 20px",
          borderRadius: 8,
          background: "#7c6bff22",
          border: "1px solid #7c6bff66",
          color: "#7c6bff",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Start over
      </button>
    </div>
  );
}
