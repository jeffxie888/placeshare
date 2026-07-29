export interface ParsedPlace {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export interface TakeoutParseResult {
  places: ParsedPlace[];
  skipped: number;
}

// Google Takeout's Maps export ("Saved Places.json", or one file per list
// like "Restaurants.json") is a GeoJSON FeatureCollection. The exact
// property names have shifted across Takeout versions, so this reads
// defensively rather than assuming one exact shape.
export function parseTakeoutFile(raw: string): TakeoutParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { places: [], skipped: 0 };
  }

  const features = extractFeatures(data);
  const places: ParsedPlace[] = [];
  let skipped = 0;

  for (const feature of features) {
    const parsed = parseFeature(feature);
    if (parsed) {
      places.push(parsed);
    } else {
      skipped++;
    }
  }

  return { places, skipped };
}

function extractFeatures(data: unknown): unknown[] {
  if (data && typeof data === "object" && "features" in data) {
    const features = (data as { features: unknown }).features;
    if (Array.isArray(features)) return features;
  }
  if (Array.isArray(data)) return data;
  return [];
}

function parseFeature(feature: unknown): ParsedPlace | null {
  if (!feature || typeof feature !== "object") return null;
  const f = feature as Record<string, unknown>;
  const properties = (f.properties ?? f) as Record<string, unknown>;

  const location = properties.location as Record<string, unknown> | undefined;
  const name =
    (location?.name as string | undefined) ??
    (properties.Title as string | undefined) ??
    (properties.name as string | undefined) ??
    (properties.title as string | undefined);

  if (!name) return null;

  const address =
    (location?.address as string | undefined) ??
    (properties.address as string | undefined) ??
    null;

  let lat: number | null = null;
  let lng: number | null = null;

  const geometry = f.geometry as Record<string, unknown> | undefined;
  const coordinates = geometry?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    lng = Number(coordinates[0]);
    lat = Number(coordinates[1]);
  } else if (
    typeof location?.latitude === "number" &&
    typeof location?.longitude === "number"
  ) {
    lat = location.latitude as number;
    lng = location.longitude as number;
  }

  if (lat !== null && (Number.isNaN(lat) || Number.isNaN(lng))) {
    lat = null;
    lng = null;
  }

  return { name, address, lat, lng };
}
