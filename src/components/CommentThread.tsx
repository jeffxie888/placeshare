"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/lib/actions/reactions";
import type { Comment } from "@/lib/types";

export default function CommentThread({
  placeIds,
  comments,
}: {
  // Usually one id; every underlying row for a place merged across two
  // compared lists - see ReactionButtons and src/lib/overlap.ts.
  placeIds: string[];
  comments: Comment[];
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body;
    setBody("");
    startTransition(async () => {
      await Promise.all(placeIds.map((id) => addComment(id, text)));
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {comments.map((c) => (
        <p key={c.id} className="rounded-xl bg-surface px-3 py-2 text-sm text-ink">
          {c.body}
        </p>
      ))}
      <form onSubmit={submit} className="flex items-center gap-1">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-full bg-transparent px-3.5 py-2 text-sm text-ink ring-1 ring-line transition placeholder:text-muted focus:ring-ink"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="rounded-full px-3 py-2 text-sm font-semibold text-brand transition disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </div>
  );
}
