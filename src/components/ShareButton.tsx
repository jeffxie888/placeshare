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
      className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium dark:border-neutral-700"
    >
      {copied ? "Link copied!" : "Share list"}
    </button>
  );
}
