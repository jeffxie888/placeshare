import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export function helloWorld() {
  return "Hello, world!";
}

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/lists" : "/login");
}
