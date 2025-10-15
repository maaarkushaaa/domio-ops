-- Integrations & Security System
-- Система интеграций (Telegram, WhatsApp, Google Calendar, Zapier, 1С) и корпоративной безопасности

-- ============================================================================
-- ИНТЕГРАЦИИ
-- ============================================================================

-- Конфигурация интеграций
create table if not exists public.integration_configs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('telegram', 'whatsapp', 'google_calendar', 'zapier', '1c', 'email', 'slack')),
  enabled boolean not null default false,
  config jsonb not null default '{}', -- API keys, tokens, settings
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Webhook endpoints
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  secret text, -- для верификации подписи
  events text[] not null default '{}', -- ['task.created', 'project.updated', etc]
  enabled boolean not null default true,
  headers jsonb default '{}', -- дополнительные заголовки
  retry_count integer default 3,
  timeout_seconds integer default 30,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Добавление недостающих полей если таблица уже существует
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'webhooks' and column_name = 'created_by') then
    alter table public.webhooks add column created_by uuid references auth.users(id) on delete cascade;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'webhooks' and column_name = 'events') then
    alter table public.webhooks add column events text[] default '{}';
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'webhooks' and column_name = 'headers') then
    alter table public.webhooks add column headers jsonb default '{}';
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'webhooks' and column_name = 'retry_count') then
    alter table public.webhooks add column retry_count integer default 3;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'webhooks' and column_name = 'timeout_seconds') then
    alter table public.webhooks add column timeout_seconds integer default 30;
  end if;
end $$;

-- Лог вызовов webhooks
create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  response_status integer,
  response_body text,
  error text,
  duration_ms integer,
  created_at timestamp with time zone not null default now()
);

-- Telegram интеграция
create table if not exists public.telegram_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  telegram_id bigint not null unique,
  telegram_username text,
  chat_id bigint,
  notifications_enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- WhatsApp интеграция
create table if not exists public.whatsapp_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  phone_number text not null unique,
  whatsapp_id text unique,
  notifications_enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Google Calendar синхронизация
create table if not exists public.google_calendar_sync (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  google_calendar_id text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamp with time zone not null,
  sync_enabled boolean not null default true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- 1С интеграция
create table if not exists public.onec_sync (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client', 'project', 'invoice', 'payment', 'product')),
  entity_id uuid not null,
  onec_id text not null,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'error')),
  last_sync_at timestamp with time zone,
  error_message text,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (entity_type, entity_id)
);

-- Zapier интеграция (триггеры и действия)
create table if not exists public.zapier_triggers (
  id uuid primary key default gen_random_uuid(),
  trigger_type text not null,
  zap_id text not null,
  webhook_url text not null,
  enabled boolean not null default true,
  filters jsonb default '{}',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

-- ============================================================================
-- БЕЗОПАСНОСТЬ
-- ============================================================================

-- Двухфакторная аутентификация (2FA)
create table if not exists public.user_2fa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  method text not null check (method in ('totp', 'sms', 'email')),
  secret text not null, -- TOTP secret или хеш для SMS/Email
  enabled boolean not null default false,
  backup_codes text[], -- резервные коды
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Аудит безопасности
create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('login', 'logout', 'failed_login', 'password_change', '2fa_enabled', '2fa_disabled', 'api_key_created', 'api_key_revoked', 'permission_changed', 'data_export', 'data_delete')),
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}',
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  created_at timestamp with time zone not null default now()
);

-- API ключи для внешних интеграций
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_hash text not null unique, -- bcrypt hash ключа
  user_id uuid not null references auth.users(id) on delete cascade,
  scopes text[] not null default '{}', -- ['read:tasks', 'write:projects', etc]
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone,
  revoked boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Сессии пользователей
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_token text not null unique,
  ip_address inet,
  user_agent text,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now()
);

