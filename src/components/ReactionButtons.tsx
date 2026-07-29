"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReaction, clearReaction } from "@/lib/actions/reactions";
import type { ReactionType } from "@/lib/types";

const OPTIONS: { type: ReactionType; label: string; emoji: string }[] = [
  { type: "want_to_go", label: "Want to go", emoji: "⭐" },
  { type: "been", label: "Been", emoji: "✅" },
  { type: "not_interested", label: "Not interested", emoji: "🚫" },
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
    <div className="flex gap-1.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.type}
          disabled={isPending}
          onClick={() => toggle(opt.type)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            myReaction === opt.type
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
              : "border-neutral-300 dark:border-neutral-700"
          }`}
          title={opt.label}
        >
          {opt.emoji} {opt.label}
        </button>
      ))}
    </div>
  );
}
