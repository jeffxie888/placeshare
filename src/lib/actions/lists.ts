"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createList(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("lists")
    .insert({ owner_id: user.id, title })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/lists");
  redirect(`/lists/${data.id}`);
}
