import { addPlace } from "@/lib/actions/places";

// Airbnb stacks its form fields into one bordered group so a multi-field
// form reads as a single object rather than a pile of separate inputs.
const field =
  "w-full bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-muted";

export default function PlaceForm({ listId }: { listId: string }) {
  const addPlaceForList = addPlace.bind(null, listId);

  return (
    <form action={addPlaceForList} className="flex flex-col gap-3">
      <div className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line focus-within:ring-2 focus-within:ring-ink">
        <input name="name" required placeholder="Place name" className={field} />
        <input
          name="address"
          placeholder="Address — used to put it on the map"
          className={field}
        />
        <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <input name="category" placeholder="Category (optional)" className={field} />
          <input name="note" placeholder="Note (optional)" className={field} />
        </div>
      </div>
      <button
        type="submit"
        className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-pressed"
      >
        Add place
      </button>
    </form>
  );
}
