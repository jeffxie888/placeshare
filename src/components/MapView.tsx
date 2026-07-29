"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { inferCategory, CATEGORY_EMOJI } from "@/lib/placeCategory";

// Structurally compatible with both a Place row and a MergedPlace (a place
// combined across two compared lists) - see src/lib/overlap.ts.
export interface MapPlace {
  id: string;
  name: string;
  address: string | null;
  category?: string | null;
  lat: number | null;
  lng: number | null;
}

export interface MapLayer {
  label: string;
  color: string;
  places: MapPlace[];
}

interface MapPoint {
  place: MapPlace;
  layer: MapLayer;
}

// Module-level so the array defaults are stable references - a fresh [] on
// every render would retrigger FocusSelection's effect endlessly.
const EMPTY_SELECTION: string[] = [];

// "dimmed" is what an unselected pin becomes once something is selected -
// without it a selection of 3 out of 40 pins is invisible at city zoom.
type PinState = "normal" | "selected" | "hovered" | "dimmed";

// Airbnb labels its map with content, not symbols: a legible pill you can
// read at a glance rather than a dot you have to click to identify. The
// coloured dot inside carries which list the place came from, so the pill
// itself can stay neutral white and invert to a solid fill when it's the
// one you're looking at.
function pinStyle(state: PinState) {
  switch (state) {
    case "selected":
      return "background:var(--brand);color:#ffffff;transform:scale(1.06);z-index:3;";
    case "hovered":
      return "background:var(--ink);color:var(--background);transform:scale(1.06);z-index:2;";
    case "dimmed":
      // Only lightly knocked back. A white pill on a pale map loses all
      // contrast well before it looks "dimmed", and the selected pin is
      // already unmistakable in solid brand red - it doesn't need the rest
      // of the map to become unreadable to stand out.
      return "background:var(--pin);color:var(--muted);opacity:0.82;";
    default:
      return "background:var(--pin);color:var(--pin-ink);";
  }
}

// Pills size to their label, so an icon can't be shared across places the
// way a fixed dot could. Cached per place-and-state at module scope, which
// keeps each icon's identity stable across renders - rebuilding them inside
// the component would hand every marker a new icon on each hover and make
// react-leaflet tear down and recreate all of their DOM nodes.
const pillCache = new Map<string, L.DivIcon>();

function pillFor(point: MapPoint, state: PinState) {
  const { place, layer } = point;
  const key = `${place.id}:${layer.color}:${state}`;
  let icon = pillCache.get(key);
  if (!icon) {
    icon = makePill(
      layer.color,
      CATEGORY_EMOJI[inferCategory(place)],
      place.name,
      state
    );
    pillCache.set(key, icon);
  }
  return icon;
}

