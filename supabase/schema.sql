-- Personal Stylist — cole TODO este conteúdo no SQL Editor do Supabase
-- (não cole o nome do arquivo)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text default '',
  city text default '',
  style_tags text[] default '{}',
  latitude double precision,
  longitude double precision,
  onboarding_complete boolean default false,
  updated_at timestamptz default now()
);

create table if not exists public.pieces (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  subcategory text not null,
  color text not null,
  color_hex text not null,
  style text not null,
  season text not null,
  occasion text not null,
  formality text not null default 'todos',
  status text not null default 'available',
  brand text not null default '',
  uses int not null default 0,
  img text not null,
  tall boolean,
  created_at bigint not null,
  updated_at timestamptz default now()
);

create table if not exists public.looks (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  occasion_id text,
  formality_id text,
  pieces jsonb not null default '{}',
  created_at bigint not null
);

create table if not exists public.week_plans (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day text not null,
  date text not null,
  weather text,
  temp numeric,
  temp_max numeric,
  temp_min numeric,
  occasion_id text,
  formality_id text,
  outfit_refs jsonb,
  used boolean default false,
  updated_at timestamptz default now()
);

create table if not exists public.wish_list (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  reason text not null,
  category_hint text,
  subcategory_hint text,
  formality_hint text,
  gap_id text,
  created_at bigint not null
);

create table if not exists public.chat_messages (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  text text not null,
  outfit_refs jsonb,
  created_at bigint not null
);

create index if not exists pieces_user_idx on public.pieces (user_id);
create index if not exists looks_user_idx on public.looks (user_id);
create index if not exists week_plans_user_idx on public.week_plans (user_id);
create index if not exists wish_list_user_idx on public.wish_list (user_id);
create index if not exists chat_messages_user_idx on public.chat_messages (user_id);

alter table public.profiles enable row level security;
alter table public.pieces enable row level security;
alter table public.looks enable row level security;
alter table public.week_plans enable row level security;
alter table public.wish_list enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "pieces_own" on public.pieces;
create policy "pieces_own" on public.pieces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "looks_own" on public.looks;
create policy "looks_own" on public.looks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "week_plans_own" on public.week_plans;
create policy "week_plans_own" on public.week_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wish_list_own" on public.wish_list;
create policy "wish_list_own" on public.wish_list
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chat_messages_own" on public.chat_messages;
create policy "chat_messages_own" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

-- Extensões para compras / lojas favoritas
alter table public.profiles
  add column if not exists favorite_stores jsonb default '[]'::jsonb;

alter table public.wish_list
  add column if not exists store_name text;

alter table public.wish_list
  add column if not exists buy_url text;

drop policy if exists "wardrobe_read" on storage.objects;
create policy "wardrobe_read" on storage.objects
  for select using (bucket_id = 'wardrobe');

drop policy if exists "wardrobe_write_own" on storage.objects;
create policy "wardrobe_write_own" on storage.objects
  for insert with check (
    bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "wardrobe_update_own" on storage.objects;
create policy "wardrobe_update_own" on storage.objects
  for update using (
    bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "wardrobe_delete_own" on storage.objects;
create policy "wardrobe_delete_own" on storage.objects
  for delete using (
    bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
