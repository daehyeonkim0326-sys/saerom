create or replace function public.prepare_own_account_deletion()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_user_id uuid := auth.uid();
  current_role text;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(73021, 1);

  select raw_app_meta_data ->> 'role'
    into current_role
    from auth.users
    where id = current_user_id;

  if not found then
    raise exception '계정 정보를 확인할 수 없습니다.';
  end if;

  if current_role = 'admin' then
    raise exception '관리자 권한을 먼저 해제한 뒤 회원 탈퇴를 진행해 주세요.'
      using errcode = 'P0001';
  end if;

  return false;
end;
$$;
