"use client";

import { useState } from "react";

export default function ShareButton({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/join/${encodeURIComponent(shareToken)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-ink underline decoration-line underline-offset-4 transition hover:bg-surface hover:no-underline"
    >
      {copied ? "Link copied!" : "Share list"}
    </button>
  );
}
