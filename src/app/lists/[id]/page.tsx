import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaceForm from "@/components/PlaceForm";
import TakeoutUpload from "@/components/TakeoutUpload";
import ListExplorer from "@/components/ListExplorer";
import ShareButton from "@/components/ShareButton";
import type { PlaceWithExtras } from "@/lib/types";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: list }, { data: places }, { data: otherLists }] =
    await Promise.all([
      supabase.from("lists").select("*").eq("id", id).single(),
      supabase
        .from("places")
        .select("*, reactions(*), comments(*)")
        .eq("list_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("lists").select("*").neq("id", id),
    ]);

  if (!list) notFound();

  const typedPlaces = (places ?? []) as PlaceWithExtras[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href="/lists"
            className="text-sm font-medium text-muted transition hover:text-ink"
          >
            ← Your lists
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {list.title}
          </h1>
        </div>
        <ShareButton shareToken={list.share_token} />
      </div>

      {otherLists && otherLists.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Compare with</span>
          {otherLists.map((other) => (
            <Link
              key={other.id}
              href={`/compare?a=${id}&b=${other.id}`}
              className="rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-ink shadow-card ring-1 ring-line/70 transition hover:shadow-lift"
            >
              {other.title}
            </Link>
          ))}
        </div>
      )}

      <section className="mt-6">
        <ListExplorer
          places={typedPlaces}
          listTitle={list.title}
          currentUserId={user.id}
          beforeList={
            <>
              <div className="rounded-2xl bg-card p-5 shadow-card ring-1 ring-line/70">
                <h2 className="mb-3 text-base font-semibold text-ink">
                  Add a place
                </h2>
                <PlaceForm listId={id} />
                <div className="mt-5 border-t border-line pt-5">
                  <TakeoutUpload listId={id} />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-ink">
                {typedPlaces.length}{" "}
                {typedPlaces.length === 1 ? "place" : "places"}
              </h2>
            </>
          }
        />
      </section>
    </main>
  );
}
