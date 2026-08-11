"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
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
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 360 }}>
            Something went wrong rendering this page.
          </p>
          <button
            onClick={() => unstable_retry()}
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
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
