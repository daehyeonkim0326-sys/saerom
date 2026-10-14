alter table public.community_posts
  alter column author_id drop not null;

alter table public.community_posts
  drop constraint if exists community_posts_author_id_fkey;

alter table public.community_posts
  add constraint community_posts_author_id_fkey
  foreign key (author_id)
  references auth.users(id)
  on delete set null;
