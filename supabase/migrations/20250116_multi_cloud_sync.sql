-- Multi-Cloud Synchronization System
-- Система мультиоблачной синхронизации

-- Таблица для облачных провайдеров
create table if not exists public.cloud_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_type text not null check (provider_type in (
    'google_drive', 'dropbox', 'onedrive', 'aws_s3', 'yandex_disk', 'box', 'icloud'
  )),
  provider_name text not null,
  access_token text, -- Encrypted
  refresh_token text, -- Encrypted
  token_expires_at timestamp with time zone,
  account_email text,
  account_id text,
  quota_total bigint, -- В байтах
  quota_used bigint, -- В байтах
  is_active boolean not null default true,
  last_sync_at timestamp with time zone,
  sync_status text not null default 'idle' check (sync_status in (
    'idle', 'syncing', 'error', 'paused'
  )),
  sync_error text,
  settings jsonb default '{}', -- Настройки синхронизации
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(user_id, provider_type, account_id)
);

-- Таблица для синхронизированных файлов
create table if not exists public.cloud_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references public.cloud_providers(id) on delete cascade,
  file_name text not null,
  file_path text not null, -- Путь в облаке
  file_type text, -- MIME type
  file_size bigint not null, -- В байтах
  file_hash text, -- MD5 или SHA256 для определения изменений
  cloud_file_id text not null, -- ID файла в облачном провайдере
  cloud_url text, -- Прямая ссылка на файл
  thumbnail_url text,
  parent_folder_id uuid references public.cloud_files(id) on delete cascade,
  is_folder boolean not null default false,
  is_shared boolean not null default false,
  permissions jsonb default '{}', -- Права доступа
  local_document_id uuid references public.documents(id) on delete set null,
  sync_status text not null default 'synced' check (sync_status in (
    'synced', 'pending', 'conflict', 'error', 'deleted'
  )),
  last_modified_at timestamp with time zone,
  last_synced_at timestamp with time zone,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(provider_id, cloud_file_id)
);

-- Таблица для истории синхронизации
create table if not exists public.sync_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references public.cloud_providers(id) on delete cascade,
  sync_type text not null check (sync_type in (
    'full', 'incremental', 'manual', 'automatic'
  )),
  status text not null check (status in (
    'started', 'in_progress', 'completed', 'failed', 'cancelled'
  )),
  files_processed integer not null default 0,
  files_uploaded integer not null default 0,
  files_downloaded integer not null default 0,
  files_deleted integer not null default 0,
  files_failed integer not null default 0,
  bytes_transferred bigint not null default 0,
  error_message text,
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  duration_seconds integer,
  metadata jsonb default '{}'
);

-- Таблица для конфликтов синхронизации
create table if not exists public.sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_id uuid not null references public.cloud_files(id) on delete cascade,
  conflict_type text not null check (conflict_type in (
    'version_mismatch', 'simultaneous_edit', 'deleted_remotely', 'deleted_locally', 'permission_change'
  )),
  local_version jsonb,
  remote_version jsonb,
  resolution_strategy text check (resolution_strategy in (
    'keep_local', 'keep_remote', 'keep_both', 'manual'
  )),
  resolved boolean not null default false,
  resolved_at timestamp with time zone,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

-- Таблица для правил синхронизации
create table if not exists public.sync_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid references public.cloud_providers(id) on delete cascade,
  rule_name text not null,
  rule_type text not null check (rule_type in (
    'include', 'exclude', 'auto_upload', 'auto_download'
  )),
  pattern text not null, -- Glob pattern или regex
  is_regex boolean not null default false,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Индексы для производительности
create index if not exists idx_cloud_providers_user_id on public.cloud_providers(user_id);
create index if not exists idx_cloud_providers_provider_type on public.cloud_providers(provider_type);
create index if not exists idx_cloud_providers_is_active on public.cloud_providers(is_active);
create index if not exists idx_cloud_files_user_id on public.cloud_files(user_id);
create index if not exists idx_cloud_files_provider_id on public.cloud_files(provider_id);
create index if not exists idx_cloud_files_parent_folder_id on public.cloud_files(parent_folder_id);
create index if not exists idx_cloud_files_sync_status on public.cloud_files(sync_status);
create index if not exists idx_cloud_files_file_hash on public.cloud_files(file_hash);
create index if not exists idx_sync_history_user_id on public.sync_history(user_id);
create index if not exists idx_sync_history_provider_id on public.sync_history(provider_id);
create index if not exists idx_sync_history_started_at on public.sync_history(started_at desc);
create index if not exists idx_sync_conflicts_user_id on public.sync_conflicts(user_id);
create index if not exists idx_sync_conflicts_file_id on public.sync_conflicts(file_id);
create index if not exists idx_sync_conflicts_resolved on public.sync_conflicts(resolved);
create index if not exists idx_sync_rules_user_id on public.sync_rules(user_id);
create index if not exists idx_sync_rules_provider_id on public.sync_rules(provider_id);

