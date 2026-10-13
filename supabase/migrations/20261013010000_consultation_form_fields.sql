alter table public.consultation_requests
  add column if not exists site_detail_address text not null default '';

alter table public.consultation_requests
  drop constraint if exists consultation_requests_portfolio_styles_check;

alter table public.consultation_requests
  rename column portfolio_styles to portfolio_style;

alter table public.consultation_requests
  alter column portfolio_style type text
  using array_to_string(portfolio_style, ', ');

alter table public.consultation_requests
  add constraint consultation_requests_portfolio_style_check
  check (char_length(btrim(portfolio_style)) between 1 and 500);

alter table public.consultation_requests
  add constraint consultation_requests_site_detail_address_check
  check (char_length(btrim(site_detail_address)) between 0 and 300);
