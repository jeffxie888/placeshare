import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createList } from "@/lib/actions/lists";
import { signOut } from "@/lib/actions/auth";
import UpgradeGuestForm from "@/components/UpgradeGuestForm";

export default async function ListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: lists }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lists").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your lists</h1>
        <form action={signOut}>
          <button className="text-sm text-neutral-500 hover:underline">
            Sign out
          </button>
        </form>
      </div>

      {profile?.is_guest && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
          <p className="mb-2">
            You&apos;re browsing as a guest. Your lists only exist in this
            browser — add an email to keep them permanently.
          </p>
          <UpgradeGuestForm />
        </div>
      )}

      <form action={createList} className="mt-6 flex gap-2">
        <input
          name="title"
          required
          placeholder="New list name (e.g. Tokyo trip)"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Create
        </button>
      </form>

      <ul className="mt-8 flex flex-col gap-2">
        {lists?.map((list) => (
          <li key={list.id}>
            <Link
              href={`/lists/${list.id}`}
              className="block rounded-lg border border-neutral-200 px-4 py-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              {list.title}
            </Link>
          </li>
        ))}
        {lists?.length === 0 && (
          <p className="text-sm text-neutral-500">
            No lists yet — create one above, or open a share link a friend
            sent you.
          </p>
        )}
      </ul>
    </main>
  );
}
