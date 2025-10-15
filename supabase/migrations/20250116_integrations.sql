-- External Integrations System
-- Система интеграций с внешними сервисами

-- Таблица для настроек интеграций
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  integration_type text not null,
  integration_name text not null,
  is_active boolean not null default true,
  is_configured boolean not null default false,
  config jsonb not null default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Расширение таблицы integrations
do $$
begin
  -- Добавляем user_id если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'user_id') then
    alter table public.integrations add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  
  -- Добавляем description если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'description') then
    alter table public.integrations add column description text;
  end if;
  
  -- Добавляем credentials если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'credentials') then
    alter table public.integrations add column credentials jsonb default '{}';
  end if;
  
  -- Добавляем webhook_url если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'webhook_url') then
    alter table public.integrations add column webhook_url text;
  end if;
  
  -- Добавляем webhook_secret если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'webhook_secret') then
    alter table public.integrations add column webhook_secret text;
  end if;
  
  -- Добавляем rate_limit если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'rate_limit') then
    alter table public.integrations add column rate_limit integer default 100;
  end if;
  
  -- Добавляем last_sync_at если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'last_sync_at') then
    alter table public.integrations add column last_sync_at timestamp with time zone;
  end if;
  
  -- Добавляем last_error если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'last_error') then
    alter table public.integrations add column last_error text;
  end if;
  
  -- Добавляем error_count если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'error_count') then
    alter table public.integrations add column error_count integer not null default 0;
  end if;
  
  -- Добавляем success_count если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'success_count') then
    alter table public.integrations add column success_count integer not null default 0;
  end if;
  
  -- Добавляем metadata если нет
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integrations' and column_name = 'metadata') then
    alter table public.integrations add column metadata jsonb default '{}';
  end if;
  
  -- Добавляем unique constraint если нет (только если user_id существует)
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'integrations' 
    and column_name = 'user_id'
  ) and not exists (
    select 1 from pg_constraint 
    where conname = 'integrations_user_id_integration_type_key' 
    and conrelid = 'public.integrations'::regclass
  ) then
    -- Удаляем строки с NULL user_id перед добавлением constraint
    delete from public.integrations where user_id is null;
    
    -- Добавляем constraint
    alter table public.integrations add constraint integrations_user_id_integration_type_key unique (user_id, integration_type);
  end if;
end $$;

-- Таблица для событий интеграций
create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  event_type text not null check (event_type in (
    'message_sent', 'message_received', 'notification_sent', 
    'data_synced', 'webhook_triggered', 'error', 'custom'
  )),
  direction text not null check (direction in ('incoming', 'outgoing')),
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'success', 'failed', 'retrying'
  )),
  payload jsonb not null,
  response jsonb,
  error_message text,
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  processed_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- Таблица для правил автоматизации
create table if not exists public.integration_rules (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  rule_name text not null,
  action_config jsonb not null,
  is_active boolean not null default true,
  priority integer not null default 5 check (priority >= 1 and priority <= 10),
  execution_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Расширение таблицы integration_rules
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integration_rules' and column_name = 'user_id') then
    alter table public.integration_rules add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integration_rules' and column_name = 'trigger_type') then
    alter table public.integration_rules add column trigger_type text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integration_rules' and column_name = 'trigger_conditions') then
    alter table public.integration_rules add column trigger_conditions jsonb default '{}';
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integration_rules' and column_name = 'action_type') then
    alter table public.integration_rules add column action_type text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integration_rules' and column_name = 'last_executed_at') then
    alter table public.integration_rules add column last_executed_at timestamp with time zone;
  end if;
end $$;

-- Таблица для логов выполнения правил
create table if not exists public.rule_execution_logs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.integration_rules(id) on delete cascade,
  trigger_data jsonb not null,
  status text not null check (status in ('success', 'failed', 'skipped')),
  result jsonb,
  error_message text,
  execution_time_ms integer,
  created_at timestamp with time zone not null default now()
);

-- Таблица для Telegram чатов
create table if not exists public.telegram_chats (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  chat_id bigint not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- Расширение таблицы telegram_chats
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'telegram_chats' and column_name = 'user_id') then
    alter table public.telegram_chats add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'telegram_chats' and column_name = 'chat_type') then
    alter table public.telegram_chats add column chat_type text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'telegram_chats' and column_name = 'chat_title') then
    alter table public.telegram_chats add column chat_title text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'telegram_chats' and column_name = 'username') then
    alter table public.telegram_chats add column username text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'telegram_chats' and column_name = 'last_message_at') then
    alter table public.telegram_chats add column last_message_at timestamp with time zone;
  end if;
