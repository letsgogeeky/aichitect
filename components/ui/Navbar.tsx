"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { GITHUB_URL, TOOL_COUNT, STACK_COUNT } from "@/lib/constants";

function IconNetwork() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
    </svg>
  );
}

function IconSettings2() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7h-9"/><path d="M14 17H5"/>
      <circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

const VIEWS = [
  { href: "/stacks",  label: "Stacks",  Icon: IconLayers },
  { href: "/explore", label: "Graph",   Icon: IconNetwork },
  { href: "/builder", label: "Builder", Icon: IconSettings2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  function copyStack() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <nav
      className="flex items-center justify-between flex-shrink-0 border-b"
      style={{
        background: "#111118",
        borderColor: "var(--border)",
        height: 56,
        padding: "0 20px",
        gap: 16,
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <Logo size={28} id="nav-logo-g" />
        <span style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f8" }}>
          AIchitect
        </span>
      </Link>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* View toggle */}
      <div
        className="flex items-center"
        style={{ background: "#1c1c28", borderRadius: 8, padding: 3, gap: 2, height: 34 }}
      >
        {VIEWS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center"
              style={{
                gap: 6,
                padding: "0 12px",
                height: "100%",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: active ? 500 : 400,
                background: active ? "#7c6bff" : "transparent",
                color: active ? "#ffffff" : "#8888aa",
                transition: "background 150ms, color 150ms",
              }}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right slot */}
      {pathname === "/explore" && (
        <div
          className="flex items-center flex-shrink-0"
          style={{
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            background: "#1c1c28",
            border: "1px solid #2a2a3a",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4aa", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#8888aa" }}>{TOOL_COUNT} tools · {STACK_COUNT} stacks</span>
        </div>
      )}

      {pathname === "/builder" && (
        <button
          onClick={copyStack}
          className="flex items-center flex-shrink-0 transition-all"
          style={{
            gap: 6,
            padding: "0 14px",
            height: 34,
            borderRadius: 8,
            background: copied ? "#00d4aa30" : "#00d4aa18",
            border: `1px solid ${copied ? "#00d4aa88" : "#00d4aa44"}`,
            color: "#00d4aa",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <IconShare />
          {copied ? "Copied!" : "Share Stack"}
        </button>
      )}

      {/* GitHub link — always visible */}
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center flex-shrink-0 transition-colors"
        style={{
          gap: 5,
          padding: "0 10px",
          height: 34,
          borderRadius: 8,
          background: "#1c1c28",
          border: "1px solid #2a2a3a",
          color: "#8888aa",
          fontSize: 11,
          fontWeight: 500,
          textDecoration: "none",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f0f0f8")}
        onMouseLeave={e => (e.currentTarget.style.color = "#8888aa")}
      >
        <IconGitHub />
        GitHub
      </a>
    </nav>
  );
}
