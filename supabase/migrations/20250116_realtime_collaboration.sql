-- Real-Time Collaboration System
-- Система совместной работы в реальном времени

-- Таблица активных сессий пользователей
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null unique,
  status text not null default 'online' check (status in ('online', 'away', 'offline')),
  current_page text,
  current_entity_type text, -- 'project', 'task', 'document', etc.
  current_entity_id uuid,
  last_activity timestamp with time zone not null default now(),
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Таблица действий пользователей в реальном времени
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null references public.user_sessions(session_id) on delete cascade,
  activity_type text not null check (activity_type in (
    'viewing', 'editing', 'commenting', 'creating', 'deleting', 'moving', 'sharing'
  )),
  entity_type text not null, -- 'project', 'task', 'document', 'comment', etc.
  entity_id uuid not null,
  entity_name text,
  details jsonb default '{}',
  created_at timestamp with time zone not null default now()
);

-- Таблица для отслеживания одновременного редактирования
create table if not exists public.collaborative_locks (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null references public.user_sessions(session_id) on delete cascade,
  lock_type text not null default 'soft' check (lock_type in ('soft', 'hard')),
  acquired_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default (now() + interval '5 minutes'),
  metadata jsonb default '{}',
  unique(entity_type, entity_id, user_id)
);

-- Таблица для курсоров пользователей (для совместного редактирования)
create table if not exists public.user_cursors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null references public.user_sessions(session_id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  position jsonb not null, -- {x, y, field, etc.}
  color text not null default '#3b82f6',
  updated_at timestamp with time zone not null default now(),
  unique(session_id, entity_type, entity_id)
);

-- Индексы для производительности
create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
create index if not exists idx_user_sessions_status on public.user_sessions(status);
create index if not exists idx_user_sessions_last_activity on public.user_sessions(last_activity);
create index if not exists idx_user_activities_user_id on public.user_activities(user_id);
create index if not exists idx_user_activities_entity on public.user_activities(entity_type, entity_id);
create index if not exists idx_user_activities_created_at on public.user_activities(created_at desc);
create index if not exists idx_collaborative_locks_entity on public.collaborative_locks(entity_type, entity_id);
create index if not exists idx_collaborative_locks_expires_at on public.collaborative_locks(expires_at);
create index if not exists idx_user_cursors_entity on public.user_cursors(entity_type, entity_id);

-- Функция для автоматического обновления updated_at
create or replace function update_user_session_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Триггер для обновления updated_at
drop trigger if exists user_sessions_updated_at on public.user_sessions;
create trigger user_sessions_updated_at
  before update on public.user_sessions
  for each row
  execute function update_user_session_timestamp();

-- Функция для автоматической очистки старых сессий
create or replace function cleanup_inactive_sessions()
returns void as $$
begin
  -- Помечаем сессии как offline если нет активности более 5 минут
  update public.user_sessions
  set status = 'offline'
  where status != 'offline'
    and last_activity < now() - interval '5 minutes';
  
  -- Удаляем старые offline сессии (более 1 часа)
  delete from public.user_sessions
  where status = 'offline'
    and last_activity < now() - interval '1 hour';
  
  -- Удаляем истекшие блокировки
  delete from public.collaborative_locks
  where expires_at < now();
  
  -- Удаляем старые активности (более 24 часов)
  delete from public.user_activities
  where created_at < now() - interval '24 hours';
end;
$$ language plpgsql;

