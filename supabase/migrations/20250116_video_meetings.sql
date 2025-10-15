-- Video Meetings System
-- Система видеоконференций

-- Таблица для видеовстреч
create table if not exists public.video_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  room_name text not null unique,
  scheduled_at timestamp with time zone not null,
  duration_minutes integer not null default 60,
  status text not null default 'scheduled' check (status in ('scheduled', 'in-progress', 'completed', 'cancelled')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Индексы
create index if not exists idx_video_meetings_created_by on public.video_meetings(created_by);
create index if not exists idx_video_meetings_status on public.video_meetings(status);
create index if not exists idx_video_meetings_scheduled_at on public.video_meetings(scheduled_at desc);

-- RLS политики
alter table public.video_meetings enable row level security;

drop policy if exists "Users can view their own meetings" on public.video_meetings;
create policy "Users can view their own meetings"
  on public.video_meetings for select
  using (auth.uid() = created_by);

drop policy if exists "Users can create meetings" on public.video_meetings;
create policy "Users can create meetings"
  on public.video_meetings for insert
  with check (auth.uid() = created_by);

drop policy if exists "Users can update their own meetings" on public.video_meetings;
create policy "Users can update their own meetings"
  on public.video_meetings for update
  using (auth.uid() = created_by);

drop policy if exists "Users can delete their own meetings" on public.video_meetings;
create policy "Users can delete their own meetings"
  on public.video_meetings for delete
  using (auth.uid() = created_by);

-- Enable Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'video_meetings') then
    alter publication supabase_realtime add table public.video_meetings;
  end if;
end $$;

-- Комментарии
comment on table public.video_meetings is 'Видеоконференции и встречи';
comment on column public.video_meetings.room_name is 'Уникальное имя комнаты для Daily.co';
comment on column public.video_meetings.status is 'Статус встречи: scheduled, in-progress, completed, cancelled';
