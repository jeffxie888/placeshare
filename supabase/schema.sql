-- Placeshare database schema.
-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS.

create extension if not exists pgcrypto;

-- Plain `encode(bytes, 'base64')` can contain '+' and '/', which silently
-- break when concatenated straight into a /join/:token URL path (a '/'
-- becomes an extra path segment). This is the URL-safe "base64url" variant.
create or replace function generate_share_token()
returns text
language sql
volatile
as $$
  select translate(encode(gen_random_bytes(9), 'base64'), '+/=', '-_');
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Guest',
  is_guest boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  share_token text not null unique default generate_share_token(),
  created_at timestamptz not null default now()
);

-- Re-running on a project created before this fix: update the default for
-- new rows and repair any already-generated tokens containing unsafe chars.
alter table lists alter column share_token set default generate_share_token();
update lists set share_token = generate_share_token() where share_token ~ '[+/=]';

create table if not exists list_members (
  list_id uuid not null references lists (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists (id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  category text,
  note text,
  source text not null default 'manual' check (source in ('manual', 'takeout')),
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null check (type in ('want_to_go', 'been', 'not_interested')),
  created_at timestamptz not null default now(),
  unique (place_id, user_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists places_list_id_idx on places (list_id);
create index if not exists reactions_place_id_idx on reactions (place_id);
create index if not exists comments_place_id_idx on comments (place_id);
create index if not exists list_members_user_id_idx on list_members (user_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user (real or anonymous) signs up
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, is_guest)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Guest'), new.is_anonymous);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Access helper + join-by-share-link RPC (security definer so it can bypass
-- RLS just long enough to verify the token and add the caller as a member)
-- ---------------------------------------------------------------------------

create or replace function has_list_access(p_list_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from lists l where l.id = p_list_id and l.owner_id = auth.uid()
  ) or exists (
    select 1 from list_members m where m.list_id = p_list_id and m.user_id = auth.uid()
  );
$$;

create or replace function join_list_by_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list_id uuid;
begin
  select id into v_list_id from lists where share_token = p_token;

  if v_list_id is null then
    raise exception 'Invalid share link';
  end if;

  insert into list_members (list_id, user_id)
  values (v_list_id, auth.uid())
  on conflict (list_id, user_id) do nothing;

  return v_list_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table lists enable row level security;
alter table list_members enable row level security;
alter table places enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;

drop policy if exists "profiles are readable by any signed-in user" on profiles;
create policy "profiles are readable by any signed-in user" on profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "users manage their own profile" on profiles;
create policy "users manage their own profile" on profiles
  for update using (id = auth.uid());

drop policy if exists "members can read their lists" on lists;
create policy "members can read their lists" on lists
  for select using (owner_id = auth.uid() or has_list_access(id));

drop policy if exists "users create their own lists" on lists;
create policy "users create their own lists" on lists
  for insert with check (owner_id = auth.uid());

drop policy if exists "owners update their lists" on lists;
create policy "owners update their lists" on lists
  for update using (owner_id = auth.uid());

drop policy if exists "owners delete their lists" on lists;
create policy "owners delete their lists" on lists
  for delete using (owner_id = auth.uid());

drop policy if exists "members can read list membership" on list_members;
create policy "members can read list membership" on list_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from lists l where l.id = list_id and l.owner_id = auth.uid())
  );

drop policy if exists "owners add members directly" on list_members;
create policy "owners add members directly" on list_members
  for insert with check (
    exists (select 1 from lists l where l.id = list_id and l.owner_id = auth.uid())
  );

drop policy if exists "members can read places on accessible lists" on places;
create policy "members can read places on accessible lists" on places
  for select using (has_list_access(list_id));

drop policy if exists "members can add places to accessible lists" on places;
create policy "members can add places to accessible lists" on places
  for insert with check (has_list_access(list_id));

drop policy if exists "members can update places on accessible lists" on places;
create policy "members can update places on accessible lists" on places
  for update using (has_list_access(list_id));

drop policy if exists "members can delete places on accessible lists" on places;
create policy "members can delete places on accessible lists" on places
  for delete using (has_list_access(list_id));

drop policy if exists "members can read reactions on accessible lists" on reactions;
create policy "members can read reactions on accessible lists" on reactions
  for select using (
    exists (select 1 from places p where p.id = place_id and has_list_access(p.list_id))
  );

drop policy if exists "members react to places on accessible lists" on reactions;
create policy "members react to places on accessible lists" on reactions
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from places p where p.id = place_id and has_list_access(p.list_id))
  );

drop policy if exists "members update their own reactions" on reactions;
create policy "members update their own reactions" on reactions
  for update using (user_id = auth.uid());

drop policy if exists "members delete their own reactions" on reactions;
create policy "members delete their own reactions" on reactions
  for delete using (user_id = auth.uid());

drop policy if exists "members can read comments on accessible lists" on comments;
create policy "members can read comments on accessible lists" on comments
  for select using (
    exists (select 1 from places p where p.id = place_id and has_list_access(p.list_id))
  );

drop policy if exists "members comment on places on accessible lists" on comments;
create policy "members comment on places on accessible lists" on comments
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from places p where p.id = place_id and has_list_access(p.list_id))
  );

drop policy if exists "members delete their own comments" on comments;
create policy "members delete their own comments" on comments
  for delete using (user_id = auth.uid());
