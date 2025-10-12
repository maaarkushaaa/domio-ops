-- calendar_events: события календаря
-- Таблица, индексы, RLS, Realtime

-- Создаём таблицу
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  type text not null default 'other',
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Индексы (только если таблица существует и колонки есть)
do $$ 
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='calendar_events') then
    if not exists (select 1 from pg_indexes where tablename='calendar_events' and indexname='idx_calendar_events_start_at') then
      create index idx_calendar_events_start_at on public.calendar_events(start_at);
    end if;
    if not exists (select 1 from pg_indexes where tablename='calendar_events' and indexname='idx_calendar_events_end_at') then
      create index idx_calendar_events_end_at on public.calendar_events(end_at);
    end if;
  end if;
end $$;

-- Триггер updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_calendar_events_updated_at on public.calendar_events;
create trigger trg_calendar_events_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

-- RLS
alter table public.calendar_events enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where tablename='calendar_events' and policyname='read all events') then
    create policy "read all events" on public.calendar_events for select to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='calendar_events' and policyname='insert own events') then
    create policy "insert own events" on public.calendar_events for insert to authenticated with check (auth.uid() = created_by);
  end if;
  if not exists(select 1 from pg_policies where tablename='calendar_events' and policyname='update own events') then
    create policy "update own events" on public.calendar_events for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
  end if;
  if not exists(select 1 from pg_policies where tablename='calendar_events' and policyname='delete own events') then
    create policy "delete own events" on public.calendar_events for delete to authenticated using (auth.uid() = created_by);
  end if;
end $$;

-- Realtime публикация
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'calendar_events'
  ) then
    alter publication supabase_realtime add table public.calendar_events;
  end if;
end $$;


