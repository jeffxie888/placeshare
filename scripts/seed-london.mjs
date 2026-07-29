import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
// Exercise the real production parser (src/lib/takeout.ts), not a
// reimplementation, so this doubles as a check that it handles real data.
const { parseTakeoutFile } = require("../src/lib/takeout.ts");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const LONDON_BOUNDS = { minLat: 51.28, maxLat: 51.70, minLng: -0.51, maxLng: 0.33 };
function inLondon(p) {
  return (
    p.lat !== null &&
    p.lat >= LONDON_BOUNDS.minLat &&
    p.lat <= LONDON_BOUNDS.maxLat &&
    p.lng >= LONDON_BOUNDS.minLng &&
    p.lng <= LONDON_BOUNDS.maxLng
  );
}

const raw = fs.readFileSync("Takeout/Maps (your places)/Saved Places.json", "utf-8");
const { places } = parseTakeoutFile(raw);
const londonFromTakeout = places.filter(inLondon);

// A couple of places only showed up with real color in Reviews.json (actual
// visited/rated spots with review text) rather than the saved-places list.
const reviewsRaw = JSON.parse(
  fs.readFileSync("Takeout/Maps (your places)/Reviews.json", "utf-8")
);
const reviewExtras = reviewsRaw.features
  .map((f) => ({
    name: f.properties.location?.name,
    address: f.properties.location?.address,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    note: f.properties.review_text_published || null,
  }))
  .filter((p) => p.name && inLondon(p));

console.log(`Takeout-sourced London places: ${londonFromTakeout.length}`);
console.log(`Review-sourced London places: ${reviewExtras.length}`);

const supabase = createClient(url, key);
const { data: authData, error: authErr } = await supabase.auth.signInAnonymously();
if (authErr) throw authErr;
const ownerId = authData.user.id;

const { data: list, error: listErr } = await supabase
  .from("lists")
  .insert({ owner_id: ownerId, title: "London" })
  .select("*")
  .single();
if (listErr) throw listErr;

const takeoutRows = londonFromTakeout.map((p) => ({
  list_id: list.id,
  name: p.name,
  address: p.address,
  lat: p.lat,
  lng: p.lng,
  source: "takeout",
  created_by: ownerId,
}));

const reviewRows = reviewExtras.map((p) => ({
  list_id: list.id,
  name: p.name,
  address: p.address,
  lat: p.lat,
  lng: p.lng,
  note: p.note,
  source: "manual",
  created_by: ownerId,
}));

const { error: insertErr } = await supabase
  .from("places")
  .insert([...takeoutRows, ...reviewRows]);
if (insertErr) throw insertErr;

console.log(`\nCreated list "${list.title}" (${list.id})`);
console.log(`Share link: http://localhost:3000/join/${list.share_token}`);
console.log(`Total places: ${takeoutRows.length + reviewRows.length}`);
