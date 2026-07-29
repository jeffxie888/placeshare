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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Your lists
        </h1>
        <form action={signOut}>
          <button className="rounded-full px-4 py-2 text-sm font-semibold text-ink underline decoration-line underline-offset-4 transition hover:bg-surface hover:no-underline">
            Sign out
          </button>
        </form>
      </div>

      {profile?.is_guest && (
        <div className="mt-6 rounded-2xl bg-surface p-5 text-sm">
          <p className="mb-3 text-ink">
            You&apos;re browsing as a guest. Your lists only exist in this
            browser — add an email to keep them permanently.
          </p>
          <UpgradeGuestForm />
        </div>
      )}

      <form action={createList} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          name="title"
          required
          placeholder="New list name (e.g. Tokyo trip)"
          className="flex-1 rounded-full bg-transparent px-5 py-3 text-sm text-ink ring-1 ring-line outline-none transition placeholder:text-muted focus:ring-2 focus:ring-ink"
        />
        <button
          type="submit"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-pressed"
        >
          Create
        </button>
      </form>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {lists?.map((list) => (
          <li key={list.id}>
            <Link
              href={`/lists/${list.id}`}
              className="block rounded-2xl bg-card p-5 font-semibold text-ink shadow-card ring-1 ring-line/70 transition hover:shadow-lift"
            >
              {list.title}
            </Link>
          </li>
        ))}
        {lists?.length === 0 && (
          <p className="text-sm text-muted">
            No lists yet — create one above, or open a share link a friend
            sent you.
          </p>
        )}
      </ul>
    </main>
  );
}
