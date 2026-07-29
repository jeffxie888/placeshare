import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Creates a Supabase client for use in Server Components, Server Actions,
// and Route Handlers. Must be created fresh per request (cookies() is
// request-scoped), so never module-cache the return value. Not typed
// against the generated Database schema (see src/lib/types.ts) - callers
// cast reads to the domain types there instead.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component - safe to ignore because
            // `proxy.ts` refreshes the session on every request instead.
          }
        },
      },
    }
  );
}
