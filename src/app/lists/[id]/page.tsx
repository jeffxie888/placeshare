import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaceForm from "@/components/PlaceForm";
import TakeoutUpload from "@/components/TakeoutUpload";
import PlaceList from "@/components/PlaceList";
import ShareButton from "@/components/ShareButton";
import MapView from "@/components/MapViewLoader";
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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/lists" className="text-sm text-neutral-500 hover:underline">
            ← Your lists
          </Link>
          <h1 className="text-2xl font-semibold">{list.title}</h1>
        </div>
        <ShareButton shareToken={list.share_token} />
      </div>

      {otherLists && otherLists.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="text-neutral-500">Compare with:</span>
          {otherLists.map((other) => (
            <Link
              key={other.id}
              href={`/compare?a=${id}&b=${other.id}`}
              className="text-neutral-700 underline dark:text-neutral-300"
            >
              {other.title}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 h-72">
        <MapView layers={[{ label: list.title, color: "#2563eb", places: typedPlaces }]} />
      </div>

      <section className="mt-8 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-sm font-semibold">Add a place</h2>
        <PlaceForm listId={id} />
        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <TakeoutUpload listId={id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">
          Places ({typedPlaces.length})
        </h2>
        <PlaceList places={typedPlaces} currentUserId={user.id} />
      </section>
    </main>
  );
}
