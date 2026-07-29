# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The note above isn't boilerplate — this project is on Next.js 16, and at
least two conventions changed from what most training data assumes:
`middleware.ts` is now `proxy.ts` (`export function proxy(request)`, not
`export function middleware(request)`), and `cookies()`/`headers()` are
async. Before touching routing, auth, or caching, check
`node_modules/next/dist/docs/01-app/` for the current API rather than
assuming Next 13-15 behavior.

## Commands

Run these from `placeshare/` (the app lives in a subdirectory of the repo root):

```bash
npm run dev      # start the dev server (Turbopack) at localhost:3000
npm run build    # production build
npm run start    # run a production build
npm run lint     # ESLint
npx tsc --noEmit # type-check without emitting
npm run smoke-test # end-to-end auth/RLS check against the real Supabase project (needs .env.local)
```

There is no unit test suite yet. `scripts/smoke-test.mjs` is the closest thing
to one — it exercises real auth + row-level security against the live
Supabase project (see README's "Verify the setup" section) rather than
mocking anything, since RLS policy bugs are exactly the kind of thing that
pass a naive mocked test and then fail in production.

## Setup required before running

The app will build and start without it, but every page redirects to
`/login` and auth will fail until you've completed the steps in
`README.md`: create a Supabase project, run `supabase/schema.sql` in its
SQL editor, enable anonymous sign-ins, and populate `.env.local` (copy
`.env.local.example`).

## Architecture

**Stack**: Next.js 16 App Router + TypeScript, Supabase (Postgres, Auth) for
the backend, Tailwind CSS v4, `react-leaflet` + OpenStreetMap tiles for maps
(no Google Maps API key needed).

**Access control lives in the database, not the app.** Every table in
`supabase/schema.sql` has row-level security policies keyed off
`has_list_access(list_id)`, a `security definer` SQL function that checks
whether `auth.uid()` owns the list or has a `list_members` row. Server
code (`src/lib/actions/*`, page data fetching) does plain
`supabase.from(...).select(...)` calls with no manual
"does this user own this?" checks — Postgres enforces it. When adding a
new table that hangs off `places` or `lists`, add RLS policies following
the existing pattern rather than checking access in TypeScript.

**Two Supabase clients, deliberately untyped.** `src/lib/supabase/client.ts`
(browser) and `src/lib/supabase/server.ts` (Server Components/Actions/Route
Handlers, via `@supabase/ssr` reading `cookies()`) are not parameterized
with a generated `Database` type — see the comment in `src/lib/types.ts`
for why (hand-typing the full supabase-js generic schema shape reliably is
more trouble than it's worth without `supabase gen types`). Reads are cast
to the domain types in `src/lib/types.ts` at the call site instead. If you
add `supabase gen types typescript`, wire the generated type back into both
clients.

**Session refresh happens in `src/proxy.ts`**, which delegates to
`src/lib/supabase/proxy.ts`. This runs on every request and calls
`supabase.auth.getUser()` (not `getSession()`) so expired tokens are
actually revalidated against Supabase, not just read from a cookie.

**Auth has two tracks that converge on the same `profiles` row:**
- Guest: `supabase.auth.signInAnonymously()` (login page / join-link route).
  A trigger (`handle_new_user` in `schema.sql`) creates the `profiles` row
  for both anonymous and real users on `auth.users` insert.
- Upgrade-in-place: `supabase.auth.updateUser({ email })` while signed in
  anonymously (`UpgradeGuestForm`) sends a confirmation link; once clicked,
  Supabase flips `is_anonymous` to false on the *same* user id, so existing
  lists/reactions/comments carry over with no data migration.
- Real accounts otherwise sign in via magic link (`signInWithOtp`), handled
  by `src/app/auth/callback/route.ts`.

**Sharing**: `lists.share_token` is a random unique string. `/join/[token]`
(`src/app/join/[token]/route.ts`) is a GET route handler — not a page —
because granting membership requires `signInAnonymously()` and RPC calls
that set cookies, which only Route Handlers and Server Actions can do.

**The three comparison views share one dataset.** `/compare?a=<listId>&b=<listId>`
fetches both lists' places (each joined with its `reactions` and `comments`)
once in `src/app/compare/page.tsx`, then passes them to
`src/components/ComparisonView.tsx`, which switches between Map, List, and
Swipe tabs over the same merged data — there's no separate data-fetching
path per view. `src/lib/overlap.ts`'s `mergeForComparison` does the "on both
lists" detection (case-insensitive name match; no fuzzy geo-matching by
design, to keep it simple) and, critically, collapses a matched pair into
one `MergedPlace` carrying both underlying rows' ids in `placeIds` plus the
union of their reactions/comments. **Always react to/comment on
`placeIds` (plural), never a single `place.id`,** anywhere in the
comparison view — reacting to only one underlying row is exactly the bug
that made the same restaurant show up as two separate swipe-queue cards
when this was first tested against real data. `ReactionButtons` and
`CommentThread` both take `placeIds: string[]` and fan the server action
out over every id.

**`lists.share_token` must stay URL-safe.** It's generated by
`generate_share_token()` in `schema.sql`, which strips `+`/`/`/`=` from
base64 output (plain base64 can contain `/`, which silently breaks
`/join/:token` by introducing an extra path segment — this actually
happened with real generated data before the fix). If you ever regenerate
tokens by hand, keep using that function rather than raw
`encode(..., 'base64')`.

**Place import has two paths that both write to the same `places` table:**
manual entry (`PlaceForm` -> `addPlace` server action -> geocodes the
address server-side via free OpenStreetMap Nominatim, `src/lib/geocode.ts`)
and bulk import (`TakeoutUpload` parses a Google Takeout Maps JSON export
client-side with `src/lib/takeout.ts`, then calls `bulkAddPlaces`). Google
Places API (paid, needs billing) is intentionally deferred — see the
README's "Adding Google Places API later" section before wiring up live
autocomplete.

**Map rendering must stay client-only.** `src/components/MapView.tsx` uses
Leaflet, which touches `window` at import time; it's only ever imported via
`src/components/MapViewLoader.tsx` (`next/dynamic` with `ssr: false`). Don't
import `MapView` directly from a Server Component.

## A caution on installing new packages here

While setting up the Supabase CLI (`npm install --save-dev supabase`), a
lifecycle script somewhere in the dependency tree silently rewrote
`package.json` — downgrading `next` to a six-year-old `^9.3.3` and adding an
unrelated `"node"` package — with no prompt. It only surfaced because
`next dev` then broke (`next.config.ts` isn't supported pre-Next-12). This
was caught and reverted via the clean `create-next-app` initial git commit;
see `git log` if it's still there. **After installing any new dependency,
diff `package.json` (`git diff -- package.json`) before trusting the
install succeeded as intended** — don't assume a clean-looking npm install
summary means nothing else changed.
