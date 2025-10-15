-- Advanced Security System
-- Система корпоративной безопасности

-- Таблица для 2FA (Two-Factor Authentication)
create table if not exists public.user_2fa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  secret text, -- TOTP secret (encrypted)
  backup_codes text[], -- Резервные коды (encrypted)
  method text not null default 'totp' check (method in ('totp', 'sms', 'email')),
  phone_number text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Таблица для API ключей
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null unique, -- SHA-256 hash ключа
  key_prefix text not null, -- Первые 8 символов для идентификации
  permissions jsonb not null default '[]', -- ['read', 'write', 'delete', etc.]
  rate_limit integer not null default 1000, -- Запросов в час
  allowed_ips text[], -- Разрешённые IP адреса
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone,
  usage_count integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Таблица для аудита доступа
create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'login', 'logout', 'login_failed', 'password_change', 'password_reset',
    '2fa_enabled', '2fa_disabled', '2fa_verified', '2fa_failed',
    'api_key_created', 'api_key_deleted', 'api_key_used',
    'permission_granted', 'permission_revoked',
    'data_access', 'data_modification', 'data_deletion',
    'suspicious_activity', 'security_breach'
  )),
  severity text not null default 'info' check (severity in ('info', 'warning', 'error', 'critical')),
  description text not null,
  ip_address inet,
  user_agent text,
  location jsonb, -- {country, city, lat, lon}
  resource_type text,
  resource_id uuid,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now()
);

-- Таблица для отслеживания подозрительной активности
create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  alert_type text not null check (alert_type in (
    'multiple_failed_logins', 'unusual_location', 'unusual_time',
    'rate_limit_exceeded', 'suspicious_api_usage', 'data_breach_attempt',
    'privilege_escalation', 'unauthorized_access'
  )),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  description text not null,
  details jsonb not null default '{}',
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'false_positive')),
  resolved_at timestamp with time zone,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Таблица для IP whitelist/blacklist
create table if not exists public.ip_access_control (
  id uuid primary key default gen_random_uuid(),
  ip_address inet not null unique,
  type text not null check (type in ('whitelist', 'blacklist')),
  reason text,
  added_by uuid references auth.users(id) on delete set null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- Таблица для хранения настроек безопасности
create table if not exists public.security_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  organization_id uuid, -- Для корпоративных настроек
  require_2fa boolean not null default false,
  password_expiry_days integer default 90,
  max_login_attempts integer not null default 5,
  lockout_duration_minutes integer not null default 30,
  session_timeout_minutes integer not null default 480, -- 8 часов
  require_password_change boolean not null default false,
  allowed_ip_ranges text[],
  require_device_verification boolean not null default false,
  enable_audit_log boolean not null default true,
  data_encryption_enabled boolean not null default true,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Индексы для производительности
create index if not exists idx_user_2fa_user_id on public.user_2fa(user_id);
create index if not exists idx_api_keys_user_id on public.api_keys(user_id);
create index if not exists idx_api_keys_key_hash on public.api_keys(key_hash);
create index if not exists idx_api_keys_is_active on public.api_keys(is_active);
create index if not exists idx_security_audit_log_user_id on public.security_audit_log(user_id);
create index if not exists idx_security_audit_log_event_type on public.security_audit_log(event_type);
create index if not exists idx_security_audit_log_created_at on public.security_audit_log(created_at desc);
create index if not exists idx_security_audit_log_severity on public.security_audit_log(severity);
create index if not exists idx_security_alerts_user_id on public.security_alerts(user_id);
create index if not exists idx_security_alerts_status on public.security_alerts(status);
create index if not exists idx_security_alerts_severity on public.security_alerts(severity);
create index if not exists idx_ip_access_control_ip on public.ip_access_control(ip_address);
create index if not exists idx_security_settings_user_id on public.security_settings(user_id);

-- Функция для автоматического обновления updated_at
create or replace function update_security_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Триггеры для обновления updated_at
drop trigger if exists user_2fa_updated_at on public.user_2fa;
create trigger user_2fa_updated_at
  before update on public.user_2fa
  for each row
  execute function update_security_timestamp();

drop trigger if exists api_keys_updated_at on public.api_keys;
create trigger api_keys_updated_at
  before update on public.api_keys
  for each row
  execute function update_security_timestamp();

drop trigger if exists security_alerts_updated_at on public.security_alerts;
create trigger security_alerts_updated_at
  before update on public.security_alerts
  for each row
  execute function update_security_timestamp();

drop trigger if exists security_settings_updated_at on public.security_settings;
create trigger security_settings_updated_at
  before update on public.security_settings
  for each row
  execute function update_security_timestamp();

-- Функция для логирования событий безопасности
create or replace function log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_severity text,
  p_description text,
  p_ip_address inet default null,
  p_user_agent text default null,
  p_resource_type text default null,
  p_resource_id uuid default null,
  p_metadata jsonb default '{}'
)
returns uuid as $$
declare
  v_log_id uuid;
begin
  insert into public.security_audit_log (
    user_id,
    event_type,
    severity,
    description,
    ip_address,
    user_agent,
    resource_type,
    resource_id,
    metadata
  ) values (
    p_user_id,
    p_event_type,
    p_severity,
    p_description,
    p_ip_address,
    p_user_agent,
    p_resource_type,
    p_resource_id,
    p_metadata
  ) returning id into v_log_id;
  
  return v_log_id;
end;
$$ language plpgsql security definer;

-- Функция для создания алерта безопасности
create or replace function create_security_alert(
  p_user_id uuid,
  p_alert_type text,
  p_severity text,
  p_description text,
  p_details jsonb default '{}'
)
returns uuid as $$
declare
  v_alert_id uuid;
begin
  insert into public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    details
  ) values (
    p_user_id,
    p_alert_type,
    p_severity,
    p_description,
    p_details
  ) returning id into v_alert_id;
  
  -- Также логируем в аудит
  perform log_security_event(
    p_user_id,
    'suspicious_activity',
    p_severity,
    p_description,
    null,
    null,
    'security_alert',
    v_alert_id,
    p_details
  );
  
  return v_alert_id;
end;
$$ language plpgsql security definer;

-- Функция для генерации API ключа
create or replace function generate_api_key(
  p_user_id uuid,
  p_name text,
  p_permissions jsonb default '["read"]',
  p_rate_limit integer default 1000,
  p_expires_days integer default null
)
returns jsonb as $$
declare
  v_key text;
  v_key_hash text;
  v_key_prefix text;
  v_key_id uuid;
  v_expires_at timestamp with time zone;
begin
  -- Генерируем случайный ключ (32 байта = 64 hex символа)
  v_key := 'sk_' || encode(gen_random_bytes(32), 'hex');
  v_key_hash := encode(digest(v_key, 'sha256'), 'hex');
  v_key_prefix := substring(v_key, 1, 11); -- 'sk_' + 8 символов
  
  -- Вычисляем дату истечения
  if p_expires_days is not null then
    v_expires_at := now() + (p_expires_days || ' days')::interval;
  end if;
  
  -- Сохраняем ключ
  insert into public.api_keys (
    user_id,
    name,
    key_hash,
    key_prefix,
    permissions,
    rate_limit,
    expires_at
  ) values (
    p_user_id,
    p_name,
    v_key_hash,
    v_key_prefix,
    p_permissions,
    p_rate_limit,
    v_expires_at
  ) returning id into v_key_id;
  
  -- Логируем создание ключа
  perform log_security_event(
    p_user_id,
    'api_key_created',
    'info',
    'API key created: ' || p_name,
    null,
    null,
    'api_key',
    v_key_id,
    jsonb_build_object('key_prefix', v_key_prefix, 'permissions', p_permissions)
  );
  
  -- Возвращаем ключ (ТОЛЬКО ОДИН РАЗ!)
  return jsonb_build_object(
    'key_id', v_key_id,
    'key', v_key,
    'key_prefix', v_key_prefix,
    'expires_at', v_expires_at
  );
end;
$$ language plpgsql security definer;

-- Функция для валидации API ключа
create or replace function validate_api_key(
  p_key text,
  p_ip_address inet default null
)
returns jsonb as $$
declare
  v_key_hash text;
  v_api_key record;
