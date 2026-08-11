"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { IconGitHub } from "@/components/icons";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, loading, signIn } = useUser();
  const username = user?.user_metadata?.user_name as string | undefined;

  useEffect(() => {
    if (loading || !username) return;
    router.replace(`/profile/${username}`);
  }, [loading, username, router]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {loading || username ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading your profile…</p>
      ) : (
        <>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
            Sign in to view your profile.
          </p>
          <button
            onClick={() => signIn()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <IconGitHub size={14} />
            Sign in with GitHub
          </button>
        </>
      )}
    </div>
  );
}
