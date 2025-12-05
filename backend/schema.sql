-- Schema Supabase pentru Poli Chat

create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  trust_score integer not null check (trust_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  sender text not null,
  trust_score integer not null check (trust_score between 0 and 100),
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_created_at on public.messages (created_at);

-- Seed utilizatori
insert into public.users (name, trust_score)
values
  ('Alex', 97),
  ('Bogdan', 37),
  ('Cristina', 56)
on conflict (name) do update set trust_score = excluded.trust_score;

-- Dacă RLS e activată și vrei acces complet pentru rolul anon,
-- decomentează liniile de mai jos:
-- alter table public.users enable row level security;
-- alter table public.messages enable row level security;
-- create policy "anon select users" on public.users for select using (true);
-- create policy "anon insert users" on public.users for insert with check (true);
-- create policy "anon select messages" on public.messages for select using (true);
-- create policy "anon insert messages" on public.messages for insert with check (true);
