import { createBrowserClient } from "@supabase/ssr";

// Not typed against the generated Database schema (see src/lib/types.ts for
// why) - callers cast reads to the domain types in src/lib/types.ts instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
