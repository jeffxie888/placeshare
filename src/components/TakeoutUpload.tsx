"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseTakeoutFile } from "@/lib/takeout";
import { bulkAddPlaces } from "@/lib/actions/places";

export default function TakeoutUpload({ listId }: { listId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const { places, skipped } = parseTakeoutFile(text);

    if (places.length === 0) {
      setMessage(
        "Couldn't find any places in that file. Make sure it's a Google Takeout Maps export (e.g. \"Saved Places.json\")."
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    startTransition(async () => {
      await bulkAddPlaces(listId, places);
      setMessage(
        `Imported ${places.length} place${places.length === 1 ? "" : "s"}` +
          (skipped ? ` (skipped ${skipped} unrecognized entries).` : ".")
      );
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div>
      <label className="block text-sm font-medium">
        Import from Google Takeout
      </label>
      <p className="mt-0.5 text-xs text-neutral-500">
        Google Takeout → Maps (your places) → Saved Places.json, or any
        individual list file.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        disabled={isPending}
        onChange={handleFile}
        className="mt-2 text-sm"
      />
      {isPending && <p className="mt-1 text-xs text-neutral-500">Importing…</p>}
      {message && <p className="mt-1 text-xs text-neutral-500">{message}</p>}
    </div>
  );
}
