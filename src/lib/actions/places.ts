"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import type { ParsedPlace } from "@/lib/takeout";

export async function addPlace(listId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const address = String(formData.get("address") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const coords = address ? await geocodeAddress(address) : null;

  await supabase.from("places").insert({
    list_id: listId,
    name,
    address,
    category,
    note,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    source: "manual",
    created_by: user.id,
  });

  revalidatePath(`/lists/${listId}`);
}

export async function bulkAddPlaces(listId: string, places: ParsedPlace[]) {
  if (!places.length) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const rows = places.map((p) => ({
    list_id: listId,
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    source: "takeout" as const,
    created_by: user.id,
  }));

  // Insert in chunks so a large Takeout export doesn't hit request-size limits.
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await supabase.from("places").insert(rows.slice(i, i + chunkSize));
  }

  revalidatePath(`/lists/${listId}`);
}
