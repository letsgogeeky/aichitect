"use client";

import { useState, useEffect } from "react";
import { getChecklistItems, generateChecklist, ChecklistItem } from "@/lib/getStarted";
import { IconCopy, IconClose, IconExternalLink } from "@/components/icons";

interface Props {
  toolIds: string[];
  onClose: () => void;
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "14px 20px",
        borderBottom: "1px solid #1a1a28",
      }}
    >
      {/* Step badge */}
      <div
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: 6,
          background: "#1c1c28",
          border: "1px solid #2a2a3a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
          color: "#555577",
          marginTop: 1,
        }}
      >
        {item.step}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 3,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f8" }}>{item.toolName}</span>
          <span
            style={{
              fontSize: 10,
              color: "#555577",
              background: "#1c1c28",
              border: "1px solid #2a2a3a",
              borderRadius: 4,
              padding: "1px 6px",
              flexShrink: 0,
            }}
          >
            {item.slotDisplayName}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#8888aa",
            lineHeight: 1.5,
          }}
        >
          {item.tagline}
        </p>
      </div>

      {/* Time + link */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11, color: "#555577" }}>≈{item.timeEst}</span>
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "#7c6bff",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Get started
            <IconExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function GetStartedModal({ toolIds, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const items = getChecklistItems(toolIds);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function copyMarkdown() {
    const markdown = generateChecklist(toolIds);
    navigator.clipboard
      .writeText(markdown)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "80vh",
          background: "#111118",
          border: "1px solid #2a2a3a",
          borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 16px",
            borderBottom: "1px solid #1e1e2e",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: "#555577",
                margin: "0 0 4px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Setup checklist
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f8", margin: 0 }}>
              {items.length} tool{items.length !== 1 ? "s" : ""} to set up
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#555577",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
            }}
          >
            <IconClose />
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {items.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "#555577",
                fontSize: 13,
              }}
            >
              No tools selected yet. Add tools in the builder to generate your checklist.
            </div>
          ) : (
            items.map((item) => <ChecklistRow key={item.step} item={item} />)
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #1e1e2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, color: "#555577" }}>
              Export as markdown to use anywhere
            </span>
            <button
              onClick={copyMarkdown}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 14px",
                height: 32,
                borderRadius: 8,
                background: copied ? "#7c6bff30" : "#7c6bff18",
                border: `1px solid ${copied ? "#7c6bff88" : "#7c6bff44"}`,
                color: "#7c6bff",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <IconCopy size={13} />
              {copied ? "Copied!" : "Copy Markdown"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
