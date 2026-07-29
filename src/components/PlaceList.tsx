import PlaceCard from "@/components/PlaceCard";
import type { PlaceWithExtras } from "@/lib/types";

export default function PlaceList({
  places,
  currentUserId,
}: {
  places: PlaceWithExtras[];
  currentUserId: string;
}) {
  if (places.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No places yet. Add one manually or upload a Google Takeout export
        above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} currentUserId={currentUserId} />
      ))}
    </ul>
  );
}
