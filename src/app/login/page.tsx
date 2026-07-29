"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [guestLoading, setGuestLoading] = useState(false);

  async function continueAsGuest() {
    setGuestLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    setGuestLoading(false);
    if (error) {
      setStatus("error");
      return;
    }
    router.push("/lists");
    router.refresh();
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Placeshare</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Share your saved places, see what your friends love, and find your
          next spot.
        </p>
      </div>

      <button
        onClick={continueAsGuest}
        disabled={guestLoading}
        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {guestLoading ? "Starting…" : "Continue as guest"}
      </button>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
        or
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
      </div>

      <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
        >
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
        {status === "sent" && (
          <p className="text-sm text-green-600">
            Check your email for a sign-in link.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">
            Something went wrong. Try again.
          </p>
        )}
      </form>

      <p className="text-xs text-neutral-400">
        Guest lists live only in this browser session until you add an email
        from your list page to make them permanent.
      </p>
    </main>
  );
}
