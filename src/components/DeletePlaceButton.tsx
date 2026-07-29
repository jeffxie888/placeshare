"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlace } from "@/lib/actions/places";

export default function DeletePlaceButton({
  placeId,
  placeName,
}: {
  placeId: string;
  placeName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function remove() {
    // Deleting takes the place's reactions and comments with it and there's
    // no undo, so it asks first.
    if (!confirm(`Delete "${placeName}" from this list?`)) return;

    startTransition(async () => {
      await deletePlace(placeId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={remove}
      disabled={isPending}
      title={`Delete ${placeName}`}
      className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted underline decoration-line underline-offset-4 transition hover:bg-surface hover:text-brand hover:no-underline disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