end $$;

-- Добавляем unique constraint для telegram_chats отдельно
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'telegram_chats' and column_name = 'integration_id'
  ) and exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'telegram_chats' and column_name = 'chat_id'
  ) and not exists (
    select 1 from pg_constraint 
    where conname = 'telegram_chats_integration_id_chat_id_key' 
    and conrelid = 'public.telegram_chats'::regclass
  ) then
    alter table public.telegram_chats add constraint telegram_chats_integration_id_chat_id_key unique (integration_id, chat_id);
  end if;
end $$;

-- Таблица для Google Calendar событий
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  event_id text not null,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  sync_status text not null default 'synced',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Расширение таблицы calendar_events
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'user_id') then
    alter table public.calendar_events add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'task_id') then
    alter table public.calendar_events add column task_id uuid references public.tasks(id) on delete set null;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'project_id') then
    alter table public.calendar_events add column project_id uuid references public.projects(id) on delete set null;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'description') then
    alter table public.calendar_events add column description text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'location') then
    alter table public.calendar_events add column location text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'attendees') then
    alter table public.calendar_events add column attendees jsonb default '[]';
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'last_synced_at') then
    alter table public.calendar_events add column last_synced_at timestamp with time zone;
  end if;
end $$;

-- Добавляем unique constraint для calendar_events отдельно
do $$
begin
  -- Проверяем что оба поля существуют перед добавлением constraint
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'integration_id'
  ) and exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'calendar_events' and column_name = 'event_id'
  ) and not exists (
    select 1 from pg_constraint 
    where conname = 'calendar_events_integration_id_event_id_key' 
    and conrelid = 'public.calendar_events'::regclass
  ) then
    alter table public.calendar_events add constraint calendar_events_integration_id_event_id_key unique (integration_id, event_id);
  end if;
end $$;

-- Таблица для Zapier Zaps
create table if not exists public.zapier_zaps (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  zap_id text not null,
  zap_name text not null,
  is_active boolean not null default true,
  execution_count integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Расширение таблицы zapier_zaps
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'zapier_zaps' and column_name = 'user_id') then
    alter table public.zapier_zaps add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'zapier_zaps' and column_name = 'trigger_app') then
    alter table public.zapier_zaps add column trigger_app text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'zapier_zaps' and column_name = 'action_app') then
    alter table public.zapier_zaps add column action_app text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'zapier_zaps' and column_name = 'last_executed_at') then
    alter table public.zapier_zaps add column last_executed_at timestamp with time zone;
  end if;
end $$;

-- Добавляем unique constraint для zapier_zaps отдельно
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'zapier_zaps' and column_name = 'integration_id'
  ) and exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'zapier_zaps' and column_name = 'zap_id'
  ) and not exists (
    select 1 from pg_constraint 
    where conname = 'zapier_zaps_integration_id_zap_id_key' 
    and conrelid = 'public.zapier_zaps'::regclass
  ) then
    alter table public.zapier_zaps add constraint zapier_zaps_integration_id_zap_id_key unique (integration_id, zap_id);
  end if;
end $$;

-- Индексы для производительности
create index if not exists idx_integrations_user_id on public.integrations(user_id);
create index if not exists idx_integrations_type on public.integrations(integration_type);
create index if not exists idx_integrations_is_active on public.integrations(is_active);
create index if not exists idx_integration_events_integration_id on public.integration_events(integration_id);
create index if not exists idx_integration_events_status on public.integration_events(status);
create index if not exists idx_integration_events_created_at on public.integration_events(created_at desc);
create index if not exists idx_integration_rules_user_id on public.integration_rules(user_id);
create index if not exists idx_integration_rules_integration_id on public.integration_rules(integration_id);
create index if not exists idx_integration_rules_is_active on public.integration_rules(is_active);
create index if not exists idx_rule_execution_logs_rule_id on public.rule_execution_logs(rule_id);
create index if not exists idx_telegram_chats_user_id on public.telegram_chats(user_id);
create index if not exists idx_calendar_events_user_id on public.calendar_events(user_id);
create index if not exists idx_calendar_events_task_id on public.calendar_events(task_id);
create index if not exists idx_zapier_zaps_user_id on public.zapier_zaps(user_id);

-- Функция для автоматического обновления updated_at
create or replace function update_integration_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Триггеры для обновления updated_at
drop trigger if exists integrations_updated_at on public.integrations;
create trigger integrations_updated_at
  before update on public.integrations
  for each row
  execute function update_integration_timestamp();

