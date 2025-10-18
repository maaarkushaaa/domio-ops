create table if not exists public.video_call_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended', 'cancelled')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.video_call_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_call_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'guest' check (role in ('host', 'guest')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  connection_state text not null default 'connecting' check (connection_state in ('connecting', 'connected', 'disconnected')),
  media_state jsonb default '{}'::jsonb,
  unique (session_id, user_id)
);

create table if not exists public.video_call_signals (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.video_call_sessions(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid,
  type text not null check (type in ('offer', 'answer', 'candidate', 'bye')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists idx_video_call_participants_session on public.video_call_participants(session_id);
create index if not exists idx_video_call_participants_user on public.video_call_participants(user_id);

create index if not exists idx_video_call_signals_session on public.video_call_signals(session_id);
create index if not exists idx_video_call_signals_receiver on public.video_call_signals(receiver_id);
create index if not exists idx_video_call_signals_expires on public.video_call_signals(expires_at);

alter table public.video_call_sessions enable row level security;
alter table public.video_call_participants enable row level security;
alter table public.video_call_signals enable row level security;

-- Sessions policies
create policy "Select video sessions"
  on public.video_call_sessions
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.video_call_participants p
      where p.session_id = id and p.user_id = auth.uid()
    )
    or host_id = auth.uid()
  );

create policy "Insert video sessions"
  on public.video_call_sessions
  for insert
  with check (auth.uid() = host_id);

create policy "Update own video sessions"
  on public.video_call_sessions
  for update
  using (auth.uid() = host_id or auth.role() = 'service_role')
  with check (auth.uid() = host_id or auth.role() = 'service_role');

-- Participants policies
create policy "Select session participants"
  on public.video_call_participants
  for select
  using (
    auth.role() = 'service_role'
    or user_id = auth.uid()
    or exists (
      select 1 from public.video_call_sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  );

create policy "Insert participants via service"
  on public.video_call_participants
  for insert
  with check (auth.role() = 'service_role');

create policy "Update own participant state"
  on public.video_call_participants
  for update
  using (user_id = auth.uid() or auth.role() = 'service_role')
  with check (user_id = auth.uid() or auth.role() = 'service_role');

-- Signals policies
create policy "Select relevant signals"
  on public.video_call_signals
  for select
  using (
    auth.role() = 'service_role'
    or receiver_id is null
    or receiver_id = auth.uid()
    or sender_id = auth.uid()
  );

create policy "Insert signals via service"
  on public.video_call_signals
  for insert
  with check (auth.role() = 'service_role');

-- Cleanup helper: remove expired signals
create or replace function public.delete_expired_video_call_signals()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.video_call_signals where expires_at < now();
$$;

-- Ensure tables are part of realtime publication
DO $$
DECLARE
  tabname text;
BEGIN
  FOR tabname IN SELECT unnest(ARRAY['video_call_sessions','video_call_participants','video_call_signals']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tabname
    ) THEN
      EXECUTE format('alter publication supabase_realtime add table public.%I', tabname);
    END IF;
  END LOOP;
END $$;
