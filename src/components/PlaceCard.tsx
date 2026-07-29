import ReactionButtons from "@/components/ReactionButtons";
import CommentThread from "@/components/CommentThread";
import type { PlaceWithExtras } from "@/lib/types";

// Structurally compatible with both a plain PlaceWithExtras (one list) and
// a MergedPlace (a place combined across two compared lists) - see
// src/lib/overlap.ts.
type DisplayPlace = Pick<
  PlaceWithExtras,
  "id" | "name" | "address" | "category" | "note" | "reactions" | "comments"
>;

export default function PlaceCard({
  place,
  placeIds,
  currentUserId,
  badge,
}: {
  place: DisplayPlace;
  // Defaults to [place.id]. Pass every underlying row id for a place merged
  // across two lists, so reacting/commenting applies to all of them.
  placeIds?: string[];
  currentUserId: string;
  badge?: string;
}) {
  const ids = placeIds ?? [place.id];
  const myReaction =
    place.reactions.find((r) => r.user_id === currentUserId)?.type ?? null;

  return (
    <li className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{place.name}</p>
          {place.address && (
            <p className="text-sm text-neutral-500">{place.address}</p>
          )}
          {place.category && (
            <p className="text-xs uppercase tracking-wide text-neutral-400">
              {place.category}
            </p>
          )}
          {place.note && <p className="mt-1 text-sm">{place.note}</p>}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3">
        <ReactionButtons placeIds={ids} myReaction={myReaction} />
      </div>

      <CommentThread placeIds={ids} comments={place.comments} />
    </li>
  );
}