drop trigger if exists integration_rules_updated_at on public.integration_rules;
create trigger integration_rules_updated_at
  before update on public.integration_rules
  for each row
  execute function update_integration_timestamp();

drop trigger if exists calendar_events_updated_at on public.calendar_events;
create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row
  execute function update_integration_timestamp();

-- Функция для создания события интеграции
create or replace function create_integration_event(
  p_integration_id uuid,
  p_event_type text,
  p_direction text,
  p_payload jsonb
)
returns uuid as $$
declare
  v_event_id uuid;
begin
  insert into public.integration_events (
    integration_id,
    event_type,
    direction,
    payload
  ) values (
    p_integration_id,
    p_event_type,
    p_direction,
    p_payload
  ) returning id into v_event_id;
  
  return v_event_id;
end;
$$ language plpgsql security definer;

-- Функция для обновления статуса события
create or replace function update_event_status(
  p_event_id uuid,
  p_status text,
  p_response jsonb default null,
  p_error_message text default null
)
returns void as $$
begin
  update public.integration_events
  set 
    status = p_status,
    response = p_response,
    error_message = p_error_message,
    processed_at = case when p_status in ('success', 'failed') then now() else processed_at end
  where id = p_event_id;
  
  -- Обновляем счётчики интеграции
  if p_status = 'success' then
    update public.integrations
    set 
      success_count = success_count + 1,
      last_sync_at = now(),
      error_count = 0,
      last_error = null
    where id = (select integration_id from public.integration_events where id = p_event_id);
  elsif p_status = 'failed' then
    update public.integrations
    set 
      error_count = error_count + 1,
      last_error = p_error_message
    where id = (select integration_id from public.integration_events where id = p_event_id);
  end if;
end;
$$ language plpgsql security definer;

-- Функция для выполнения правила автоматизации
create or replace function execute_integration_rule(
  p_rule_id uuid,
  p_trigger_data jsonb
)
returns uuid as $$
declare
  v_rule record;
  v_log_id uuid;
  v_start_time timestamp;
  v_execution_time integer;
begin
  v_start_time := clock_timestamp();
  
  -- Получаем правило
  select * into v_rule
  from public.integration_rules
  where id = p_rule_id
    and is_active = true;
  
  if not found then
    return null;
  end if;
  
  -- Создаём лог выполнения
  insert into public.rule_execution_logs (
    rule_id,
    trigger_data,
    status
  ) values (
    p_rule_id,
    p_trigger_data,
    'success'
  ) returning id into v_log_id;
  
  -- Вычисляем время выполнения
  v_execution_time := extract(epoch from (clock_timestamp() - v_start_time))::integer * 1000;
  
  -- Обновляем лог
  update public.rule_execution_logs
  set execution_time_ms = v_execution_time
  where id = v_log_id;
  
  -- Обновляем правило
  update public.integration_rules
  set 
    execution_count = execution_count + 1,
    last_executed_at = now()
  where id = p_rule_id;
  
  return v_log_id;
end;
$$ language plpgsql security definer;

-- Функция для получения статистики интеграций
create or replace function get_integration_stats(
  p_user_id uuid
)
returns jsonb as $$
declare
  v_stats jsonb;
begin
  select jsonb_build_object(
    'total_integrations', count(*),
    'active_integrations', count(*) filter (where is_active = true),
    'configured_integrations', count(*) filter (where is_configured = true),
    'total_events', (
      select count(*)
      from public.integration_events ie
      join public.integrations i on i.id = ie.integration_id
      where i.user_id = p_user_id
    ),
    'successful_events', (
      select count(*)
      from public.integration_events ie
      join public.integrations i on i.id = ie.integration_id
      where i.user_id = p_user_id
        and ie.status = 'success'
    ),
    'failed_events', (
      select count(*)
      from public.integration_events ie
      join public.integrations i on i.id = ie.integration_id
      where i.user_id = p_user_id
        and ie.status = 'failed'
    ),
    'active_rules', (
      select count(*)
      from public.integration_rules
      where user_id = p_user_id
        and is_active = true
    ),
    'by_type', (
      select jsonb_object_agg(
        integration_type,
        jsonb_build_object(
          'count', cnt,
          'active', active_cnt,
          'success_count', success_sum
        )
      )
      from (
        select 
          integration_type,
          count(*) as cnt,
          count(*) filter (where is_active = true) as active_cnt,
          sum(success_count) as success_sum
        from public.integrations
        where user_id = p_user_id
        group by integration_type
      ) t
    )
  ) into v_stats
  from public.integrations
  where user_id = p_user_id;
  
  return v_stats;
