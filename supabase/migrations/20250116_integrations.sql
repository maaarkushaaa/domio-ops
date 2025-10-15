-- External Integrations System
-- Система интеграций с внешними сервисами

-- Таблица для настроек интеграций
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_type text not null check (integration_type in (
    'telegram', 'whatsapp', 'google_calendar', 'zapier', '1c', 
    'slack', 'discord', 'email', 'sms', 'webhook', 'custom'
  )),
  integration_name text not null,
  description text,
  is_active boolean not null default true,
  is_configured boolean not null default false,
  config jsonb not null default '{}', -- Конфигурация интеграции
  credentials jsonb default '{}', -- Зашифрованные учётные данные
  webhook_url text,
  webhook_secret text,
  rate_limit integer default 100, -- Запросов в час
  last_sync_at timestamp with time zone,
  last_error text,
  error_count integer not null default 0,
  success_count integer not null default 0,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(user_id, integration_type)
);

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
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  rule_name text not null,
  trigger_type text not null check (trigger_type in (
    'task_created', 'task_updated', 'task_completed', 'task_overdue',
    'project_created', 'project_updated', 'deadline_approaching',
    'document_uploaded', 'comment_added', 'schedule', 'webhook', 'custom'
  )),
  trigger_conditions jsonb default '{}',
  action_type text not null check (action_type in (
    'send_message', 'send_notification', 'create_event', 'sync_data',
    'call_webhook', 'run_script', 'custom'
  )),
  action_config jsonb not null,
  is_active boolean not null default true,
  priority integer not null default 5 check (priority >= 1 and priority <= 10),
  execution_count integer not null default 0,
  last_executed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

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
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  chat_id bigint not null,
  chat_type text not null check (chat_type in ('private', 'group', 'supergroup', 'channel')),
  chat_title text,
  username text,
  is_active boolean not null default true,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  unique(integration_id, chat_id)
);

-- Таблица для Google Calendar событий
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  event_id text not null, -- ID события в Google Calendar
  task_id uuid references public.tasks(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  attendees jsonb default '[]',
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'error')),
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(integration_id, event_id)
);

-- Таблица для Zapier Zaps
create table if not exists public.zapier_zaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  zap_id text not null,
  zap_name text not null,
  trigger_app text not null,
  action_app text not null,
  is_active boolean not null default true,
  execution_count integer not null default 0,
  last_executed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  unique(integration_id, zap_id)
);

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
