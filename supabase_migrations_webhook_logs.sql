-- webhook_logs: логи веб-хуков для автоматического импорта
-- Таблица для отслеживания результатов автоматических импортов

-- Удаляем старую таблицу если существует
drop table if exists public.webhook_logs cascade;

-- Создаём таблицу заново
create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id text, -- ID веб-хука от внешней системы
  type text not null, -- 'materials' или 'bom'
  source text not null, -- источник данных (warehouse_system, cad_system, etc.)
  success_count integer not null default 0,
  error_count integer not null default 0,
  details text[], -- массив деталей обработки
  payload jsonb, -- исходные данные веб-хука
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Индексы для быстрого поиска
create index idx_webhook_logs_type on public.webhook_logs(type);
create index idx_webhook_logs_source on public.webhook_logs(source);
create index idx_webhook_logs_processed_at on public.webhook_logs(processed_at);
create index idx_webhook_logs_webhook_id on public.webhook_logs(webhook_id);

-- RLS
alter table public.webhook_logs enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where tablename='webhook_logs' and policyname='read all webhook logs') then
    create policy "read all webhook logs" on public.webhook_logs for select to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='webhook_logs' and policyname='insert webhook logs') then
    create policy "insert webhook logs" on public.webhook_logs for insert to authenticated with check (true);
  end if;
end $$;

-- Realtime публикация
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'webhook_logs'
  ) then
    alter publication supabase_realtime add table public.webhook_logs;
  end if;
end $$;