end;
$$ language plpgsql security definer;

-- Функция для отправки Telegram сообщения
create or replace function send_telegram_message(
  p_integration_id uuid,
  p_chat_id bigint,
  p_message text,
  p_parse_mode text default 'HTML'
)
returns uuid as $$
declare
  v_event_id uuid;
begin
  -- Создаём событие
  v_event_id := create_integration_event(
    p_integration_id,
    'message_sent',
    'outgoing',
    jsonb_build_object(
      'chat_id', p_chat_id,
      'text', p_message,
      'parse_mode', p_parse_mode
    )
  );
  
  return v_event_id;
end;
$$ language plpgsql security definer;

-- Функция для создания Google Calendar события
create or replace function create_calendar_event(
  p_user_id uuid,
  p_integration_id uuid,
  p_title text,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_description text default null,
  p_task_id uuid default null
)
returns uuid as $$
declare
  v_event_id uuid;
  v_google_event_id text;
begin
  -- Генерируем временный ID (в реальности будет получен от Google API)
  v_google_event_id := 'evt_' || encode(gen_random_bytes(16), 'hex');
  
  -- Создаём событие
  insert into public.calendar_events (
    user_id,
    integration_id,
    event_id,
    task_id,
    title,
    description,
    start_time,
    end_time,
    sync_status
  ) values (
    p_user_id,
    p_integration_id,
    v_google_event_id,
    p_task_id,
    p_title,
    p_description,
    p_start_time,
    p_end_time,
    'pending'
  ) returning id into v_event_id;
  
  -- Создаём событие интеграции
  perform create_integration_event(
    p_integration_id,
    'data_synced',
    'outgoing',
    jsonb_build_object(
      'event_id', v_event_id,
      'title', p_title,
      'start_time', p_start_time
    )
  );
  
  return v_event_id;
end;
$$ language plpgsql security definer;

-- RLS политики
alter table public.integrations enable row level security;
alter table public.integration_events enable row level security;
alter table public.integration_rules enable row level security;
alter table public.rule_execution_logs enable row level security;
alter table public.telegram_chats enable row level security;
alter table public.calendar_events enable row level security;
alter table public.zapier_zaps enable row level security;

-- Политики для integrations
create policy "Users can view their own integrations"
  on public.integrations for select
  using (auth.uid() = user_id);

create policy "Users can manage their own integrations"
  on public.integrations for all
  using (auth.uid() = user_id);

-- Политики для integration_events
create policy "Users can view events of their integrations"
  on public.integration_events for select
  using (
    exists (
      select 1 from public.integrations
      where id = integration_events.integration_id
        and user_id = auth.uid()
    )
  );

-- Политики для integration_rules
create policy "Users can view their own rules"
  on public.integration_rules for select
  using (auth.uid() = user_id);

create policy "Users can manage their own rules"
  on public.integration_rules for all
  using (auth.uid() = user_id);

-- Политики для rule_execution_logs
create policy "Users can view logs of their rules"
  on public.rule_execution_logs for select
  using (
    exists (
      select 1 from public.integration_rules
      where id = rule_execution_logs.rule_id
        and user_id = auth.uid()
    )
  );

-- Политики для telegram_chats
create policy "Users can view their own telegram chats"
  on public.telegram_chats for select
  using (auth.uid() = user_id);

create policy "Users can manage their own telegram chats"
  on public.telegram_chats for all
  using (auth.uid() = user_id);

-- Политики для calendar_events
create policy "Users can view their own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can manage their own calendar events"
  on public.calendar_events for all
  using (auth.uid() = user_id);

-- Политики для zapier_zaps
create policy "Users can view their own zaps"
  on public.zapier_zaps for select
  using (auth.uid() = user_id);

create policy "Users can manage their own zaps"
  on public.zapier_zaps for all
  using (auth.uid() = user_id);

-- Комментарии
comment on table public.integrations is 'Настройки интеграций с внешними сервисами';
comment on table public.integration_events is 'События интеграций';
comment on table public.integration_rules is 'Правила автоматизации';
comment on table public.rule_execution_logs is 'Логи выполнения правил';
comment on table public.telegram_chats is 'Telegram чаты';
comment on table public.calendar_events is 'События Google Calendar';
comment on table public.zapier_zaps is 'Zapier Zaps';
