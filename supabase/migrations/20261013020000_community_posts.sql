create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null check (author_role in ('admin', 'member')),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '',
  category text not null check (category in ('Portfolio', '새롬 이야기', '후기', '공지')),
  image_path text
);

alter table public.community_posts enable row level security;

revoke all on public.community_posts from anon, authenticated;
grant select on public.community_posts to anon, authenticated;
grant insert, update, delete on public.community_posts to authenticated;

drop policy if exists "Anyone can read community posts" on public.community_posts;
create policy "Anyone can read community posts"
  on public.community_posts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Members can publish allowed community posts" on public.community_posts;
create policy "Members can publish allowed community posts"
  on public.community_posts
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        and author_role = 'admin'
      )
      or (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') != 'admin'
        and author_role = 'member'
        and category in ('새롬 이야기', '후기')
      )
    )
  );

drop policy if exists "Authors and admins can update community posts" on public.community_posts;
create policy "Authors and admins can update community posts"
  on public.community_posts
  for update
  to authenticated
  using (
    author_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
    or (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') != 'admin'
      and author_id = auth.uid()
      and author_role = 'member'
      and category in ('새롬 이야기', '후기')
    )
  );

drop policy if exists "Authors and admins can delete community posts" on public.community_posts;
create policy "Authors and admins can delete community posts"
  on public.community_posts
  for delete
  to authenticated
  using (
    author_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-post-images',
  'community-post-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, delete on storage.objects to anon, authenticated;

drop policy if exists "Anyone can view community post images" on storage.objects;
create policy "Anyone can view community post images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'community-post-images');

drop policy if exists "Members can upload community post images" on storage.objects;
create policy "Members can upload community post images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-post-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

drop policy if exists "Owners can remove community post images" on storage.objects;
create policy "Owners can remove community post images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-post-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );
