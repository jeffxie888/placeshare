"use server";

import { createClient } from "@/lib/supabase/server";
import type { ReactionType } from "@/lib/types";

export async function setReaction(placeId: string, type: ReactionType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("reactions")
    .upsert(
      { place_id: placeId, user_id: user.id, type },
      { onConflict: "place_id,user_id" }
    );
}

export async function clearReaction(placeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("reactions")
    .delete()
    .eq("place_id", placeId)
    .eq("user_id", user.id);
}

export async function addComment(placeId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("comments")
    .insert({ place_id: placeId, user_id: user.id, body: trimmed });
}
