"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  function onClick() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--btn)",
        border: "1px solid var(--btn-border)",
        color: "var(--text-primary)",
        padding: "8px 14px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        transition: "background 0.15s ease",
      }}
      aria-label="Copy share URL"
    >
      {copied ? "Copied!" : "Share simulation"}
    </button>
  );
}
