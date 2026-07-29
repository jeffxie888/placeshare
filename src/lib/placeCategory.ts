export type PlaceCategory = "cafe" | "bar" | "bakery" | "hotel" | "restaurant";

export const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  cafe: "☕",
  bar: "🍸",
  bakery: "🍰",
  hotel: "🏨",
  restaurant: "🍽️",
};

// Checked before the generic "bar" keyword below, since "sushi bar",
// "noodle bar" etc. are restaurant naming conventions, not actual bars.
const FOOD_NAME_OVERRIDES = [
  "sushi bar",
  "noodle bar",
  "raw bar",
  "oyster bar",
  "ramen bar",
  "salad bar",
];

const RULES: { category: PlaceCategory; keywords: string[] }[] = [
  { category: "cafe", keywords: ["coffee", "cafe", "café", "espresso", "roaster"] },
  {
    category: "bakery",
    keywords: ["bakery", "patisserie", "ice cream", "gelato", "dessert", "donut", "doughnut"],
  },
  { category: "hotel", keywords: ["hotel", "inn", "resort"] },
  { category: "bar", keywords: ["bar", "pub", "tavern", "brewery", "taproom", "cocktail"] },
];

// Google Takeout doesn't export a place type, and Google Places API (which
// would give a real one) is deliberately deferred - see README. This is a
// best-effort, purely presentational guess from the name/category text, not
// persisted anywhere, so a wrong guess never gets "stuck" in the data.
export function inferCategory(place: { category?: string | null; name: string }): PlaceCategory {
  const category = place.category?.toLowerCase().trim();
  const name = place.name.toLowerCase();

  if (category) {
    for (const rule of RULES) {
      if (rule.keywords.some((k) => category.includes(k))) return rule.category;
    }
  }

  if (FOOD_NAME_OVERRIDES.some((phrase) => name.includes(phrase))) return "restaurant";

  for (const rule of RULES) {
    if (rule.keywords.some((k) => name.includes(k))) return rule.category;
  }

  return "restaurant";
}
