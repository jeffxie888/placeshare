# Placeshare

Share the places you've saved with friends, see where your lists overlap,
and react to each other's picks — as a map, a list, or a swipeable queue.

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, then in
**Project Settings -> API** copy the Project URL and `anon` public key.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
step 1. Leave `NEXT_PUBLIC_SITE_URL` as `http://localhost:3000` for local dev.

### 3. Run the database schema

In the Supabase dashboard, open **SQL Editor -> New query**, paste the
contents of `supabase/schema.sql`, and run it. This creates all tables, the
profile-on-signup trigger, and the row-level security policies that gate
access to lists/places/reactions/comments. It's safe to re-run.

### 4. Enable anonymous sign-ins

Guest mode depends on Supabase's anonymous auth. In the dashboard, go to
**Authentication -> Sign In / Providers** and turn on **Allow anonymous
sign-ins** (off by default).

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Verify the setup (optional but recommended)

```bash
npm run smoke-test
```

Runs `scripts/smoke-test.mjs` against your real Supabase project: two guest
sessions sign in, one creates a list and a place, the other joins via share
token and reacts/comments, and a third session confirms it's blocked until
invited. Exercises auth + the RLS policies end to end without needing a
browser. Creates and deletes its own throwaway list — safe to run anytime.

## How it works

- **Guest mode**: "Continue as guest" creates an anonymous Supabase user so
  people can try the app with zero signup friction. A banner on `/lists`
  lets a guest attach an email later (`UpgradeGuestForm`), which upgrades
  the same account to a permanent one without losing their lists.
- **Real accounts**: passwordless, via Supabase magic-link email
  (`signInWithOtp`).
- **Sharing**: every list has a `share_token`. Visiting `/join/:token`
  signs the visitor in (as a guest, if needed) and grants them membership
  via the `join_list_by_token` Postgres function, then redirects them into
  the list.
- **Access control**: enforced entirely through Postgres row-level security
  (`supabase/schema.sql`), not app code — a user can read/write a list's
  places, reactions, and comments if they're the owner or a
  `list_members` row, via the `has_list_access()` helper function.
- **Importing places**: manual entry (free-text, geocoded server-side via
  OpenStreetMap Nominatim — see `src/lib/geocode.ts`) or bulk import from a
  Google Takeout Maps export (`src/lib/takeout.ts` parses
  `Saved Places.json` or any individual list file).
- **Comparing lists**: `/compare?a=<listId>&b=<listId>` renders one shared
  dataset through three tabs (`ComparisonView`) — a map, a list, and a
  Tinder-style swipe queue of places you haven't reacted to yet.
  `src/lib/overlap.ts`'s `mergeForComparison` collapses a place that's on
  both lists into a single entry (by name match) before any of the three
  views render it, combining its reactions/comments from both underlying
  rows — otherwise the same restaurant would show up as two separate cards
  to react to, which is what an early real-data test actually surfaced.
- The map fits its view to whatever the places' bounding box actually is
  (`MapContainer`'s `bounds` prop), rather than a fixed zoom level — a
  fixed zoom looks fine for a demo but is wrong for most real lists
  (way too zoomed out for one neighborhood, too close for a whole country).

## Adding Google Places API later

Manual place entry currently uses plain text fields + free geocoding, to
avoid requiring a Google Cloud billing account up front. To upgrade to live
autocomplete/search:

1. Create a Google Cloud project, enable the **Places API**, and attach a
   billing account (required even within the free tier).
2. Use **Autocomplete session tokens** so a full search-then-select counts
   as one billable "session" rather than one call per keystroke.
3. Swap the free-text inputs in `src/components/PlaceForm.tsx` for the
   Places Autocomplete widget/API, and use Place Details for
   name/address/coordinates instead of `geocodeAddress()`.

Free tier (as of the pricing change in March 2025): 10,000 free
Essentials-tier requests/month, 5,000 for Pro-tier fields, 1,000 for
Enterprise-tier — see the
[Places API usage & billing docs](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
for current numbers before enabling billing.

## Seeding sample data from your own Google Takeout export

`scripts/seed-london.mjs` is an example of driving the real import parser
(`src/lib/takeout.ts`) end to end: it reads a Takeout Maps export, filters
to a geographic bounding box, and creates a list from the result. To use
it: export your data at [Google Takeout](https://takeout.google.com)
(select only Maps), unzip it into a `Takeout/` folder at the project root
(already gitignored - it's real location history), adjust the bounding box
in the script, then run:

```bash
node --env-file=.env.local scripts/seed-london.mjs
```
