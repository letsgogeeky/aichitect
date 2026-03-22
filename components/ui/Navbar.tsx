"use client";

import { useState, Suspense } from "react";
import BottomSheet from "@/components/mobile/BottomSheet";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Logo from "./Logo";
import { GITHUB_URL, TOOL_COUNT, STACK_COUNT } from "@/lib/constants";
import type { Counts } from "@/lib/data/counts";
import { useSuggestTool } from "./SuggestToolContext";
import { useWalkthrough, TourRoute } from "./WalkthroughContext";
import GetStartedModal from "./GetStartedModal";

function IconNetwork() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  );
}

function IconSettings2() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}

function IconCompare() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <polyline points="9 11 12 8 15 11" />
      <polyline points="9 13 12 16 15 13" />
    </svg>
  );
}

function IconGenome() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12C2 12 7 7 12 12s10-0 10 0" />
      <path d="M2 12C2 12 7 17 12 12s10 0 10 0" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <line x1="2" y1="15" x2="22" y2="15" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function IconTour() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const VIEWS = [
  { href: "/stacks", label: "Stacks", Icon: IconLayers },
  { href: "/explore", label: "Graph", Icon: IconNetwork },
  { href: "/builder", label: "Builder", Icon: IconSettings2 },
  { href: "/compare", label: "Compare", Icon: IconCompare },
  { href: "/genome", label: "Genome", Icon: IconGenome },
];

