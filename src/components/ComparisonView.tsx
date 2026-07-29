"use client";

import { useMemo, useState } from "react";
import MapView from "@/components/MapViewLoader";
import PlaceCard from "@/components/PlaceCard";
import SwipeQueue from "@/components/SwipeQueue";
import { mergeForComparison } from "@/lib/overlap";
import type { PlaceWithExtras, List } from "@/lib/types";

type Tab = "map" | "list" | "swipe";

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
  const [tab, setTab] = useState<Tab>("map");
  const merged = useMemo(() => mergeForComparison(placesA, placesB), [placesA, placesB]);

  const both = merged.filter((p) => p.inA && p.inB);
  const onlyA = merged.filter((p) => p.inA && !p.inB);
  const onlyB = merged.filter((p) => !p.inA && p.inB);

  return (
    <div>
      <div className="flex gap-1 rounded-full border border-neutral-200 p-1 text-sm dark:border-neutral-800">
        {(
          [
            ["map", "Map"],
            ["list", "List"],
            ["swipe", "Swipe"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
              tab === value
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "map" && (
          <div className="h-96">
            <MapView
              layers={[
                { label: "On both lists", color: "#a855f7", places: both },
                { label: listA.title, color: "#2563eb", places: onlyA },
                { label: listB.title, color: "#db2777", places: onlyB },
              ]}
            />
          </div>
        )}

        {tab === "list" && (
          <ul className="flex flex-col gap-3">
            {merged.map((place) => (
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
              />
            ))}
            {merged.length === 0 && (
              <p className="text-sm text-neutral-500">
                Neither list has any places yet.
              </p>
            )}
          </ul>
        )}

        {tab === "swipe" && (
          <SwipeQueue places={merged} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}
