alter table public.consultation_requests
  add column if not exists optional_privacy_agreed boolean not null default false;

alter table public.consultation_requests
  drop constraint if exists consultation_requests_optional_privacy_consent_check;

update public.consultation_requests
set optional_privacy_agreed = true
where privacy_agreed
  and (
    coalesce(btrim(site_detail_address), '') <> ''
    or cardinality(floor_plan_paths) > 0
    or customer_request is not null
  );

alter table public.consultation_requests
  add constraint consultation_requests_optional_privacy_consent_check
  check (
    optional_privacy_agreed
    or (
      coalesce(btrim(site_detail_address), '') = ''
      and cardinality(floor_plan_paths) = 0
      and customer_request is null
    )
  );
