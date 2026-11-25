alter table public.community_posts
  add column if not exists image_comparison_pairs jsonb not null default '[]'::jsonb;

alter table public.community_posts
  drop constraint if exists community_posts_image_comparison_pairs_check;

alter table public.community_posts
  add constraint community_posts_image_comparison_pairs_check
  check (jsonb_typeof(image_comparison_pairs) = 'array');
