import { addPlace } from "@/lib/actions/places";

export default function PlaceForm({ listId }: { listId: string }) {
  const addPlaceForList = addPlace.bind(null, listId);

  return (
    <form action={addPlaceForList} className="grid grid-cols-2 gap-2">
      <input
        name="name"
        required
        placeholder="Place name"
        className="col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        name="address"
        placeholder="Address (optional, used to place it on the map)"
        className="col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        name="category"
        placeholder="Category (optional)"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        name="note"
        placeholder="Note (optional)"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button
        type="submit"
        className="col-span-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Add place
      </button>
    </form>
  );
}
