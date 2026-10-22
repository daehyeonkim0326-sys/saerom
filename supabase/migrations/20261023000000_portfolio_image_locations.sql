alter table public.community_posts
  add column if not exists image_locations text[] not null default '{}';

alter table public.community_posts
  drop constraint if exists community_posts_image_paths_limit;

alter table public.community_posts
  add constraint community_posts_image_paths_limit
  check (cardinality(image_paths) <= 20);
