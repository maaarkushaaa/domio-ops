-- Wall polls extension: tables for polls, options, votes + RLS
create extension if not exists pgcrypto;

-- Polls (attached to posts)
create table if not exists public.wall_polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.wall_posts(id) on delete cascade,
  question text not null,
  is_anonymous boolean not null default false,
  is_multiple boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Poll options
create table if not exists public.wall_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.wall_polls(id) on delete cascade,
  text text not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Poll votes
create table if not exists public.wall_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.wall_polls(id) on delete cascade,
  option_id uuid not null references public.wall_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique (poll_id, option_id, user_id)
);

-- Indexes
create index if not exists wall_polls_post_idx on public.wall_polls (post_id);
create index if not exists wall_poll_options_poll_idx on public.wall_poll_options (poll_id, position);
create index if not exists wall_poll_votes_poll_idx on public.wall_poll_votes (poll_id);
create index if not exists wall_poll_votes_user_idx on public.wall_poll_votes (user_id);

-- RLS
alter table public.wall_polls enable row level security;
alter table public.wall_poll_options enable row level security;
alter table public.wall_poll_votes enable row level security;

-- Policies: authenticated can read all, create votes; poll creation via post creation
drop policy if exists wall_polls_select_all on public.wall_polls;
create policy wall_polls_select_all on public.wall_polls for select using (auth.role() = 'authenticated');
drop policy if exists wall_polls_insert_auth on public.wall_polls;
create policy wall_polls_insert_auth on public.wall_polls for insert with check (auth.role() = 'authenticated');

drop policy if exists wall_poll_options_select_all on public.wall_poll_options;
create policy wall_poll_options_select_all on public.wall_poll_options for select using (auth.role() = 'authenticated');
drop policy if exists wall_poll_options_insert_auth on public.wall_poll_options;
create policy wall_poll_options_insert_auth on public.wall_poll_options for insert with check (auth.role() = 'authenticated');

drop policy if exists wall_poll_votes_select_all on public.wall_poll_votes;
create policy wall_poll_votes_select_all on public.wall_poll_votes for select using (auth.role() = 'authenticated');
drop policy if exists wall_poll_votes_upsert_auth on public.wall_poll_votes;
create policy wall_poll_votes_upsert_auth on public.wall_poll_votes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
