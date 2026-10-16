alter table public.consultation_requests
  add column if not exists completed_at timestamptz,
  add column if not exists delete_after timestamptz;

alter table public.consultation_requests
  add constraint consultation_requests_completion_retention_check
  check (
    (completed_at is null and delete_after is null)
    or (completed_at is not null and delete_after > completed_at)
  );

create or replace function public.complete_consultation_request(request_id uuid)
returns table (completed_at timestamptz, delete_after timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception '관리자만 상담을 완료 처리할 수 있습니다.'
      using errcode = '42501';
  end if;

  return query
  update public.consultation_requests as request
  set
    completed_at = coalesce(request.completed_at, now()),
    delete_after = coalesce(request.delete_after, now() + interval '1 year')
  where request.id = request_id
  returning request.completed_at, request.delete_after;

  if not found then
    raise exception '상담 신청을 찾을 수 없습니다.'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.complete_consultation_request(uuid) from public, anon;
grant execute on function public.complete_consultation_request(uuid) to authenticated;
