"use client";

import { useState, type ReactNode } from "react";
import MapView from "@/components/MapViewLoader";
import type { MapLayer } from "@/components/MapView";

// Which half a small screen is showing. The two sit side by side from `lg`
// up; below that there isn't room for both at a usable size.
type MobilePane = "panel" | "map";

// The persistent map-beside-panel frame both place views are built on: the
// map never goes away, and whatever the panel has selected is what the map
// is pointed at. Owns only the layout and the mobile pane switch - selection
// state lives with the panel that renders the cards.
export default function SplitMapLayout({
  panel,
  panelLabel,
  controls,
  header,
  layers,
  selectedIds,
  hoveredId = null,
  onSelectPlace,
  onHoverPlace,
}: {
  panel: ReactNode;
  // Names the panel half in the mobile switch ("List", "Swipe").
  panelLabel: string;
  // Sits above the split, inline at the top; `header` spans the full width
  // beneath it.
  controls?: ReactNode;
  header?: ReactNode;
  layers: MapLayer[];
  selectedIds: string[];
  hoveredId?: string | null;
  onSelectPlace: (placeId: string) => void;
  onHoverPlace?: (placeId: string | null) => void;
}) {
  const [mobilePane, setMobilePane] = useState<MobilePane>("panel");
  const showingMap = mobilePane === "map";

  return (
    <div className="flex flex-col gap-4">
      {controls}
      {header}

      {/* Grid items stretch by default, which is load-bearing here: it makes
          the map's column as tall as the list beside it, giving the sticky
          map somewhere to stay put while the list scrolls past it. */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className={showingMap ? "hidden lg:block" : ""}>{panel}</div>

        <div className={showingMap ? "" : "hidden lg:block"}>
          <div className="h-[65vh] lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
            {/* invalidateKey is the pane alone, not the panel mode:
                switching List/Swipe doesn't resize the map, and refitting it
                there would throw away wherever the user had panned to. */}
            <MapView
              layers={layers}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              onSelectPlace={onSelectPlace}
              onHoverPlace={onHoverPlace}
              invalidateKey={mobilePane}
            />
          </div>
        </div>
      </div>

      {/* Airbnb's floating map switch: one pill, centred over the content,
          always within thumb reach - rather than a control stranded at the
          top of a page you've scrolled far down. */}
      <button
        onClick={() => setMobilePane(showingMap ? "panel" : "map")}
        className="fixed bottom-6 left-1/2 z-1000 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-background shadow-lift transition hover:scale-[1.03] lg:hidden"
      >
        {showingMap ? panelLabel : "Map"}
        <span aria-hidden>{showingMap ? "☰" : "🗺"}</span>
      </button>
    </div>
  );
}
