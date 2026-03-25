import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GitHub OAuth callback — exchanges the authorization code for a Supabase session,
 * upserts the user's profile row, then redirects to the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(
                name,
                value,
                options as Parameters<typeof response.cookies.set>[2]
              )
            );
          },
        },
      }
    );

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) {
      console.error("[auth/callback] exchangeCodeForSession error:", sessionError.message);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    // Upsert profile — safer than a trigger: visible errors, no signup blocking
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const meta = user.user_metadata;
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        github_id: meta.sub ? Number(meta.sub) : null,
        github_username: meta.user_name ?? meta.preferred_username ?? meta.login ?? "",
        avatar_url: meta.avatar_url ?? null,
      });
      if (profileError) {
        // Non-fatal: log but don't block sign-in
        console.error("[auth/callback] profile upsert error:", profileError.message);
      }
    }

    return response;
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
