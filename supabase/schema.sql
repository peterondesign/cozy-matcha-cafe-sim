-- Cozy Matcha Cafe accounts.
-- Run this once in the Supabase SQL editor.
--
-- Passwords are not stored in this table. Supabase Auth hashes them with
-- bcrypt and keeps the hash in auth.users.encrypted_password. We only collect
-- the email here, plus the cloud copy of the shift.

create table if not exists public.cozy_matcha_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cozy_matcha_saves (
  user_id uuid primary key references public.cozy_matcha_users (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_cozy_matcha_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cozy_matcha_users (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_cozy_matcha on auth.users;
create trigger on_auth_user_created_cozy_matcha
  after insert on auth.users
  for each row execute function public.handle_new_cozy_matcha_user();

alter table public.cozy_matcha_users enable row level security;
alter table public.cozy_matcha_saves enable row level security;

drop policy if exists "read own cafe profile" on public.cozy_matcha_users;
create policy "read own cafe profile"
  on public.cozy_matcha_users for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "read own save" on public.cozy_matcha_saves;
create policy "read own save"
  on public.cozy_matcha_saves for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own save" on public.cozy_matcha_saves;
create policy "insert own save"
  on public.cozy_matcha_saves for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own save" on public.cozy_matcha_saves;
create policy "update own save"
  on public.cozy_matcha_saves for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on public.cozy_matcha_users to authenticated;
grant select, insert, update on public.cozy_matcha_saves to authenticated;
