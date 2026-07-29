import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ComparisonView from "@/components/ComparisonView";
import type { PlaceWithExtras } from "@/lib/types";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  if (!a || !b) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const placesQuery = (listId: string) =>
    supabase
      .from("places")
      .select("*, reactions(*), comments(*)")
      .eq("list_id", listId)
      .order("created_at", { ascending: false });

  const [{ data: listA }, { data: listB }, { data: placesA }, { data: placesB }] =
    await Promise.all([
      supabase.from("lists").select("*").eq("id", a).single(),
      supabase.from("lists").select("*").eq("id", b).single(),
      placesQuery(a),
      placesQuery(b),
    ]);

  if (!listA || !listB) notFound();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href={`/lists/${a}`}
        className="text-sm font-medium text-muted transition hover:text-ink"
      >
        ← {listA.title}
      </Link>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
        {listA.title} <span className="text-muted">vs</span> {listB.title}
      </h1>

      <div className="mt-6">
        <ComparisonView
          listA={listA}
          listB={listB}
          placesA={(placesA ?? []) as PlaceWithExtras[]}
          placesB={(placesB ?? []) as PlaceWithExtras[]}
          currentUserId={user.id}
        />
      </div>
    </main>
  );
}
