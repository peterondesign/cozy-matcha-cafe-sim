-- Little Matcha Days: extend the shared matcha_saves table for the leaderboard.
-- Run once in the Supabase SQL Editor. Safe to re-run.

create table if not exists public.matcha_saves (
  player_id text primary key,
  display_name text not null default 'Player',
  avatar int not null default 1,
  day int not null default 1,
  served int not null default 0,
  coins int not null default 0,
  gems int not null default 0,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- If the table already exists from an earlier version, add the new columns.
alter table public.matcha_saves add column if not exists player_id text;
alter table public.matcha_saves add column if not exists display_name text not null default 'Player';
alter table public.matcha_saves add column if not exists avatar int not null default 1;
alter table public.matcha_saves add column if not exists day int not null default 1;
alter table public.matcha_saves add column if not exists served int not null default 0;
alter table public.matcha_saves add column if not exists coins int not null default 0;
alter table public.matcha_saves add column if not exists gems int not null default 0;
alter table public.matcha_saves add column if not exists state jsonb not null default '{}'::jsonb;
alter table public.matcha_saves add column if not exists updated_at timestamptz not null default now();

-- An older table keyed by sync_code: copy keys into player_id, move the primary key
-- to player_id (upserts need it), then relax sync_code so inserts don't fail.
do $$
declare
  pk_name text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matcha_saves' and column_name = 'sync_code'
  ) then
    execute 'update public.matcha_saves set player_id = coalesce(player_id, sync_code, gen_random_uuid()::text) where player_id is null';

    select conname into pk_name from pg_constraint
    where conrelid = 'public.matcha_saves'::regclass and contype = 'p';
    if pk_name is not null then
      execute format('alter table public.matcha_saves drop constraint %I', pk_name);
    end if;
    alter table public.matcha_saves add primary key (player_id);

    execute 'alter table public.matcha_saves alter column sync_code drop not null';
  end if;
end $$;

-- Leaderboard view: only public-facing columns, no internal fields.
create or replace view public.matcha_leaderboard with (security_invoker=true) as
  select player_id, display_name, avatar, day, served, coins
  from public.matcha_saves
  order by served desc, day desc
  limit 50;

alter table public.matcha_saves enable row level security;

drop policy if exists "matcha_saves anon insert" on public.matcha_saves;
drop policy if exists "matcha_saves anon update" on public.matcha_saves;
drop policy if exists "matcha_saves anon select" on public.matcha_saves;
create policy "matcha_saves anon insert" on public.matcha_saves for insert to anon with check (true);
create policy "matcha_saves anon update" on public.matcha_saves for update to anon using (true) with check (true);
create policy "matcha_saves anon select" on public.matcha_saves for select to anon using (true);

-- Fresh installs (or drop/recreate) also need explicit table privileges for PostgREST.
grant usage on schema public to anon;
grant select, insert, update on public.matcha_saves to anon;

grant select on public.matcha_leaderboard to anon;
