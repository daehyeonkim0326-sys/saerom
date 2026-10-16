alter table public.community_posts
  add column if not exists image_paths text[] not null default '{}';

update public.community_posts
set image_paths = array[image_path]
where image_path is not null
  and cardinality(image_paths) = 0;

alter table public.community_posts
  add constraint community_posts_image_paths_limit
  check (cardinality(image_paths) <= 10);
