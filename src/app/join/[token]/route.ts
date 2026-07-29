import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Visiting a share link (GET /join/:token) grants the current session -
// signing in anonymously first if there isn't one - membership on the
// target list, then redirects into it.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=join`);
    }
  }

  const { data: listId, error } = await supabase.rpc("join_list_by_token", {
    p_token: token,
  });

  if (error || !listId) {
    return NextResponse.redirect(`${origin}/lists?error=invalid-link`);
  }

  return NextResponse.redirect(`${origin}/lists/${listId}`);
}
