-- Check nickname availability without changing ownership or indexes on auth.users.
create table if not exists public.member_nickname_reservations (
  nickname_key text primary key,
  reservation_token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.member_nickname_reservations enable row level security;
revoke all on public.member_nickname_reservations from public, anon, authenticated;

create index if not exists member_nickname_reservations_expires_at_idx
  on public.member_nickname_reservations (expires_at);

create or replace function public.is_nickname_available(nickname_value text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select char_length(btrim(coalesce(nickname_value, ''))) between 2 and 30
    and not exists (
      select 1
      from auth.users
      where lower(btrim(raw_user_meta_data ->> 'nickname')) = lower(btrim(nickname_value))
    )
    and not exists (
      select 1
      from public.member_nickname_reservations
      where nickname_key = lower(btrim(nickname_value))
        and expires_at > now()
    );
$$;

create or replace function public.reserve_member_nickname(nickname_value text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_nickname text := lower(btrim(coalesce(nickname_value, '')));
  new_reservation_token uuid;
begin
  if char_length(btrim(coalesce(nickname_value, ''))) not between 2 and 30 then
    raise exception '닉네임은 2자 이상 30자 이하로 입력해 주세요.' using errcode = '22023';
  end if;

  delete from public.member_nickname_reservations
    where expires_at <= clock_timestamp();

  if exists (
    select 1
    from auth.users
    where lower(btrim(raw_user_meta_data ->> 'nickname')) = normalized_nickname
  ) then
    raise exception '이미 사용 중인 닉네임입니다.' using errcode = '23505';
  end if;

  insert into public.member_nickname_reservations (nickname_key)
    values (normalized_nickname)
    returning reservation_token into new_reservation_token;

  return new_reservation_token;
exception
  when unique_violation then
    raise exception '이미 사용 중인 닉네임입니다.' using errcode = '23505';
end;
$$;

create or replace function public.release_member_nickname(reservation_token uuid)
returns void
language sql
security definer
set search_path = pg_catalog
as $$
  delete from public.member_nickname_reservations
  where member_nickname_reservations.reservation_token = $1;
$$;

revoke all on function public.is_nickname_available(text) from public;
grant execute on function public.is_nickname_available(text) to anon, authenticated;
revoke all on function public.reserve_member_nickname(text) from public;
grant execute on function public.reserve_member_nickname(text) to anon, authenticated;
revoke all on function public.release_member_nickname(uuid) from public;
grant execute on function public.release_member_nickname(uuid) to anon, authenticated;
