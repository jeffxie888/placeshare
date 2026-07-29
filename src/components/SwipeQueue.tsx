"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReaction } from "@/lib/actions/reactions";
import type { MergedPlace } from "@/lib/overlap";

export default function SwipeQueue({
  places,
  currentUserId,
}: {
  places: MergedPlace[];
  currentUserId: string;
}) {
  const queue = useMemo(
    () => places.filter((p) => !p.reactions.some((r) => r.user_id === currentUserId)),
    [places, currentUserId]
  );
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const current = queue[index];

  function react(type: "want_to_go" | "not_interested") {
    if (!current) return;
    startTransition(async () => {
      await Promise.all(current.placeIds.map((id) => setReaction(id, type)));
      setIndex((i) => i + 1);
      router.refresh();
    });
  }

  if (!current) {
    return (
      <p className="text-sm text-neutral-500">
        You&apos;re all caught up — no new places to react to right now.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-neutral-200 p-6 text-center dark:border-neutral-800">
      <p className="text-lg font-semibold">{current.name}</p>
      {current.address && (
        <p className="mt-1 text-sm text-neutral-500">{current.address}</p>
      )}
      {current.category && (
        <p className="mt-1 text-xs uppercase tracking-wide text-neutral-400">
          {current.category}
        </p>
      )}
      {current.note && <p className="mt-2 text-sm">{current.note}</p>}
      {current.inA && current.inB && (
        <p className="mt-2 text-xs font-medium text-neutral-400">
          On both lists
        </p>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => react("not_interested")}
          disabled={isPending}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
        >
          🚫 Not interested
        </button>
        <button
          onClick={() => react("want_to_go")}
          disabled={isPending}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          ⭐ Want to go
        </button>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        {index + 1} of {queue.length}
      </p>
    </div>
  );
}
