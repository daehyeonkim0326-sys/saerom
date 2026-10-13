create or replace function public.revoke_own_admin_role()
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_user_id uuid := auth.uid();
  admin_count bigint;
begin
  if current_user_id is null
    or (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin'
  then
    raise exception '관리자 계정만 관리자 권한을 해제할 수 있습니다.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(73021, 1);

  select count(*)
    into admin_count
    from auth.users
    where raw_app_meta_data ->> 'role' = 'admin';

  if admin_count <= 1 then
    raise exception '마지막 관리자는 관리자 권한을 해제할 수 없습니다.'
      using errcode = 'P0001';
  end if;

  update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
    where id = current_user_id
      and raw_app_meta_data ->> 'role' = 'admin';

  if not found then
    raise exception '관리자 계정 정보를 변경하지 못했습니다.';
  end if;
end;
$$;

revoke all on function public.revoke_own_admin_role() from public, anon;
grant execute on function public.revoke_own_admin_role() to authenticated;
