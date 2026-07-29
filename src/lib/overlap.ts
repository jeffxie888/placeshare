import type { PlaceWithExtras } from "@/lib/types";

function normalize(name: string) {
  return name.trim().toLowerCase();
}

export interface MergedPlace {
  id: string;
  placeIds: string[];
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
  note: string | null;
  reactions: PlaceWithExtras["reactions"];
  comments: PlaceWithExtras["comments"];
  inA: boolean;
  inB: boolean;
}

// Merges two lists' places into one comparison view, collapsing places that
// appear on both (by name match - no fuzzy geo-matching, good enough for an
// MVP) into a single entry instead of showing the same restaurant twice.
// Each list stores its own row for a place it saved independently, so a
// merged entry's `placeIds` carries every underlying row - reacting to or
// commenting on a merged place should apply to all of them, so the reaction
// is visible no matter which list's copy someone looks at later.
export function mergeForComparison(
  placesA: PlaceWithExtras[],
  placesB: PlaceWithExtras[]
): MergedPlace[] {
  const usedB = new Set<string>();
  const merged: MergedPlace[] = [];

  for (const a of placesA) {
    const match = placesB.find(
      (b) => !usedB.has(b.id) && normalize(b.name) === normalize(a.name)
    );

    if (match) {
      usedB.add(match.id);
      merged.push({
        id: a.id,
        placeIds: [a.id, match.id],
        name: a.name,
        address: a.address ?? match.address,
        lat: a.lat ?? match.lat,
        lng: a.lng ?? match.lng,
        category: a.category ?? match.category,
        note: a.note ?? match.note,
        reactions: [...a.reactions, ...match.reactions],
        comments: [...a.comments, ...match.comments],
        inA: true,
        inB: true,
      });
    } else {
      merged.push({
        id: a.id,
        placeIds: [a.id],
        name: a.name,
        address: a.address,
        lat: a.lat,
        lng: a.lng,
        category: a.category,
        note: a.note,
        reactions: a.reactions,
        comments: a.comments,
        inA: true,
        inB: false,
      });
    }
  }

  for (const b of placesB) {
    if (usedB.has(b.id)) continue;
    merged.push({
      id: b.id,
      placeIds: [b.id],
      name: b.name,
      address: b.address,
      lat: b.lat,
      lng: b.lng,
      category: b.category,
      note: b.note,
      reactions: b.reactions,
      comments: b.comments,
      inA: false,
      inB: true,
    });
  }

  return merged;
}
