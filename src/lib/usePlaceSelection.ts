"use client";

import { useCallback, useEffect, useState } from "react";

// The selection shared between a panel of place cards and the map beside it
// (see SplitMapLayout). Clicking a card replaces the selection; the
// checkboxes and "Select all" build it up. The map frames whatever is in it.
export function usePlaceSelection({
  scrollIntoView = true,
}: {
  // Off for panels that don't render cards to scroll to, like the swipe queue.
  scrollIntoView?: boolean;
} = {}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // The map-to-panel half of the sync: picking a pin scrolls its card into
  // view. Only for a single selection - scrolling on every tick of "Select
  // all" would fight the user. `nearest` so an already-visible card doesn't
  // jump.
  useEffect(() => {
    if (!scrollIntoView || selectedIds.length !== 1) return;
    document
      .getElementById(`place-${selectedIds[0]}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedIds, scrollIntoView]);

  const selectOne = useCallback((placeId: string | null) => {
    setSelectedIds(placeId ? [placeId] : []);
  }, []);

  const toggle = useCallback((placeId: string) => {
    setSelectedIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => setSelectedIds(ids), []);
  const clear = useCallback(() => setSelectedIds([]), []);

  return { selectedIds, selectOne, toggle, selectAll, clear };
}
