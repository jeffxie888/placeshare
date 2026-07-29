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
    <div className="mt-2 flex flex-col gap-1.5">
      {comments.map((c) => (
        <p key={c.id} className="text-sm text-neutral-600 dark:text-neutral-400">
          {c.body}
        </p>
      ))}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg border border-neutral-300 px-2.5 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="text-sm font-medium text-neutral-500 disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}
