"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { createSupabaseBrowserClient } from "@/lib/db";

interface Props {
  stackId?: string;
  tools?: string[];
}

export function ProductionUsageSection({ stackId, tools }: Props) {
  const { user, signIn } = useUser();
  const [count, setCount] = useState(0);
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || (!stackId && !tools?.length)) return;

    async function load() {
      let query = supabase!.from("production_usage").select("user_id");
      if (stackId) {
        query = query.eq("stack_id", stackId);
      } else if (tools?.length) {
        query = query.contains("tools", tools);
      }
      const { data } = await query;
      setCount(data?.length ?? 0);
      setReported(data?.some((r: { user_id: string }) => r.user_id === user?.id) ?? false);
    }

    load();
  }, [stackId, tools, user?.id]);

  async function toggle() {
    if (!user) {
      signIn();
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    if (reported) {
      let q = supabase.from("production_usage").delete().eq("user_id", user.id);
      if (stackId) q = q.eq("stack_id", stackId);
      await q;
    } else {
      await supabase.from("production_usage").insert({
        user_id: user.id,
        github_username: user.user_metadata?.user_name ?? "",
        avatar_url: user.user_metadata?.avatar_url ?? null,
        stack_id: stackId ?? null,
        tools: tools ?? [],
      });
    }

    // Refetch after mutation
    let query = supabase.from("production_usage").select("user_id");
    if (stackId) {
      query = query.eq("stack_id", stackId);
    } else if (tools?.length) {
      query = query.contains("tools", tools);
    }
    const { data } = await query;
    setCount(data?.length ?? 0);
    setReported(data?.some((r: { user_id: string }) => r.user_id === user.id) ?? false);

    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "0 12px",
        height: 32,
        borderRadius: 7,
        fontSize: 12,
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
        background: reported ? "#26de8118" : "var(--btn)",
        border: `1px solid ${reported ? "#26de8144" : "var(--btn-border)"}`,
        color: reported ? "#26de81" : "var(--text-secondary)",
        transition: "all 150ms",
        flexShrink: 0,
        textDecoration: "none",
      }}
    >
      {reported ? "✓ Running in prod" : "I run this in prod"}
      {count > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: reported ? "#26de8188" : "var(--text-muted)",
          }}
        >
          · {count}
        </span>
      )}
    </button>
  );
}
