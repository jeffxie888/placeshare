import ReactionButtons from "@/components/ReactionButtons";
import CommentThread from "@/components/CommentThread";
import DeletePlaceButton from "@/components/DeletePlaceButton";
import { inferCategory, CATEGORY_EMOJI } from "@/lib/placeCategory";
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
  selected = false,
  onSelect,
  onToggleSelected,
  onHover,
  deletable = false,
}: {
  place: DisplayPlace;
  // Defaults to [place.id]. Pass every underlying row id for a place merged
  // across two lists, so reacting/commenting applies to all of them.
  placeIds?: string[];
  currentUserId: string;
  badge?: string;
  // Set from a client component pairing this card with a map (see
  // SplitMapLayout). Omitted everywhere the card stands on its own, which
  // also keeps it renderable from a Server Component.
  selected?: boolean;
  onSelect?: () => void;
  // Adds a checkbox that adds/removes this card from a multi-place
  // selection, as opposed to onSelect which replaces the selection.
  onToggleSelected?: () => void;
  onHover?: (placeId: string | null) => void;
  // Only set where the card maps to exactly one row on one list, i.e. that
  // list's own page - see deletePlace in src/lib/actions/places.ts.
  deletable?: boolean;
}) {
  const ids = placeIds ?? [place.id];
  const myReaction =
    place.reactions.find((r) => r.user_id === currentUserId)?.type ?? null;
  const emoji = CATEGORY_EMOJI[inferCategory(place)];

  return (
    <li
      id={`place-${place.id}`}
      onMouseEnter={onHover ? () => onHover(place.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      className={`rounded-2xl bg-card p-3 transition duration-200 ${
        selected
          ? "shadow-lift ring-2 ring-brand"
          : "shadow-card ring-1 ring-line/70 hover:shadow-lift"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Sits outside the clickable block below so ticking the box adds to
            the selection instead of replacing it with just this place. */}
        {onToggleSelected && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            aria-label={`Select ${place.name}`}
            className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-brand"
          />
        )}

        {/* Only the descriptive half of the card selects it - leaving the
            reaction buttons and comment box below to handle their own clicks. */}
        <div
          className={`flex min-w-0 flex-1 items-start gap-3 ${
            onSelect ? "cursor-pointer" : ""
          }`}
          onClick={onSelect}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onKeyDown={
            onSelect
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect();
                  }
                }
              : undefined
          }
        >
          {/* Airbnb's cards lead with a photo. There are no photos here -
              the category tile is the honest stand-in, and it still gives
              the row a fixed visual anchor to scan down. */}
          <span
            aria-hidden
            className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-surface text-2xl"
          >
            {emoji}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-semibold text-ink">{place.name}</p>
              {badge && (
                <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
                  {badge}
                </span>
              )}
            </div>
            {place.address && (
              <p className="mt-0.5 truncate text-sm text-muted">{place.address}</p>
            )}
            {place.category && (
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted">
                {place.category}
              </p>
            )}
            {place.note && <p className="mt-1.5 text-sm text-ink">{place.note}</p>}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
        <ReactionButtons placeIds={ids} myReaction={myReaction} />
        {deletable && (
          <DeletePlaceButton placeId={place.id} placeName={place.name} />
        )}
      </div>

      <CommentThread placeIds={ids} comments={place.comments} />
    </li>
  );
}
