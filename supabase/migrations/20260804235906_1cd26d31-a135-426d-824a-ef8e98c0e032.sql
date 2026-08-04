-- 1. Tighten admins visibility: each user can only see their own admin row
drop policy if exists "Signed-in users can check the admin list" on public.admins;
create policy "Users can check their own admin status"
  on public.admins for select
  to authenticated
  using (email = auth.email());

-- 2. Replace members policies (inline admin check; drop SECURITY DEFINER helper)
drop policy if exists "Signed-in batchmates can view all members" on public.members;
drop policy if exists "Owners, claimers, and admins can update a member" on public.members;
drop policy if exists "Only admins can add members" on public.members;
drop policy if exists "Only admins can remove members" on public.members;

create policy "Owners and admins can view full member records"
  on public.members for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.admins a where a.email = auth.email())
  );

create policy "Owners and admins can update a member"
  on public.members for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.admins a where a.email = auth.email())
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.admins a where a.email = auth.email())
  );

create policy "Only admins can add members"
  on public.members for insert
  to authenticated
  with check (exists (select 1 from public.admins a where a.email = auth.email()));

create policy "Only admins can remove members"
  on public.members for delete
  to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.email()));

drop function if exists public.is_admin();

-- 3. Safe directory view for all signed-in batchmates (non-sensitive columns only)
create or replace view public.members_directory
with (security_invoker = off) as
  select id, name, birth_month, birth_day, profession, current_position, photo_url, profile_claimed
  from public.members;

revoke all on public.members_directory from anon, authenticated;
grant select on public.members_directory to authenticated;
grant all on public.members_directory to service_role;