-- Fix WebRTC tables policies and extend video_meetings schema

-- Ensure video_meetings has linkage to WebRTC sessions
alter table public.video_meetings
  add column if not exists session_id uuid references public.video_call_sessions(id) on delete set null;

alter table public.video_meetings
  alter column room_name drop not null;

-- Helper functions to avoid RLS recursion
create or replace function public.video_call_is_host(session_uuid uuid, user_uuid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.video_call_sessions s
    where s.id = session_uuid
      and s.host_id = coalesce(user_uuid, auth.uid())
  );
$$;

create or replace function public.video_call_is_participant(session_uuid uuid, user_uuid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.video_call_participants p
    where p.session_id = session_uuid
      and p.user_id = coalesce(user_uuid, auth.uid())
  );
$$;

-- Refresh policies for video_call_sessions
alter table public.video_call_sessions enable row level security;

drop policy if exists "Select video sessions" on public.video_call_sessions;
create policy "Select video sessions"
  on public.video_call_sessions
  for select
  using (
    auth.role() = 'service_role'
    or host_id = auth.uid()
    or exists (
      select 1
      from public.video_call_participants p
      where p.session_id = public.video_call_sessions.id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Insert video sessions" on public.video_call_sessions;
create policy "Insert video sessions"
  on public.video_call_sessions
  for insert
  with check (auth.uid() = host_id);

drop policy if exists "Update own video sessions" on public.video_call_sessions;
create policy "Update own video sessions"
  on public.video_call_sessions
  for update
  using (auth.role() = 'service_role' or public.video_call_is_host(id))
  with check (auth.role() = 'service_role' or public.video_call_is_host(id));

-- Refresh policies for video_call_participants
alter table public.video_call_participants enable row level security;

drop policy if exists "Select session participants" on public.video_call_participants;
create policy "Select session participants"
  on public.video_call_participants
  for select
  using (
    auth.role() = 'service_role'
    or user_id = auth.uid()
    or public.video_call_is_host(session_id)
  );

drop policy if exists "Insert participants" on public.video_call_participants;
drop policy if exists "Insert participants via service" on public.video_call_participants;
create policy "Insert participants"
  on public.video_call_participants
  for insert
  with check (
    auth.role() = 'service_role'
    or auth.uid() = user_id
  );

drop policy if exists "Update participant state" on public.video_call_participants;
drop policy if exists "Update own participant state" on public.video_call_participants;
create policy "Update participant state"
  on public.video_call_participants
  for update
  using (
    auth.role() = 'service_role'
    or user_id = auth.uid()
    or public.video_call_is_host(session_id)
  )
  with check (
    auth.role() = 'service_role'
    or user_id = auth.uid()
    or public.video_call_is_host(session_id)
  );