-- Функция для автоматического обновления updated_at
create or replace function update_cloud_sync_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Триггеры для обновления updated_at
drop trigger if exists cloud_providers_updated_at on public.cloud_providers;
create trigger cloud_providers_updated_at
  before update on public.cloud_providers
  for each row
  execute function update_cloud_sync_timestamp();

drop trigger if exists cloud_files_updated_at on public.cloud_files;
create trigger cloud_files_updated_at
  before update on public.cloud_files
  for each row
  execute function update_cloud_sync_timestamp();

drop trigger if exists sync_rules_updated_at on public.sync_rules;
create trigger sync_rules_updated_at
  before update on public.sync_rules
  for each row
  execute function update_cloud_sync_timestamp();

-- Функция для получения статистики по провайдерам
create or replace function get_cloud_sync_stats(
  p_user_id uuid
)
returns jsonb as $$
declare
  v_stats jsonb;
begin
  select jsonb_build_object(
    'total_providers', count(*),
    'active_providers', count(*) filter (where is_active = true),
    'total_files', (
      select count(*)
      from public.cloud_files
      where user_id = p_user_id
    ),
    'total_size_bytes', (
      select coalesce(sum(file_size), 0)
      from public.cloud_files
      where user_id = p_user_id
    ),
    'by_provider', (
      select jsonb_object_agg(
        provider_type,
        jsonb_build_object(
          'files', file_count,
          'size_bytes', total_size,
          'quota_used', quota_used,
          'quota_total', quota_total
        )
      )
      from (
        select 
          cp.provider_type,
          count(cf.id) as file_count,
          coalesce(sum(cf.file_size), 0) as total_size,
          cp.quota_used,
          cp.quota_total
        from public.cloud_providers cp
        left join public.cloud_files cf on cf.provider_id = cp.id
        where cp.user_id = p_user_id
        group by cp.provider_type, cp.quota_used, cp.quota_total
      ) t
    ),
    'recent_syncs', (
      select jsonb_agg(
        jsonb_build_object(
          'provider_type', cp.provider_type,
          'status', sh.status,
          'files_processed', sh.files_processed,
          'started_at', sh.started_at
        )
      )
      from public.sync_history sh
      join public.cloud_providers cp on cp.id = sh.provider_id
      where sh.user_id = p_user_id
      order by sh.started_at desc
      limit 5
    ),
    'unresolved_conflicts', (
      select count(*)
      from public.sync_conflicts
      where user_id = p_user_id
        and resolved = false
    )
  ) into v_stats
  from public.cloud_providers
  where user_id = p_user_id;
  
  return v_stats;
end;
$$ language plpgsql security definer;

-- Функция для начала синхронизации
create or replace function start_cloud_sync(
  p_user_id uuid,
  p_provider_id uuid,
  p_sync_type text default 'incremental'
)
returns uuid as $$
declare
  v_sync_id uuid;
begin
  -- Проверяем, что провайдер активен
  if not exists (
    select 1 from public.cloud_providers
    where id = p_provider_id
      and user_id = p_user_id
      and is_active = true
  ) then
    raise exception 'Provider not found or inactive';
  end if;
  
  -- Создаём запись в истории
  insert into public.sync_history (
    user_id,
    provider_id,
    sync_type,
    status
  ) values (
    p_user_id,
    p_provider_id,
    p_sync_type,
    'started'
  ) returning id into v_sync_id;
  
  -- Обновляем статус провайдера
  update public.cloud_providers
  set 
    sync_status = 'syncing',
    last_sync_at = now()
  where id = p_provider_id;
  
  return v_sync_id;
end;
$$ language plpgsql security definer;

-- Функция для завершения синхронизации
create or replace function complete_cloud_sync(
  p_sync_id uuid,
  p_status text,
  p_files_processed integer default 0,
  p_files_uploaded integer default 0,
  p_files_downloaded integer default 0,
  p_files_deleted integer default 0,
  p_files_failed integer default 0,
  p_bytes_transferred bigint default 0,
  p_error_message text default null
)
returns void as $$
declare
  v_provider_id uuid;
  v_started_at timestamp with time zone;
