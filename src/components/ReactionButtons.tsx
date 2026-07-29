"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReaction, clearReaction } from "@/lib/actions/reactions";
import type { ReactionType } from "@/lib/types";

// "Want to go" is the save action, so it gets the heart and the one hit of
// brand red on the card - the same weighting Airbnb gives its wishlist.
const OPTIONS: { type: ReactionType; label: string; icon: string; brand?: boolean }[] = [
  { type: "want_to_go", label: "Want to go", icon: "♥", brand: true },
  { type: "been", label: "Been", icon: "✓" },
  { type: "not_interested", label: "Not interested", icon: "✕" },
];

export default function ReactionButtons({
  placeIds,
  myReaction,
}: {
  // Usually one id. When a place is merged across two compared lists, it's
  // every underlying row, so the reaction applies no matter which list's
  // copy someone looks at later - see src/lib/overlap.ts.
  placeIds: string[];
  myReaction: ReactionType | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(type: ReactionType) {
    startTransition(async () => {
      if (myReaction === type) {
        await Promise.all(placeIds.map((id) => clearReaction(id)));
      } else {
        await Promise.all(placeIds.map((id) => setReaction(id, type)));
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((opt) => {
        const active = myReaction === opt.type;
        return (
          <button
            key={opt.type}
            disabled={isPending}
            onClick={() => toggle(opt.type)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
              active
                ? opt.brand
                  ? "bg-brand text-white"
                  : "bg-ink text-background"
                : "text-ink ring-1 ring-line hover:bg-surface"
            }`}
          >
            <span
              className={
                active || !opt.brand ? "" : "text-brand"
              }
              aria-hidden
            >
              {opt.icon}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