-- IP whitelist/blacklist
create table if not exists public.ip_access_control (
  id uuid primary key default gen_random_uuid(),
  ip_address inet not null unique,
  type text not null check (type in ('whitelist', 'blacklist')),
  reason text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

-- Шифрование данных (ключи для field-level encryption)
create table if not exists public.encryption_keys (
  id uuid primary key default gen_random_uuid(),
  key_name text not null unique,
  key_hash text not null, -- зашифрованный ключ
  algorithm text not null default 'AES-256-GCM',
  created_at timestamp with time zone not null default now(),
  rotated_at timestamp with time zone
);

-- ============================================================================
-- ИНДЕКСЫ
-- ============================================================================

create index if not exists integration_configs_name_idx on public.integration_configs (name);
create index if not exists webhooks_enabled_idx on public.webhooks (enabled);
create index if not exists webhook_logs_webhook_idx on public.webhook_logs (webhook_id, created_at desc);
create index if not exists telegram_users_telegram_id_idx on public.telegram_users (telegram_id);
create index if not exists whatsapp_users_phone_idx on public.whatsapp_users (phone_number);
create index if not exists google_calendar_user_idx on public.google_calendar_sync (user_id);
create index if not exists onec_sync_entity_idx on public.onec_sync (entity_type, entity_id);
create index if not exists onec_sync_status_idx on public.onec_sync (sync_status);
create index if not exists security_audit_user_idx on public.security_audit_log (user_id, created_at desc);
create index if not exists security_audit_action_idx on public.security_audit_log (action, created_at desc);
create index if not exists api_keys_user_idx on public.api_keys (user_id);
create index if not exists api_keys_hash_idx on public.api_keys (key_hash) where not revoked;
create index if not exists user_sessions_token_idx on public.user_sessions (session_token);
create index if not exists user_sessions_expires_idx on public.user_sessions (expires_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

alter table public.integration_configs enable row level security;
alter table public.webhooks enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.telegram_users enable row level security;
alter table public.whatsapp_users enable row level security;
alter table public.google_calendar_sync enable row level security;
alter table public.onec_sync enable row level security;
alter table public.zapier_triggers enable row level security;
alter table public.user_2fa enable row level security;
alter table public.security_audit_log enable row level security;
alter table public.api_keys enable row level security;
alter table public.user_sessions enable row level security;
alter table public.ip_access_control enable row level security;
alter table public.encryption_keys enable row level security;

-- Integration configs - только админы
drop policy if exists integration_configs_admin_all on public.integration_configs;
create policy integration_configs_admin_all on public.integration_configs for all using (
  exists (select 1 from auth.users where id = auth.uid() and role = 'admin')
);

-- Webhooks - создатель или админ
drop policy if exists webhooks_select_all on public.webhooks;
create policy webhooks_select_all on public.webhooks for select using (auth.role() = 'authenticated');

drop policy if exists webhooks_manage_owner on public.webhooks;
create policy webhooks_manage_owner on public.webhooks for all using (auth.uid() = created_by);

-- Telegram/WhatsApp - только свои данные
drop policy if exists telegram_users_own on public.telegram_users;
create policy telegram_users_own on public.telegram_users for all using (auth.uid() = user_id);

drop policy if exists whatsapp_users_own on public.whatsapp_users;
create policy whatsapp_users_own on public.whatsapp_users for all using (auth.uid() = user_id);

drop policy if exists google_calendar_own on public.google_calendar_sync;
create policy google_calendar_own on public.google_calendar_sync for all using (auth.uid() = user_id);

-- 2FA - только свои данные
drop policy if exists user_2fa_own on public.user_2fa;
create policy user_2fa_own on public.user_2fa for all using (auth.uid() = user_id);

-- Security audit - админы читают все, пользователи только свои
drop policy if exists security_audit_select on public.security_audit_log;
create policy security_audit_select on public.security_audit_log for select using (
  auth.uid() = user_id or exists (select 1 from auth.users where id = auth.uid() and role = 'admin')
);

-- API keys - только свои
drop policy if exists api_keys_own on public.api_keys;
create policy api_keys_own on public.api_keys for all using (auth.uid() = user_id);

-- ============================================================================
-- ФУНКЦИИ
-- ============================================================================

-- Автообновление updated_at
create or replace function update_integrations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_integration_configs_updated_at_trigger on public.integration_configs;
create trigger update_integration_configs_updated_at_trigger
  before update on public.integration_configs
  for each row execute function update_integrations_updated_at();

drop trigger if exists update_webhooks_updated_at_trigger on public.webhooks;
create trigger update_webhooks_updated_at_trigger
  before update on public.webhooks
  for each row execute function update_integrations_updated_at();

drop trigger if exists update_telegram_users_updated_at_trigger on public.telegram_users;
create trigger update_telegram_users_updated_at_trigger
  before update on public.telegram_users
  for each row execute function update_integrations_updated_at();

drop trigger if exists update_whatsapp_users_updated_at_trigger on public.whatsapp_users;
create trigger update_whatsapp_users_updated_at_trigger
  before update on public.whatsapp_users
  for each row execute function update_integrations_updated_at();

drop trigger if exists update_google_calendar_updated_at_trigger on public.google_calendar_sync;
create trigger update_google_calendar_updated_at_trigger
  before update on public.google_calendar_sync
  for each row execute function update_integrations_updated_at();

drop trigger if exists update_onec_sync_updated_at_trigger on public.onec_sync;
create trigger update_onec_sync_updated_at_trigger
  before update on public.onec_sync
  for each row execute function update_integrations_updated_at();

drop trigger if exists update_user_2fa_updated_at_trigger on public.user_2fa;
create trigger update_user_2fa_updated_at_trigger
  before update on public.user_2fa
  for each row execute function update_integrations_updated_at();

-- Функция для логирования в security_audit_log
create or replace function log_security_event(
  p_action text,
  p_metadata jsonb default '{}'::jsonb,
  p_severity text default 'info'
)
returns void as $$
begin
  insert into public.security_audit_log (user_id, action, ip_address, metadata, severity)
  values (
    auth.uid(),
    p_action,
    inet_client_addr(),
    p_metadata,
    p_severity
  );
end;
$$ language plpgsql security definer;

-- Функция для очистки истекших сессий
create or replace function cleanup_expired_sessions()
returns void as $$
begin
  delete from public.user_sessions where expires_at < now();
end;
$$ language plpgsql security definer;

-- ============================================================================
-- REALTIME
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'integration_configs') then
    alter publication supabase_realtime add table public.integration_configs;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'webhooks') then
    alter publication supabase_realtime add table public.webhooks;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'webhook_logs') then
    alter publication supabase_realtime add table public.webhook_logs;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'telegram_users') then
    alter publication supabase_realtime add table public.telegram_users;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'whatsapp_users') then
    alter publication supabase_realtime add table public.whatsapp_users;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'google_calendar_sync') then
    alter publication supabase_realtime add table public.google_calendar_sync;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'onec_sync') then
    alter publication supabase_realtime add table public.onec_sync;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'security_audit_log') then
    alter publication supabase_realtime add table public.security_audit_log;
  end if;
end $$;

-- ============================================================================
-- ДЕМО-ДАННЫЕ
-- ============================================================================

-- Конфигурации интеграций (disabled по умолчанию)
insert into public.integration_configs (name, enabled, config, created_by) 
select 
  unnest(array['telegram', 'whatsapp', 'google_calendar', 'zapier', '1c', 'email', 'slack']),
  false,
  '{}'::jsonb,
  (select id from auth.users limit 1)
on conflict (name) do nothing;
