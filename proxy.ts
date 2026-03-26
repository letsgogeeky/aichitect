import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request so Server Components always
 * have an up-to-date session. Required by @supabase/ssr.
 */
export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;

  // Skip session refresh when Supabase is not configured (e.g. local dev without DB).
  if (!url || !anonKey) return supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(
            name,
            value,
            options as Parameters<typeof supabaseResponse.cookies.set>[2]
          )
        );
      },
    },
  });

  // Refreshes the session token if expired — must not be removed.
  // Wrapped in try/catch so a Supabase outage never blocks page loads.
  try {
    await supabase.auth.getUser();
  } catch {
    // Non-fatal — continue without a refreshed session.
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
