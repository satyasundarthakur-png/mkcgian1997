alter table public.members add column if not exists user_id uuid references auth.users(id);
create unique index if not exists members_user_id_key on public.members(user_id) where user_id is not null;

create table if not exists public.admins (
  email text primary key
);

grant select on public.admins to authenticated;
grant all on public.admins to service_role;

insert into public.admins (email) values ('satyasundarthakur@gmail.com')
on conflict (email) do nothing;

alter table public.admins enable row level security;

drop policy if exists "Signed-in users can check the admin list" on public.admins;
create policy "Signed-in users can check the admin list"
  on public.admins for select
  to authenticated
  using (true);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admins where email = auth.email()
  );
$$;

drop policy if exists "Anyone can view batch members" on public.members;
drop policy if exists "Anyone can add batch members" on public.members;
drop policy if exists "Anyone can edit batch members" on public.members;
drop policy if exists "Anyone can remove batch members" on public.members;

revoke all on public.members from anon;
grant select, insert, update, delete on public.members to authenticated;
grant all on public.members to service_role;

create policy "Signed-in batchmates can view all members"
  on public.members for select
  to authenticated
  using (true);

create policy "Owners, claimers, and admins can update a member"
  on public.members for update
  to authenticated
  using (user_id is null or user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Only admins can add members"
  on public.members for insert
  to authenticated
  with check (public.is_admin());

create policy "Only admins can remove members"
  on public.members for delete
  to authenticated
  using (public.is_admin());