"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReaction } from "@/lib/actions/reactions";
import { inferCategory, CATEGORY_EMOJI } from "@/lib/placeCategory";
import type { MergedPlace } from "@/lib/overlap";

export default function SwipeQueue({
  places,
  currentUserId,
  onCurrentChange,
}: {
  places: MergedPlace[];
  currentUserId: string;
  // Lets a surrounding view (ComparisonView) keep its map centered on the
  // card being swiped.
  onCurrentChange?: (placeId: string | null) => void;
}) {
  const queue = useMemo(
    () => places.filter((p) => !p.reactions.some((r) => r.user_id === currentUserId)),
    [places, currentUserId]
  );
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const current = queue[index];
  const currentId = current?.id ?? null;

  useEffect(() => {
    onCurrentChange?.(currentId);
  }, [currentId, onCurrentChange]);

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
      <p className="text-sm text-muted">
        You&apos;re all caught up — no new places to react to right now.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center rounded-3xl bg-card p-8 text-center shadow-card ring-1 ring-line/70">
      <span
        aria-hidden
        className="grid h-20 w-20 place-items-center rounded-2xl bg-surface text-4xl"
      >
        {CATEGORY_EMOJI[inferCategory(current)]}
      </span>

      <p className="mt-5 text-xl font-semibold text-ink">{current.name}</p>
      {current.address && (
        <p className="mt-1 text-sm text-muted">{current.address}</p>
      )}
      {current.category && (
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted">
          {current.category}
        </p>
      )}
      {current.note && <p className="mt-3 text-sm text-ink">{current.note}</p>}
      {current.inA && current.inB && (
        <span className="mt-3 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          On both lists
        </span>
      )}

      <div className="mt-7 flex w-full justify-center gap-3">
        <button
          onClick={() => react("not_interested")}
          disabled={isPending}
          className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-surface disabled:opacity-50"
        >
          Not interested
        </button>
        <button
          onClick={() => react("want_to_go")}
          disabled={isPending}
          className="flex-1 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-pressed disabled:opacity-50"
        >
          ♥ Want to go
        </button>
      </div>

      <p className="mt-5 text-xs text-muted">
        {index + 1} of {queue.length}
      </p>
    </div>
  );
}
