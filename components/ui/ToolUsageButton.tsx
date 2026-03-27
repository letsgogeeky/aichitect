"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { createSupabaseBrowserClient } from "@/lib/db";

interface Props {
  toolId: string;
  color: string;
  compact?: boolean;
}

export function ToolUsageButton({ toolId, color, compact = false }: Props) {
  const { user, signIn } = useUser();
  const [count, setCount] = useState(0);
  const [used, setUsed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("tool_usage")
      .select("user_id")
      .eq("tool_id", toolId)
      .then(({ data }) => {
        if (cancelled) return;
        setCount(data?.length ?? 0);
        setUsed(data?.some((r: { user_id: string }) => r.user_id === user?.id) ?? false);
      });
    return () => {
      cancelled = true;
    };
  }, [toolId, user?.id]);

  async function toggle() {
    if (!user) {
      signIn();
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    if (used) {
      await supabase.from("tool_usage").delete().eq("user_id", user.id).eq("tool_id", toolId);
    } else {
      await supabase.from("tool_usage").insert({
        user_id: user.id,
        github_username: user.user_metadata?.user_name ?? "",
        avatar_url: user.user_metadata?.avatar_url ?? null,
        tool_id: toolId,
      });
    }

    const { data } = await supabase.from("tool_usage").select("user_id").eq("tool_id", toolId);
    setCount(data?.length ?? 0);
    setUsed(data?.some((r: { user_id: string }) => r.user_id === user.id) ?? false);
    setLoading(false);
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        title={used ? "✓ You use this tool" : "Mark as used"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "0 6px",
          height: 22,
          borderRadius: 5,
          fontSize: 10,
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
          background: used ? color + "18" : "var(--surface-2)",
          border: `1px solid ${used ? color + "44" : "var(--border)"}`,
          color: used ? color : "var(--text-muted)",
          transition: "all 150ms",
          flexShrink: 0,
        }}
      >
        {used ? "✓" : "use"}
        {count > 0 && <span style={{ fontSize: 8, opacity: 0.7 }}>{count}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "0 12px",
        height: 32,
        borderRadius: 7,
        fontSize: 12,
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
        background: used ? color + "18" : "var(--btn)",
        border: `1px solid ${used ? color + "44" : "var(--btn-border)"}`,
        color: used ? color : "var(--text-secondary)",
        transition: "all 150ms",
        flexShrink: 0,
        width: "100%",
      }}
    >
      {used ? "✓ Using this" : "I use this"}
      {count > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: used ? color + "88" : "var(--text-muted)",
          }}
        >
          · {count}
        </span>
      )}
    </button>
  );
}
