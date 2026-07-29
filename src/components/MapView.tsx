"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

function makeIcon(color: string, emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      width:28px;height:28px;border-radius:9999px;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;line-height:1;
      border:2px solid white;
      box-shadow:0 1px 3px rgba(0,0,0,0.4);
    ">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Renders one or more "layers" of places as colored, category-emoji pins on
// a shared map - a single layer for a list's own page, multiple layers (by
// list, plus an "on both lists" layer) when comparing. Color says which
// list(s) a place is on; the emoji (cafe/bar/bakery/hotel/restaurant, see
// src/lib/placeCategory.ts) says what kind of place it is.
export default function MapView({ layers }: { layers: MapLayer[] }) {
  const points = useMemo(
    () =>
      layers.flatMap((layer) =>
        layer.places
          .filter((p) => p.lat !== null && p.lng !== null)
          .map((p) => ({ place: p, layer }))
      ),
    [layers]
  );

  const icons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    for (const { place, layer } of points) {
      const category = inferCategory(place);
      const key = `${layer.color}:${category}`;
      if (!cache.has(key)) {
        cache.set(key, makeIcon(layer.color, CATEGORY_EMOJI[category]));
      }
    }
    return cache;
  }, [points]);

  // Fits the view to however tightly or widely spread the places are,
  // rather than a fixed zoom level that's wrong for most real data (too far
  // out for a single neighborhood, too close for a whole country).
  const bounds: LatLngBoundsExpression | undefined = points.length
    ? points.map((p) => [p.place.lat as number, p.place.lng as number])
    : undefined;

  return (
    <div className="h-full w-full overflow-hidden rounded-lg">
      <MapContainer
        {...(bounds
          ? { bounds, boundsOptions: { padding: [32, 32], maxZoom: 15 } }
          : { center: [20, 0] as [number, number], zoom: 2 })}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(({ place, layer }) => {
          const category = inferCategory(place);
          const icon = icons.get(`${layer.color}:${category}`)!;
          return (
            <Marker
              key={place.id}
              position={[place.lat as number, place.lng as number]}
              icon={icon}
            >
              <Popup>
                <strong>{place.name}</strong>
                <br />
                {place.address}
                <br />
                <span style={{ color: layer.color }}>{layer.label}</span>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {layers.some((l) => l.places.some((p) => p.lat === null)) && (
        <p className="mt-2 text-xs text-neutral-500">
          Some places don&apos;t have a location yet and aren&apos;t shown on
          the map.
        </p>
      )}
    </div>
  );
}