begin
  v_key_hash := encode(digest(p_key, 'sha256'), 'hex');
  
  -- Находим ключ
  select * into v_api_key
  from public.api_keys
  where key_hash = v_key_hash
    and is_active = true
    and (expires_at is null or expires_at > now());
  
  if not found then
    return jsonb_build_object('valid', false, 'error', 'Invalid or expired API key');
  end if;
  
  -- Проверяем IP whitelist
  if v_api_key.allowed_ips is not null and array_length(v_api_key.allowed_ips, 1) > 0 then
    if p_ip_address is null or not (p_ip_address::text = any(v_api_key.allowed_ips)) then
      perform log_security_event(
        v_api_key.user_id,
        'api_key_used',
        'warning',
        'API key used from unauthorized IP',
        p_ip_address,
        null,
        'api_key',
        v_api_key.id,
        jsonb_build_object('allowed_ips', v_api_key.allowed_ips, 'actual_ip', p_ip_address)
      );
      return jsonb_build_object('valid', false, 'error', 'IP address not allowed');
    end if;
  end if;
  
  -- Обновляем статистику использования
  update public.api_keys
  set 
    last_used_at = now(),
    usage_count = usage_count + 1
  where id = v_api_key.id;
  
  -- Логируем использование
  perform log_security_event(
    v_api_key.user_id,
    'api_key_used',
    'info',
    'API key used: ' || v_api_key.name,
    p_ip_address,
    null,
    'api_key',
    v_api_key.id,
    jsonb_build_object('key_prefix', v_api_key.key_prefix)
  );
  
  return jsonb_build_object(
    'valid', true,
    'user_id', v_api_key.user_id,
    'permissions', v_api_key.permissions,
    'rate_limit', v_api_key.rate_limit
  );
end;
$$ language plpgsql security definer;

-- Функция для получения статистики безопасности
create or replace function get_security_stats(
  p_user_id uuid default null,
  p_days integer default 30
)
returns jsonb as $$
declare
  v_stats jsonb;
begin
  select jsonb_build_object(
    'total_events', count(*),
    'by_severity', jsonb_object_agg(
      severity,
      count(*)
    ),
    'by_event_type', (
      select jsonb_object_agg(event_type, cnt)
      from (
        select event_type, count(*) as cnt
        from public.security_audit_log
        where (p_user_id is null or user_id = p_user_id)
          and created_at > now() - (p_days || ' days')::interval
        group by event_type
        order by cnt desc
        limit 10
      ) t
    ),
    'active_alerts', (
      select count(*)
      from public.security_alerts
      where (p_user_id is null or user_id = p_user_id)
        and status = 'open'
    ),
    'api_keys_count', (
      select count(*)
      from public.api_keys
      where (p_user_id is null or user_id = p_user_id)
        and is_active = true
    )
  ) into v_stats
  from public.security_audit_log
  where (p_user_id is null or user_id = p_user_id)
    and created_at > now() - (p_days || ' days')::interval
  group by severity;
  
  return v_stats;
end;
$$ language plpgsql security definer;

-- RLS политики
alter table public.user_2fa enable row level security;
alter table public.api_keys enable row level security;
alter table public.security_audit_log enable row level security;
alter table public.security_alerts enable row level security;
alter table public.ip_access_control enable row level security;
alter table public.security_settings enable row level security;

-- Политики для user_2fa
create policy "Users can view their own 2FA settings"
  on public.user_2fa for select
  using (auth.uid() = user_id);

create policy "Users can manage their own 2FA settings"
  on public.user_2fa for all
  using (auth.uid() = user_id);

-- Политики для api_keys
create policy "Users can view their own API keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can manage their own API keys"
  on public.api_keys for all
  using (auth.uid() = user_id);

-- Политики для security_audit_log
create policy "Users can view their own audit logs"
  on public.security_audit_log for select
  using (auth.uid() = user_id);

-- Политики для security_alerts
create policy "Users can view their own security alerts"
  on public.security_alerts for select
  using (auth.uid() = user_id);

create policy "Users can update their own security alerts"
  on public.security_alerts for update
  using (auth.uid() = user_id);

-- Политики для security_settings
create policy "Users can view their own security settings"
  on public.security_settings for select
  using (auth.uid() = user_id);

create policy "Users can manage their own security settings"
  on public.security_settings for all
  using (auth.uid() = user_id);

-- Комментарии
comment on table public.user_2fa is 'Настройки двухфакторной аутентификации';
comment on table public.api_keys is 'API ключи для программного доступа';
comment on table public.security_audit_log is 'Журнал аудита событий безопасности';
comment on table public.security_alerts is 'Алерты безопасности и подозрительная активность';
comment on table public.ip_access_control is 'Контроль доступа по IP адресам';
comment on table public.security_settings is 'Настройки безопасности пользователей и организаций';
