// Free, key-free geocoding via OpenStreetMap's Nominatim, used so manually
// entered places can still show up on the map without requiring a Google
// Places API key (which needs a billing account - see README "Adding Google
// Places API later"). Nominatim's usage policy caps this at ~1 request/sec
// and requires an identifying User-Agent, both fine for this app's scale.
export async function geocodeAddress(
  query: string
): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url, {
      headers: { "User-Agent": "Placeshare/0.1 (personal project)" },
    });
    if (!res.ok) return null;

    const results: Array<{ lat: string; lon: string }> = await res.json();
    if (!results.length) return null;

    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}
