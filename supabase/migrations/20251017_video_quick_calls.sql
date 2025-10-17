-- Quick video calls broadcast table
create table if not exists public.video_quick_calls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  room_name text not null unique,
  room_url text not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone
);

create index if not exists idx_video_quick_calls_status on public.video_quick_calls(status);
create index if not exists idx_video_quick_calls_created_at on public.video_quick_calls(created_at desc);

alter table public.video_quick_calls enable row level security;

drop policy if exists "View quick calls" on public.video_quick_calls;
create policy "View quick calls"
  on public.video_quick_calls for select
  using (auth.role() = 'authenticated');

drop policy if exists "Create quick call" on public.video_quick_calls;
create policy "Create quick call"
  on public.video_quick_calls for insert
  with check (auth.uid() = created_by);

drop policy if exists "Modify own quick call" on public.video_quick_calls;
create policy "Modify own quick call"
  on public.video_quick_calls for update
  using (auth.uid() = created_by);

drop policy if exists "Delete own quick call" on public.video_quick_calls;
create policy "Delete own quick call"
  on public.video_quick_calls for delete
  using (auth.uid() = created_by);

-- Enable realtime broadcasting
select pg_notify('pgrst', json_build_object(
  'schema', 'public',
  'table', 'video_quick_calls',
  'action', 'reload cache'
)::text);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'video_quick_calls'
  ) then
    alter publication supabase_realtime add table public.video_quick_calls;
  end if;
end $$;
