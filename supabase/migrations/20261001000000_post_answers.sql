create table if not exists public.post_answers (
  post_id text primary key,
  answer text not null,
  updated_at timestamptz not null default now()
);

alter table public.post_answers enable row level security;

grant select on public.post_answers to anon, authenticated;
grant insert, update on public.post_answers to authenticated;

drop policy if exists "Anyone can read post answers" on public.post_answers;
create policy "Anyone can read post answers"
  on public.post_answers
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can add post answers" on public.post_answers;
create policy "Admins can add post answers"
  on public.post_answers
  for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update post answers" on public.post_answers;
create policy "Admins can update post answers"
  on public.post_answers
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');