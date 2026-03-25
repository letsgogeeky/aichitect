"use client";

import { useUser } from "@/hooks/useUser";
import { IconGitHub } from "@/components/icons";

export function LandingAuthButton() {
  const { user, loading, signIn, signOut } = useUser();

  if (loading) return null;

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {user.user_metadata?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.user_name ?? "avatar"}
            style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0 }}
          />
        )}
        <span
          style={{
            fontSize: 11,
            color: "#8888aa",
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
          title="Sign out"
          style={{
            fontSize: 10,
            color: "#555577",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 12px",
        height: 34,
        borderRadius: 8,
        background: "#1c1c28",
        border: "1px solid #2a2a3a",
        color: "#8888aa",
        fontSize: 11,
        fontWeight: 500,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <IconGitHub size={14} />
      Sign in
    </button>
  );
}