function makePill(color: string, emoji: string, name: string, state: PinState) {
  const solid = state === "selected" || state === "hovered";
  return L.divIcon({
    className: "",
    // iconSize [0,0] + a centering transform lets the pill size itself to
    // the name instead of being boxed into fixed pixel dimensions.
    html: `<div style="
      position:absolute;
      transform-origin:center;
      transform:translate(-50%,-50%);
      display:flex;align-items:center;gap:5px;
      padding:5px 10px;
      border-radius:9999px;
      font-family:var(--font-geist-sans),system-ui,sans-serif;
      font-size:12px;font-weight:600;line-height:1.25;
      white-space:nowrap;
      box-shadow:var(--shadow-pill);
      border:1px solid rgba(0,0,0,0.08);
      transition:transform 120ms ease;
      ${pinStyle(state)}
    ">
      <span style="
        width:7px;height:7px;border-radius:9999px;flex:none;
        background:${color};
        ${solid ? "box-shadow:0 0 0 1.5px rgba(255,255,255,0.9);" : ""}
      "></span>
      <span>${emoji}</span>
      <span style="max-width:150px;overflow:hidden;text-overflow:ellipsis;">${name}</span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// Recenters on whatever the surrounding view has selected (clicked list
// cards, or the current swipe card) so the two halves never drift apart.
function FocusSelection({
  points,
  selectedIds,
}: {
  points: MapPoint[];
  selectedIds: string[];
}) {
  const map = useMap();

  useEffect(() => {
    const selected = points.filter((p) => selectedIds.includes(p.place.id));
    if (selected.length === 0) return;

    // One place zooms in on it, but never zooms back out - yanking the
    // user's chosen zoom around on every click is more disorienting than
    // leaving it alone. Several places frame all of them instead, which is
    // the whole point of selecting more than one.
    if (selected.length === 1) {
      const [{ place }] = selected;
      map.flyTo(
        [place.lat as number, place.lng as number],
        Math.max(map.getZoom(), 14),
        { duration: 0.6 }
      );
      return;
    }

    map.flyToBounds(
      selected.map((p) => [p.place.lat as number, p.place.lng as number]),
      { padding: [56, 56], maxZoom: 15, duration: 0.6 }
    );
  }, [map, points, selectedIds]);

  return null;
}

// Leaflet measures its container once, on mount. On a phone the map mounts
// inside a `hidden` div, so it measures zero and its opening bounds fit is
// meaningless - the first toggle to the map then showed an arbitrary corner
// of the city with no pins in frame. Re-measure and refit together, unless
// there's a selection, which FocusSelection is already framing.
function RefitOn({
  trigger,
  bounds,
  hasSelection,
}: {
  trigger: string | number;
  bounds: LatLngBoundsExpression | undefined;
  hasSelection: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (!hasSelection && bounds) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }
  }, [map, trigger, bounds, hasSelection]);

  return null;
}

export default function MapView({
  layers,
  selectedIds = EMPTY_SELECTION,
  hoveredId = null,
  onSelectPlace,
  onHoverPlace,
  invalidateKey,
}: {
  layers: MapLayer[];
  // The selected places, filled brand red while everything else dims.
  selectedIds?: string[];
  // Whatever card the pointer is over, filled ink - the hover pairing
  // Airbnb's search map does in both directions.
  hoveredId?: string | null;
  onSelectPlace?: (placeId: string) => void;
  onHoverPlace?: (placeId: string | null) => void;
  // Change this whenever the map's container is resized or revealed, so it
  // re-measures - see InvalidateSizeOn.
  invalidateKey?: string | number;
}) {
  const points = useMemo(
    () =>
      layers.flatMap((layer) =>
        layer.places
          .filter((p) => p.lat !== null && p.lng !== null)
          .map((p) => ({ place: p, layer }))
      ),
    [layers]
  );

  // Fits the view to however tightly or widely spread the places are,
  // rather than a fixed zoom level that's wrong for most real data (too far
  // out for a single neighborhood, too close for a whole country). Memoized
  // because RefitOn takes it as an effect dependency.
  const bounds: LatLngBoundsExpression | undefined = useMemo(
    () =>
      points.length
        ? points.map((p) => [p.place.lat as number, p.place.lng as number])
        : undefined,
    [points]
  );

  const hasPlacesWithoutLocation = layers.some((l) =>
    l.places.some((p) => p.lat === null)
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
        <MapContainer
          {...(bounds
            ? { bounds, boundsOptions: { padding: [48, 48], maxZoom: 15 } }
            : { center: [20, 0] as [number, number], zoom: 2 })}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Out of the top-left corner, where it would sit on top of the
              first row of pills. */}
          <ZoomControl position="bottomright" />
          <FocusSelection points={points} selectedIds={selectedIds} />
          {invalidateKey !== undefined && (
            <RefitOn
              trigger={invalidateKey}
              bounds={bounds}
              hasSelection={selectedIds.length > 0}
            />
          )}
          {points.map((point) => {
            const { place } = point;
            const selected = selectedIds.includes(place.id);
            const state: PinState = selected
              ? "selected"
              : place.id === hoveredId
                ? "hovered"
                : selectedIds.length > 0
                  ? "dimmed"
                  : "normal";
            return (
              <Marker
                key={place.id}
                position={[place.lat as number, place.lng as number]}
                icon={pillFor(point, state)}
                zIndexOffset={selected ? 1000 : state === "hovered" ? 500 : 0}
                eventHandlers={{
                  ...(onSelectPlace ? { click: () => onSelectPlace(place.id) } : {}),
                  ...(onHoverPlace
                    ? {
                        mouseover: () => onHoverPlace(place.id),
                        mouseout: () => onHoverPlace(null),
                      }
                    : {}),
                }}
              />
            );
          })}
        </MapContainer>
      </div>
      {hasPlacesWithoutLocation && (
        <p className="mt-2 shrink-0 text-xs text-muted">
          Some places don&apos;t have a location yet and aren&apos;t shown on
          the map.
        </p>
      )}
    </div>
  );
}
