"use client";

import { useMemo, useState, type ReactNode } from "react";
import PlaceCard from "@/components/PlaceCard";
import SelectionToolbar from "@/components/SelectionToolbar";
import SplitMapLayout from "@/components/SplitMapLayout";
import { usePlaceSelection } from "@/lib/usePlaceSelection";
import type { PlaceWithExtras } from "@/lib/types";

// A list's own places in the same map-beside-panel frame the comparison
// view uses - click a card and the map goes there, tick several and it
// frames them all. The single-list counterpart to ComparisonView, minus the
// two-list machinery (no group filters, no swipe queue, no merged rows) and
// plus per-place deletion, which only makes sense where a card is exactly
// one row on one list.
export default function ListExplorer({
  places,
  listTitle,
  currentUserId,
  beforeList,
}: {
  places: PlaceWithExtras[];
  listTitle: string;
  currentUserId: string;
  // Rendered at the top of the panel column - the add-a-place form lives
  // here rather than full-width above, which would push the map below the
  // fold on first load.
  beforeList?: ReactNode;
}) {
  const { selectedIds, toggle, selectAll, clear } = usePlaceSelection();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const layers = useMemo(
    () => [{ label: listTitle, color: "#ff385c", places }],
    [listTitle, places]
  );

  return (
    <SplitMapLayout
      panelLabel="List"
      layers={layers}
      selectedIds={selectedIds}
      hoveredId={hoveredId}
      onSelectPlace={toggle}
      onHoverPlace={setHoveredId}
      panel={
        <div className="flex flex-col gap-4">
          {beforeList}

          {places.length === 0 ? (
            <p className="text-sm text-muted">
              No places yet. Add one manually or upload a Google Takeout
              export above.
            </p>
          ) : (
            <>
              <SelectionToolbar
                total={places.length}
                selectedCount={selectedIds.length}
                allSelected={selectedIds.length === places.length}
                onSelectAll={() => selectAll(places.map((p) => p.id))}
                onClear={clear}
              />

              <ul className="flex flex-col gap-3">
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    currentUserId={currentUserId}
                    selected={selectedIds.includes(place.id)}
                    onSelect={() => selectAll([place.id])}
                    onToggleSelected={() => toggle(place.id)}
                    onHover={setHoveredId}
                    deletable
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      }
    />
  );
}