-- Функция для получения активных пользователей
create or replace function get_active_users(
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns table (
  user_id uuid,
  user_email text,
  user_name text,
  status text,
  activity text,
  last_activity timestamp with time zone,
  current_entity_type text,
  current_entity_id uuid
) as $$
begin
  return query
  select 
    s.user_id,
    u.email as user_email,
    coalesce(u.raw_user_meta_data->>'name', u.email) as user_name,
    s.status,
    case 
      when a.activity_type = 'editing' then 'Редактирует ' || coalesce(a.entity_name, a.entity_type)
      when a.activity_type = 'viewing' then 'Просматривает ' || coalesce(a.entity_name, a.entity_type)
      when a.activity_type = 'commenting' then 'Комментирует ' || coalesce(a.entity_name, a.entity_type)
      when a.activity_type = 'creating' then 'Создаёт ' || a.entity_type
      else 'Активен'
    end as activity,
    s.last_activity,
    s.current_entity_type,
    s.current_entity_id
  from public.user_sessions s
  join auth.users u on u.id = s.user_id
  left join lateral (
    select activity_type, entity_type, entity_name
    from public.user_activities
    where user_id = s.user_id
      and session_id = s.session_id
    order by created_at desc
    limit 1
  ) a on true
  where s.status in ('online', 'away')
    and s.last_activity > now() - interval '5 minutes'
    and (p_entity_type is null or s.current_entity_type = p_entity_type)
    and (p_entity_id is null or s.current_entity_id = p_entity_id)
  order by s.last_activity desc;
end;
$$ language plpgsql security definer;

-- Функция для обновления активности пользователя
create or replace function update_user_activity(
  p_session_id text,
  p_activity_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_entity_name text default null,
  p_details jsonb default '{}'
)
returns void as $$
declare
  v_user_id uuid;
begin
  -- Получаем user_id из сессии
  select user_id into v_user_id
  from public.user_sessions
  where session_id = p_session_id;
  
  if v_user_id is null then
    raise exception 'Session not found';
  end if;
  
  -- Обновляем сессию
  update public.user_sessions
  set 
    last_activity = now(),
    current_entity_type = p_entity_type,
    current_entity_id = p_entity_id,
    status = 'online'
  where session_id = p_session_id;
  
  -- Добавляем активность
  insert into public.user_activities (
    user_id,
    session_id,
    activity_type,
    entity_type,
    entity_id,
    entity_name,
    details
  ) values (
    v_user_id,
    p_session_id,
    p_activity_type,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_details
  );
end;
$$ language plpgsql security definer;

-- Функция для получения/создания блокировки
create or replace function acquire_collaborative_lock(
  p_entity_type text,
  p_entity_id uuid,
  p_session_id text,
  p_lock_type text default 'soft',
  p_duration_minutes int default 5
)
returns jsonb as $$
declare
  v_user_id uuid;
  v_existing_lock record;
  v_lock_id uuid;
begin
  -- Получаем user_id из сессии
  select user_id into v_user_id
  from public.user_sessions
  where session_id = p_session_id;
  
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Session not found');
  end if;
  
  -- Проверяем существующие блокировки
  select * into v_existing_lock
  from public.collaborative_locks
  where entity_type = p_entity_type
    and entity_id = p_entity_id
    and expires_at > now()
    and user_id != v_user_id
  limit 1;
  
  -- Если есть hard lock от другого пользователя, отказываем
  if v_existing_lock.lock_type = 'hard' then
    return jsonb_build_object(
      'success', false,
      'error', 'Entity is locked by another user',
      'locked_by', v_existing_lock.user_id
    );
  end if;
  
  -- Создаём или обновляем блокировку
  insert into public.collaborative_locks (
    entity_type,
    entity_id,
    user_id,
    session_id,
    lock_type,
    expires_at
  ) values (
    p_entity_type,
    p_entity_id,
    v_user_id,
    p_session_id,
    p_lock_type,
    now() + (p_duration_minutes || ' minutes')::interval
  )
  on conflict (entity_type, entity_id, user_id)
  do update set
    expires_at = now() + (p_duration_minutes || ' minutes')::interval,
    lock_type = p_lock_type
  returning id into v_lock_id;
  
  return jsonb_build_object(
    'success', true,
    'lock_id', v_lock_id,
    'expires_at', now() + (p_duration_minutes || ' minutes')::interval
  );
end;
$$ language plpgsql security definer;

-- RLS политики
alter table public.user_sessions enable row level security;
alter table public.user_activities enable row level security;
alter table public.collaborative_locks enable row level security;
alter table public.user_cursors enable row level security;

-- Политики для user_sessions
create policy "Users can view all active sessions"
  on public.user_sessions for select
  using (true);

create policy "Users can insert their own sessions"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.user_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.user_sessions for delete
  using (auth.uid() = user_id);

-- Политики для user_activities
create policy "Users can view all activities"
  on public.user_activities for select
  using (true);

create policy "Users can insert their own activities"
  on public.user_activities for insert
  with check (auth.uid() = user_id);

-- Политики для collaborative_locks
create policy "Users can view all locks"
  on public.collaborative_locks for select
  using (true);

create policy "Users can manage their own locks"
  on public.collaborative_locks for all
  using (auth.uid() = user_id);

-- Политики для user_cursors
create policy "Users can view all cursors"
  on public.user_cursors for select
  using (true);

create policy "Users can manage their own cursors"
  on public.user_cursors for all
  using (auth.uid() = user_id);

-- Включаем Realtime для таблиц
alter publication supabase_realtime add table public.user_sessions;
alter publication supabase_realtime add table public.user_activities;
alter publication supabase_realtime add table public.collaborative_locks;
alter publication supabase_realtime add table public.user_cursors;

-- Комментарии
comment on table public.user_sessions is 'Активные сессии пользователей для real-time collaboration';
comment on table public.user_activities is 'История активностей пользователей';
comment on table public.collaborative_locks is 'Блокировки для совместного редактирования';
comment on table public.user_cursors is 'Позиции курсоров пользователей';
