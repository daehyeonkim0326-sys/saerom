create table if not exists public.consultation_requests (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  phone text not null check (char_length(btrim(phone)) between 7 and 30),
  email text not null check (char_length(btrim(email)) between 3 and 254),
  site_address text not null check (char_length(btrim(site_address)) between 1 and 500),
  consultation_type text not null check (
    consultation_type in ('아파트', '주택', '빌라/오피스텔', '상업공간', '부분공사', '기타')
  ),
  floor_plan_paths text[] not null default '{}'
    check (cardinality(floor_plan_paths) <= 2),
  portfolio_styles text[] not null
    check (cardinality(portfolio_styles) > 0),
  story text not null check (char_length(btrim(story)) between 1 and 5000),
  area numeric not null check (area > 0 and area <= 100000),
  expected_budget text not null check (
    expected_budget in (
      '3천만원 미만',
      '3천만원 이상 ~ 5천만원 미만',
      '5천만원 이상 ~ 1억원 미만',
      '1억원 이상 ~ 2억원 미만',
      '2억원 이상',
      '상담 후 결정'
    )
  ),
  desired_start_date date not null,
  move_in_date date not null,
  referral_source text not null check (
    referral_source in ('검색', 'SNS', '지인 소개', '기존 고객', '기타')
  ),
  customer_request text check (
    customer_request is null or char_length(customer_request) <= 5000
  ),
  privacy_agreed boolean not null check (privacy_agreed)
);

alter table public.consultation_requests enable row level security;

revoke all on public.consultation_requests from anon, authenticated;
grant insert on public.consultation_requests to anon, authenticated;
grant select on public.consultation_requests to authenticated;

drop policy if exists "Anyone can submit consultation requests" on public.consultation_requests;
create policy "Anyone can submit consultation requests"
  on public.consultation_requests
  for insert
  to anon, authenticated
  with check (privacy_agreed);

drop policy if exists "Admins can read consultation requests" on public.consultation_requests;
create policy "Admins can read consultation requests"
  on public.consultation_requests
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'consultation-floor-plans',
  'consultation-floor-plans',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant insert on storage.objects to anon, authenticated;
grant select on storage.objects to authenticated;

drop policy if exists "Anyone can upload consultation floor plans" on storage.objects;
create policy "Anyone can upload consultation floor plans"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'consultation-floor-plans'
    and (storage.foldername(name))[1] ~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

drop policy if exists "Admins can read consultation floor plans" on storage.objects;
create policy "Admins can read consultation floor plans"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'consultation-floor-plans'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
