-- Rode no SQL Editor se o schema principal já foi aplicado antes
alter table public.profiles
  add column if not exists favorite_stores jsonb default '[]'::jsonb;

alter table public.wish_list
  add column if not exists store_name text;

alter table public.wish_list
  add column if not exists buy_url text;

alter table public.wish_list
  add column if not exists image_url text;
