create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(btrim(display_name)) between 2 and 60),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

comment on table public.profiles is 'Private profile details for a FitLoop account.';

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, display_name) on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function private.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_profile_updated_at() from public, anon, authenticated;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function private.set_profile_updated_at();
