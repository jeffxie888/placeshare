// Hand-written mirror of supabase/schema.sql, used to type reads from the
// (intentionally untyped - see src/lib/supabase/server.ts) Supabase client.
// If you add Supabase CLI type generation later
// (`supabase gen types typescript`), these can be replaced or merged with
// the generated output.

export type ReactionType = "want_to_go" | "been" | "not_interested";
export type PlaceSource = "manual" | "takeout";

export interface Profile {
  id: string;
  display_name: string;
  is_guest: boolean;
  created_at: string;
}

export interface List {
  id: string;
  owner_id: string;
  title: string;
  share_token: string;
  created_at: string;
}

export interface Place {
  id: string;
  list_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
  note: string | null;
  source: PlaceSource;
  created_by: string | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  place_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

export interface Comment {
  id: string;
  place_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export type PlaceWithExtras = Place & {
  reactions: Reaction[];
  comments: Comment[];
};
