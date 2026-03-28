import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function DELETE(req: NextRequest) {
  // Authenticate the request via the session cookie
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Session-aware client to verify the caller
  const sessionClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
        );
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Service role client for privileged operations
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Delete tool_usage rows
  const { error: usageError } = await adminClient
    .from("tool_usage")
    .delete()
    .eq("user_id", user.id);

  if (usageError) {
    console.error("[account/delete] tool_usage delete failed:", usageError);
    return NextResponse.json({ error: "Failed to delete usage data" }, { status: 500 });
  }

  // 2. Delete profile row
  const { error: profileError } = await adminClient.from("profiles").delete().eq("id", user.id);

  if (profileError) {
    console.error("[account/delete] profiles delete failed:", profileError);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }

  // 3. Delete the auth user
  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    console.error("[account/delete] auth user delete failed:", deleteUserError);
    return NextResponse.json({ error: "Failed to delete auth account" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
