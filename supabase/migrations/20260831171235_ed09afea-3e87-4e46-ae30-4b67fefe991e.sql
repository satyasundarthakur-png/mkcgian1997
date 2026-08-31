create or replace function public.list_members_directory()
returns table (
  id integer,
  name text,
  birth_month integer,
  birth_day integer,
  profession text,
  current_position text,
  photo_url text,
  profile_claimed boolean,
  is_mine boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.name, m.birth_month, m.birth_day, m.profession,
         m.current_position, m.photo_url, m.profile_claimed,
         (m.user_id is not null and m.user_id = auth.uid())
  from public.members m
  where auth.uid() is not null
  order by m.name;
$$;

revoke execute on function public.list_members_directory() from public;
revoke execute on function public.list_members_directory() from anon;
grant execute on function public.list_members_directory() to authenticated;

create or replace function public.claim_member(_member_id integer)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'You have already claimed a profile';
  end if;

  update public.members
     set user_id = auth.uid(), profile_claimed = true, updated_at = now()
   where id = _member_id and user_id is null;

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;

revoke execute on function public.claim_member(integer) from public;
revoke execute on function public.claim_member(integer) from anon;
grant execute on function public.claim_member(integer) to authenticated;