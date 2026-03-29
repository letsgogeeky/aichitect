"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 6,
        background: copied ? "#00d4aa18" : "var(--btn)",
        border: `1px solid ${copied ? "#00d4aa44" : "var(--btn-border)"}`,
        color: copied ? "#00d4aa" : "#8888aa",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 150ms",
        flexShrink: 0,
      }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}