function NavViewLinks() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const s = searchParams.get("s");

  return (
    <div
      className="flex items-center"
      style={{ background: "var(--btn)", borderRadius: 8, padding: 3, gap: 2, height: 34 }}
    >
      {VIEWS.map(({ href, label, Icon }) => {
        const active = href === "/compare" ? pathname.startsWith("/compare") : pathname === href;
        // Don't forward the stack ?s= param to routes that use their own URL state
        const forwardS = s && href !== "/genome" && href !== "/compare";
        const dest = forwardS ? `${href}?s=${s}` : href;
        return (
          <Link
            key={href}
            href={dest}
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
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Navbar({ counts }: { counts?: Counts }) {
  const toolCount = counts?.toolCount ?? TOOL_COUNT;
  const stackCount = counts?.stackCount ?? STACK_COUNT;
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openSuggest } = useSuggestTool();
  const { openWalkthrough } = useWalkthrough();

  const tourRoute: TourRoute | null =
    pathname === "/explore"
      ? "explore"
      : pathname === "/stacks"
        ? "stacks"
        : pathname === "/builder"
          ? "builder"
          : null;

  function openGetStarted() {
    setGetStartedOpen(true);
  }

  function getStartedToolIds(): string[] {
    if (typeof window === "undefined") return [];
    return (new URLSearchParams(window.location.search).get("s") ?? "").split(",").filter(Boolean);
  }

  function copyStack() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Clipboard access denied (e.g. permissions policy) — no-op
      });
  }

  return (
    <>
      <nav
        className="relative flex items-center justify-between flex-shrink-0 border-b"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          height: 56,
          padding: "0 20px",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Logo size={28} id="nav-logo-g" />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            AIchitect
          </span>
        </Link>

        {/* Spacer — mobile only; on desktop VIEWS are absolutely centered */}
        <div className="flex-1 sm:hidden" />

        {/* View toggle — absolutely centered on desktop so it never shifts with right-side content */}
        <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2">
          <Suspense
            fallback={
              <div
                className="flex items-center"
                style={{
                  background: "var(--btn)",
                  borderRadius: 8,
                  padding: 3,
                  gap: 2,
                  height: 34,
                }}
              >
                {VIEWS.map(({ href, label, Icon }) => (
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
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Icon />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                ))}
              </div>
            }
          >
            <NavViewLinks />
          </Suspense>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile: ⋯ menu button */}
          <button
            className="sm:hidden flex items-center justify-center"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--btn)",
              border: "1px solid var(--btn-border)",
              color: "var(--text-secondary)",
              fontSize: 16,
              cursor: "pointer",
            }}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="More options"
          >
            ···
          </button>

          {/* Explore: tools & stacks count */}
          {pathname === "/explore" && (
            <div
              className="hidden sm:flex items-center"
              style={{
                gap: 6,
                padding: "4px 10px",
                borderRadius: 20,
                background: "var(--btn)",
                border: "1px solid var(--btn-border)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent-2)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {toolCount} tools · {stackCount} stacks
              </span>
            </div>
          )}

          {/* Builder: get started */}
          {pathname === "/builder" && (
            <button
              onClick={openGetStarted}
              className="hidden sm:flex items-center transition-all"
              style={{
                gap: 6,
                padding: "0 14px",
                height: 34,
                borderRadius: 8,
                background: "#7c6bff18",
                border: "1px solid #7c6bff44",
                color: "var(--accent)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Get Started →
            </button>
          )}

          {/* Builder: share stack — hidden on mobile (already in bottom sheet) */}
          {pathname === "/builder" && (
            <button
              data-tour="builder-share"
              onClick={copyStack}
              className="hidden sm:flex items-center transition-all"
              style={{
                gap: 6,
                padding: "0 14px",
                height: 34,
                borderRadius: 8,
                background: copied ? "#00d4aa30" : "#00d4aa18",
                border: `1px solid ${copied ? "#00d4aa88" : "#00d4aa44"}`,
                color: "var(--accent-2)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <IconShare />
              {copied ? "Copied!" : "Share Stack"}
            </button>
          )}

          {/* Tour button */}
          {tourRoute && (
            <button
              onClick={() => openWalkthrough(tourRoute)}
              className="hidden sm:flex items-center flex-shrink-0 transition-colors text-text-secondary hover:text-text-primary"
              style={{
                gap: 5,
                padding: "0 10px",
                height: 34,
                borderRadius: 8,
                background: "var(--btn)",
                border: "1px solid var(--btn-border)",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
              }}
              title="Start page tour"
            >
              <IconTour />
              Tour
            </button>
          )}

          {/* Suggest a Tool */}
          <button
            onClick={() => openSuggest()}
            className="hidden sm:flex items-center flex-shrink-0 transition-colors text-text-secondary hover:text-text-primary"
            style={{
              gap: 5,
              padding: "0 10px",
              height: 34,
              borderRadius: 8,
              background: "var(--btn)",
              border: "1px solid var(--btn-border)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + Suggest a Tool
          </button>

          {/* GitHub */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center flex-shrink-0 transition-colors text-text-secondary hover:text-text-primary"
            style={{
              gap: 5,
              padding: "0 10px",
              height: 34,
              borderRadius: 8,
              background: "var(--btn)",
              border: "1px solid var(--btn-border)",
              fontSize: 11,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <IconGitHub />
            GitHub
          </a>
        </div>
      </nav>

      {getStartedOpen && (
        <GetStartedModal toolIds={getStartedToolIds()} onClose={() => setGetStartedOpen(false)} />
      )}

      {/* Mobile: ⋯ menu bottom sheet */}
      <BottomSheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        snapPoints={[40, 60]}
      >
        <div className="px-4 pt-1 pb-4 space-y-2">
          {pathname === "/builder" && (
            <button
              onClick={() => {
                copyStack();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium"
              style={{
                background: copied ? "#00d4aa18" : "var(--surface-2)",
                border: `1px solid ${copied ? "#00d4aa44" : "var(--border)"}`,
                color: copied ? "#00d4aa" : "var(--text-primary)",
              }}
            >
              <IconShare />
              {copied ? "Copied!" : "Share Stack"}
            </button>
          )}
          {tourRoute && (
            <button
              onClick={() => {
                openWalkthrough(tourRoute);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <IconTour />
              Take a Tour
            </button>
          )}
          <button
            onClick={() => {
              openSuggest();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            + Suggest a Tool
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              textDecoration: "none",
              display: "flex",
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <IconGitHub />
            GitHub
          </a>
        </div>
      </BottomSheet>
    </>
  );
}
