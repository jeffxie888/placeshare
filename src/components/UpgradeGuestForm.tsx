"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpgradeGuestForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    // Attaching an email to an anonymous user sends a confirmation link;
    // once clicked, Supabase flips is_anonymous to false and the account
    // (with all its lists/reactions/comments) becomes permanent.
    const { error } = await supabase.auth.updateUser(
      { email },
      {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    );
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-green-700 dark:text-green-500">
        Check your email to confirm and keep this account.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg border border-neutral-400 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-neutral-600"
      >
        Save
      </button>
      {status === "error" && (
        <span className="text-sm text-red-600">Failed, try again.</span>
      )}
    </form>
  );
}
