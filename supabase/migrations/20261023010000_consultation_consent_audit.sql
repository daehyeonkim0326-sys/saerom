alter table public.consultation_requests
  add column if not exists privacy_notice_version text,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists optional_privacy_agreed_at timestamptz,
  add column if not exists optional_privacy_consent_source text not null default 'not_recorded';

alter table public.consultation_requests
  drop constraint if exists consultation_requests_optional_privacy_consent_check;

update public.consultation_requests
set optional_privacy_consent_source = case
  when created_at < timestamptz '2026-10-20 02:00:00+00' and optional_privacy_agreed then 'legacy_inferred'
  when optional_privacy_agreed then 'explicit'
  else 'not_given'
end;

update public.consultation_requests
set optional_privacy_agreed = false
where optional_privacy_consent_source = 'legacy_inferred';

alter table public.consultation_requests
  add constraint consultation_requests_consent_audit_check
  check (
    (privacy_agreed_at is null or privacy_agreed)
    and (optional_privacy_agreed_at is null or optional_privacy_agreed)
  );

alter table public.consultation_requests
  add constraint consultation_requests_optional_privacy_consent_check
  check (
    optional_privacy_consent_source in ('explicit', 'not_given', 'not_recorded', 'legacy_inferred')
    and (
      (optional_privacy_agreed and optional_privacy_consent_source = 'explicit')
      or (not optional_privacy_agreed and optional_privacy_consent_source != 'explicit')
    )
    and (
      optional_privacy_agreed
      or optional_privacy_consent_source = 'legacy_inferred'
      or (
        coalesce(btrim(site_detail_address), '') = ''
        and cardinality(floor_plan_paths) = 0
        and customer_request is null
      )
    )
  );

drop policy if exists "Anyone can submit consultation requests" on public.consultation_requests;
create policy "Anyone can submit consultation requests"
  on public.consultation_requests
  for insert
  to anon, authenticated
  with check (
    privacy_agreed
    and privacy_notice_version = '2026-10-23'
    and created_at >= timestamptz '2026-10-20 02:00:00+00'
    and optional_privacy_consent_source != 'legacy_inferred'
  );

create or replace function public.capture_consultation_consent_timestamps()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.privacy_agreed then
    new.privacy_agreed_at := clock_timestamp();
  end if;

  if new.optional_privacy_agreed then
    new.optional_privacy_agreed_at := clock_timestamp();
  end if;

  return new;
end;
$$;

revoke all on function public.capture_consultation_consent_timestamps() from public, anon, authenticated;

drop trigger if exists consultation_requests_capture_consent_timestamps
  on public.consultation_requests;

create trigger consultation_requests_capture_consent_timestamps
  before insert on public.consultation_requests
  for each row
  execute function public.capture_consultation_consent_timestamps();
