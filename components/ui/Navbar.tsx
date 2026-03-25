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
import {
  IconNetwork,
  IconLayers,
  IconSettings2,
  IconCompare,
  IconGenome,
  IconShare,
  IconTour,
  IconGitHub,
} from "@/components/icons";
import { useUser } from "@/hooks/useUser";

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
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#ffffff" : "#8888aa",
              transition: "background 150ms, color 150ms",
            }}
          >
            <Icon size={13} />
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openSuggest } = useSuggestTool();
  const { openWalkthrough } = useWalkthrough();
  const { user, loading: userLoading, signIn, signOut } = useUser();

  const tourRoute: TourRoute | null =
    pathname === "/explore"
      ? "explore"
      : pathname === "/stacks"
        ? "stacks"
        : pathname === "/builder"
          ? "builder"
          : null;

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
                    <Icon size={13} />
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
              <IconTour size={12} />
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

          {/* Auth: sign in / user menu */}
          {!userLoading && !user && (
            <button
              onClick={signIn}
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
              <IconGitHub size={14} />
              Sign in
            </button>
          )}
          {!userLoading && user && (
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              {user.user_metadata?.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.user_name ?? "avatar"}
                  width={24}
                  height={24}
                  style={{ borderRadius: "50%", flexShrink: 0 }}
                />
              )}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  maxWidth: 80,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.user_metadata?.user_name}
              </span>
              <button
                onClick={signOut}
                style={{
                  fontSize: 10,
                  color: "var(--text-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 4px",
                  opacity: 0.6,
                }}
                title="Sign out"
              >
                ✕
              </button>
            </div>
          )}

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
            <IconGitHub size={14} />
            GitHub
          </a>
        </div>
      </nav>

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
                color: copied ? "var(--accent-2)" : "var(--text-primary)",
              }}
            >
              <IconShare size={13} />
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
              <IconTour size={12} />
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
            <IconGitHub size={14} />
            GitHub
          </a>
          {!userLoading && !user && (
            <button
              onClick={() => {
                signIn();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <IconGitHub size={14} />
              Sign in with GitHub
            </button>
          )}
          {!userLoading && user && (
            <button
              onClick={() => {
                signOut();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              Sign out (@{user.user_metadata?.user_name})
            </button>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
