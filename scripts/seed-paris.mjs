// Seeds two mock Paris lists with a deliberate overlap, purely to exercise
// the comparison view - unlike seed-london.mjs there's no Takeout export
// behind this, the places are hardcoded.
//
// Two lists rather than one because the interesting half of /compare is the
// "on both lists" merge (src/lib/overlap.ts), which only triggers on an
// exact case-insensitive name match. Seeding a single list to compare
// against your real one would almost certainly produce zero overlaps and
// leave that path untested.
//
// Run with: npm run seed-paris
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Categories are set explicitly rather than left to inferCategory's
// name-keyword guess, since French names ("Du Pain et des Idées") carry
// none of the English keywords it looks for.
const ON_BOTH = [
  {
    name: "Le Comptoir du Relais",
    address: "9 Carrefour de l'Odéon, 75006 Paris, France",
    lat: 48.8515,
    lng: 2.3387,
    category: "restaurant",
  },
  {
    name: "Du Pain et des Idées",
    address: "34 Rue Yves Toudic, 75010 Paris, France",
    lat: 48.8697,
    lng: 2.3628,
    category: "bakery",
  },
  {
    name: "Septime",
    address: "80 Rue de Charonne, 75011 Paris, France",
    lat: 48.8531,
    lng: 2.3803,
    category: "restaurant",
  },
];

const ONLY_A = [
  {
    name: "Café de Flore",
    address: "172 Boulevard Saint-Germain, 75006 Paris, France",
    lat: 48.8542,
    lng: 2.3327,
    category: "cafe",
    note: "Touristy but the terrace is the point.",
  },
  {
    name: "Le Chateaubriand",
    address: "129 Avenue Parmentier, 75011 Paris, France",
    lat: 48.8656,
    lng: 2.3714,
    category: "restaurant",
  },
  {
    name: "Bar Hemingway",
    address: "15 Place Vendôme, 75001 Paris, France",
    lat: 48.8681,
    lng: 2.3295,
    category: "bar",
    note: "Expensive. Worth it once.",
  },
];

const ONLY_B = [
  {
    name: "Clamato",
    address: "80 Rue de Charonne, 75011 Paris, France",
    lat: 48.853,
    lng: 2.3805,
    category: "restaurant",
    note: "No reservations — go early.",
  },
  {
    name: "Ten Belles",
    address: "10 Rue de la Grange aux Belles, 75010 Paris, France",
    lat: 48.8722,
    lng: 2.3663,
    category: "cafe",
  },
  {
    name: "Hôtel Costes",
    address: "239 Rue Saint-Honoré, 75001 Paris, France",
    lat: 48.8672,
    lng: 2.3269,
    category: "hotel",
  },
  {
    name: "Boulangerie Utopie",
    address: "20 Rue Jean-Pierre Timbaud, 75011 Paris, France",
    lat: 48.8664,
    lng: 2.3711,
    category: "bakery",
  },
];

const supabase = createClient(url, key);

const { data: authData, error: authErr } = await supabase.auth.signInAnonymously();
if (authErr) throw authErr;
const ownerId = authData.user.id;

async function seedList(title, places) {
  const { data: list, error: listErr } = await supabase
    .from("lists")
    .insert({ owner_id: ownerId, title })
    .select("*")
    .single();
  if (listErr) throw listErr;

  const { error: insertErr } = await supabase.from("places").insert(
    places.map((p) => ({
      list_id: list.id,
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      category: p.category,
      note: p.note ?? null,
      source: "manual",
      created_by: ownerId,
    }))
  );
  if (insertErr) throw insertErr;

  return list;
}

const listA = await seedList("Paris — Jeff's picks", [...ON_BOTH, ...ONLY_A]);
const listB = await seedList("Paris — Camille's picks", [...ON_BOTH, ...ONLY_B]);

console.log(`\nCreated "${listA.title}" (${ON_BOTH.length + ONLY_A.length} places)`);
console.log(`Created "${listB.title}" (${ON_BOTH.length + ONLY_B.length} places)`);
console.log(`\n${ON_BOTH.length} places are on both lists.`);
console.log(`\nOpen both links to add these lists to your account:`);
console.log(`  http://localhost:3000/join/${listA.share_token}`);
console.log(`  http://localhost:3000/join/${listB.share_token}`);
