import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("ok:", msg);
}

// Two independent clients = two independent guest sessions, simulating the
// list owner and a friend who joins via share link.
const owner = createClient(url, key);
const friend = createClient(url, key);

const { error: ownerAuthErr } = await owner.auth.signInAnonymously();
assert(!ownerAuthErr, "owner signs in anonymously");

const { error: friendAuthErr } = await friend.auth.signInAnonymously();
assert(!friendAuthErr, "friend signs in anonymously");

const { data: list, error: listErr } = await owner
  .from("lists")
  .insert({ owner_id: (await owner.auth.getUser()).data.user.id, title: "Tokyo trip" })
  .select("*")
  .single();
assert(!listErr && list, "owner creates a list: " + JSON.stringify(listErr));

const { data: place, error: placeErr } = await owner
  .from("places")
  .insert({ list_id: list.id, name: "Ichiran Ramen", source: "manual" })
  .select("*")
  .single();
assert(!placeErr && place, "owner adds a place: " + JSON.stringify(placeErr));

const { data: friendBlockedRead } = await friend
  .from("places")
  .select("*")
  .eq("list_id", list.id);
assert(
  (friendBlockedRead ?? []).length === 0,
  "friend cannot see places before joining (RLS blocks, got " +
    (friendBlockedRead ?? []).length +
    " rows)"
);

const { data: joinedListId, error: joinErr } = await friend.rpc(
  "join_list_by_token",
  { p_token: list.share_token }
);
assert(!joinErr && joinedListId === list.id, "friend joins via share token: " + JSON.stringify(joinErr));

const { data: friendReadAfterJoin, error: friendReadErr } = await friend
  .from("places")
  .select("*")
  .eq("list_id", list.id);
assert(
  !friendReadErr && friendReadAfterJoin.length === 1,
  "friend can now see the place after joining"
);

const { error: reactionErr } = await friend
  .from("reactions")
  .upsert({ place_id: place.id, user_id: (await friend.auth.getUser()).data.user.id, type: "want_to_go" });
assert(!reactionErr, "friend reacts to the place: " + JSON.stringify(reactionErr));

const { data: commentInsert, error: commentErr } = await friend
  .from("comments")
  .insert({ place_id: place.id, user_id: (await friend.auth.getUser()).data.user.id, body: "Let's go here!" })
  .select("*")
  .single();
assert(!commentErr && commentInsert, "friend comments on the place: " + JSON.stringify(commentErr));

const { data: ownerSeesReaction, error: ownerSeeErr } = await owner
  .from("places")
  .select("*, reactions(*), comments(*)")
  .eq("id", place.id)
  .single();
assert(
  !ownerSeeErr &&
    ownerSeesReaction.reactions.length === 1 &&
    ownerSeesReaction.comments.length === 1,
  "owner sees friend's reaction and comment"
);

// Cleanup - a random stranger (third anonymous session) should not be able
// to read or write anything on this list.
const stranger = createClient(url, key);
await stranger.auth.signInAnonymously();
const { data: strangerRead } = await stranger.from("places").select("*").eq("list_id", list.id);
assert((strangerRead ?? []).length === 0, "uninvited stranger cannot read the list's places");

await owner.from("lists").delete().eq("id", list.id);
console.log("\nAll smoke tests passed. Cleaned up test list.");
