"use client";

import { useState, useEffect, useMemo } from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/db";
import type { SavedStack } from "@/lib/types";

export interface UseUserResult {
  user: User | null;
  loading: boolean;
  savedStacks: SavedStack[];
  savedStacksLoading: boolean;
  refreshSavedStacks: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useUser(): UseUserResult {
  // createBrowserClient returns a singleton — safe to call in useMemo with no deps
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [user, setUser] = useState<User | null>(null);
  // If no supabase client (env vars absent at build time), skip loading state entirely
  const [loading, setLoading] = useState(supabase !== null);
  const [savedStacks, setSavedStacks] = useState<SavedStack[]>([]);
  const [savedStacksLoading, setSavedStacksLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // Derived — cleared whenever user is null so no setState in effect body needed
  const resolvedStacks = user ? savedStacks : [];

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setSavedStacksLoading(true);
      try {
        const r = await fetch("/api/stacks");
        const data: SavedStack[] = r.ok ? await r.json() : [];
        if (!cancelled) setSavedStacks(data ?? []);
      } catch {
        // leave stacks as-is on error
      } finally {
        if (!cancelled) setSavedStacksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  function refreshSavedStacks() {
    setRefreshKey((k) => k + 1);
  }

  async function signIn() {
    if (!supabase) return;
    const next = window.location.pathname + window.location.search;
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return {
    user,
    loading,
    savedStacks: resolvedStacks,
    savedStacksLoading,
    refreshSavedStacks,
    signIn,
    signOut,
  };
}