begin
  -- Получаем информацию о синхронизации
  select provider_id, started_at into v_provider_id, v_started_at
  from public.sync_history
  where id = p_sync_id;
  
  if not found then
    raise exception 'Sync not found';
  end if;
  
  -- Обновляем запись в истории
  update public.sync_history
  set 
    status = p_status,
    files_processed = p_files_processed,
    files_uploaded = p_files_uploaded,
    files_downloaded = p_files_downloaded,
    files_deleted = p_files_deleted,
    files_failed = p_files_failed,
    bytes_transferred = p_bytes_transferred,
    error_message = p_error_message,
    completed_at = now(),
    duration_seconds = extract(epoch from (now() - v_started_at))::integer
  where id = p_sync_id;
  
  -- Обновляем статус провайдера
  update public.cloud_providers
  set 
    sync_status = case 
      when p_status = 'completed' then 'idle'
      when p_status = 'failed' then 'error'
      else 'idle'
    end,
    sync_error = p_error_message
  where id = v_provider_id;
end;
$$ language plpgsql security definer;

-- Функция для создания конфликта
create or replace function create_sync_conflict(
  p_user_id uuid,
  p_file_id uuid,
  p_conflict_type text,
  p_local_version jsonb,
  p_remote_version jsonb
)
returns uuid as $$
declare
  v_conflict_id uuid;
begin
  insert into public.sync_conflicts (
    user_id,
    file_id,
    conflict_type,
    local_version,
    remote_version
  ) values (
    p_user_id,
    p_file_id,
    p_conflict_type,
    p_local_version,
    p_remote_version
  ) returning id into v_conflict_id;
  
  -- Обновляем статус файла
  update public.cloud_files
  set sync_status = 'conflict'
  where id = p_file_id;
  
  return v_conflict_id;
end;
$$ language plpgsql security definer;

-- Функция для разрешения конфликта
create or replace function resolve_sync_conflict(
  p_conflict_id uuid,
  p_user_id uuid,
  p_resolution_strategy text
)
returns void as $$
declare
  v_file_id uuid;
begin
  -- Получаем ID файла
  select file_id into v_file_id
  from public.sync_conflicts
  where id = p_conflict_id
    and user_id = p_user_id;
  
  if not found then
    raise exception 'Conflict not found';
  end if;
  
  -- Обновляем конфликт
  update public.sync_conflicts
  set 
    resolved = true,
    resolved_at = now(),
    resolved_by = p_user_id,
    resolution_strategy = p_resolution_strategy
  where id = p_conflict_id;
  
  -- Обновляем статус файла
  update public.cloud_files
  set sync_status = 'synced'
  where id = v_file_id;
end;
$$ language plpgsql security definer;

-- RLS политики
alter table public.cloud_providers enable row level security;
alter table public.cloud_files enable row level security;
alter table public.sync_history enable row level security;
alter table public.sync_conflicts enable row level security;
alter table public.sync_rules enable row level security;

-- Политики для cloud_providers
create policy "Users can view their own cloud providers"
  on public.cloud_providers for select
  using (auth.uid() = user_id);

create policy "Users can manage their own cloud providers"
  on public.cloud_providers for all
  using (auth.uid() = user_id);

-- Политики для cloud_files
create policy "Users can view their own cloud files"
  on public.cloud_files for select
  using (auth.uid() = user_id);

create policy "Users can manage their own cloud files"
  on public.cloud_files for all
  using (auth.uid() = user_id);

-- Политики для sync_history
create policy "Users can view their own sync history"
  on public.sync_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sync history"
  on public.sync_history for insert
  with check (auth.uid() = user_id);

-- Политики для sync_conflicts
create policy "Users can view their own sync conflicts"
  on public.sync_conflicts for select
  using (auth.uid() = user_id);

create policy "Users can manage their own sync conflicts"
  on public.sync_conflicts for all
  using (auth.uid() = user_id);

-- Политики для sync_rules
create policy "Users can view their own sync rules"
  on public.sync_rules for select
  using (auth.uid() = user_id);

create policy "Users can manage their own sync rules"
  on public.sync_rules for all
  using (auth.uid() = user_id);

-- Комментарии
comment on table public.cloud_providers is 'Подключенные облачные провайдеры';
comment on table public.cloud_files is 'Синхронизированные файлы из облачных хранилищ';
comment on table public.sync_history is 'История синхронизаций';
comment on table public.sync_conflicts is 'Конфликты синхронизации';
comment on table public.sync_rules is 'Правила автоматической синхронизации';
