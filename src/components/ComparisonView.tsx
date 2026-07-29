"use client";

import { useMemo, useState } from "react";
import PlaceCard from "@/components/PlaceCard";
import SelectionToolbar from "@/components/SelectionToolbar";
import SplitMapLayout from "@/components/SplitMapLayout";
import SwipeQueue from "@/components/SwipeQueue";
import { mergeForComparison, type MergedPlace } from "@/lib/overlap";
import { usePlaceSelection } from "@/lib/usePlaceSelection";
import type { PlaceWithExtras, List } from "@/lib/types";

// What the panel beside the map is showing. The map itself is never a mode -
// it stays on screen alongside whichever of these is active, so a place
// clicked in one half is always the place focused in the other.
type PanelMode = "list" | "swipe";

type Group = "both" | "a" | "b";

// Reserved for the overlap, since "on both lists" is the answer the whole
// screen exists to surface; the two single-list groups take quieter hues.
const GROUP_COLOR: Record<Group, string> = {
  both: "#ff385c",
  a: "#0b7f9e",
  b: "#8b6bd9",
};

function groupOf(place: MergedPlace): Group {
  if (place.inA && place.inB) return "both";
  return place.inA ? "a" : "b";
}

export default function ComparisonView({
  listA,
  listB,
  placesA,
  placesB,
  currentUserId,
}: {
  listA: List;
  listB: List;
  placesA: PlaceWithExtras[];
  placesB: PlaceWithExtras[];
  currentUserId: string;
}) {
  const [panelMode, setPanelMode] = useState<PanelMode>("list");
  const [hiddenGroups, setHiddenGroups] = useState<Group[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { selectedIds, selectOne, toggle, selectAll, clear } = usePlaceSelection({
    scrollIntoView: panelMode === "list",
  });

  const merged = useMemo(
    () => mergeForComparison(placesA, placesB),
    [placesA, placesB]
  );

  // One filtered dataset feeds the map, the list and the swipe queue, so
  // hiding a group can't leave the halves showing different places.
  const visible = useMemo(
    () => merged.filter((p) => !hiddenGroups.includes(groupOf(p))),
    [merged, hiddenGroups]
  );

  // Counted against the visible set rather than selectedIds directly, so a
  // selected place that a group filter has since hidden isn't claimed in the
  // count or left blocking "Select all".
  const selectedVisibleCount = useMemo(
    () => visible.filter((p) => selectedIds.includes(p.id)).length,
    [visible, selectedIds]
  );

  const layers = useMemo(() => {
    const inGroup = (g: Group) => visible.filter((p) => groupOf(p) === g);
    return [
      { label: "On both lists", color: GROUP_COLOR.both, places: inGroup("both") },
      { label: listA.title, color: GROUP_COLOR.a, places: inGroup("a") },
      { label: listB.title, color: GROUP_COLOR.b, places: inGroup("b") },
    ];
  }, [visible, listA.title, listB.title]);

  const legend: { group: Group; label: string; count: number }[] = [
    {
      group: "both",
      label: "On both lists",
      count: merged.filter((p) => groupOf(p) === "both").length,
    },
    {
      group: "a",
      label: listA.title,
      count: merged.filter((p) => groupOf(p) === "a").length,
    },
    {
      group: "b",
      label: listB.title,
      count: merged.filter((p) => groupOf(p) === "b").length,
    },
  ];

  function toggleGroup(group: Group) {
    setHiddenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  }

  // Airbnb's segmented control: a single pill track with the active segment
  // filled, rather than two competing buttons.
  const modeToggle = (
    <div className="flex w-fit gap-1 rounded-full bg-surface p-1 text-sm">
      {(
        [
          ["list", "List"],
          ["swipe", "Swipe"],
        ] as [PanelMode, string][]
      ).map(([value, label]) => (
        <button
          key={value}
          onClick={() => setPanelMode(value)}
          className={`rounded-full px-4 py-1.5 font-semibold transition ${
            panelMode === value
              ? "bg-card text-ink shadow-card"
              : "text-muted hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  // Reads as Airbnb's category strip: a scannable row of filter pills that
  // dim rather than vanish when switched off, so the counts stay legible.
  const legendFilters = (
    <div className="flex flex-wrap gap-2">
      {legend.map(({ group, label, count }) => {
        const off = hiddenGroups.includes(group);
        return (
          <button
            key={group}
            onClick={() => toggleGroup(group)}
            title={off ? `Show ${label}` : `Hide ${label}`}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              off
                ? "text-muted ring-1 ring-line/60 hover:bg-surface"
                : "bg-card text-ink shadow-card ring-1 ring-line/70"
            }`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: GROUP_COLOR[group], opacity: off ? 0.3 : 1 }}
            />
            <span className={off ? "line-through" : ""}>{label}</span>
            <span className="text-muted">{count}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <SplitMapLayout
      panelLabel={panelMode === "swipe" ? "Swipe" : "List"}
      controls={modeToggle}
      header={legendFilters}
      layers={layers}
      selectedIds={selectedIds}
      hoveredId={hoveredId}
      onSelectPlace={toggle}
      onHoverPlace={setHoveredId}
      panel={
        panelMode === "list" ? (
          <div className="flex flex-col gap-4">
            <SelectionToolbar
              total={visible.length}
              selectedCount={selectedVisibleCount}
              allSelected={
                visible.length > 0 && selectedVisibleCount === visible.length
              }
              onSelectAll={() => selectAll(visible.map((p) => p.id))}
              onClear={clear}
            />

            <ul className="flex flex-col gap-3">
              {visible.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  placeIds={place.placeIds}
                  currentUserId={currentUserId}
                  badge={
                    place.inA && place.inB
                      ? "On both lists"
                      : place.inA
                        ? listA.title
                        : listB.title
                  }
                  selected={selectedIds.includes(place.id)}
                  onSelect={() => selectAll([place.id])}
                  onToggleSelected={() => toggle(place.id)}
                  onHover={setHoveredId}
                />
              ))}
              {visible.length === 0 && (
                <p className="text-sm text-muted">
                  {merged.length === 0
                    ? "Neither list has any places yet."
                    : "No places match the filters above."}
                </p>
              )}
            </ul>
          </div>
        ) : (
          <SwipeQueue
            places={visible}
            currentUserId={currentUserId}
            onCurrentChange={selectOne}
          />
        )
      }
    />
  );
}
