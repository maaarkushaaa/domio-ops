-- CRM System with Sales Funnel
-- Расширенная CRM система с воронкой продаж, сегментацией и историей взаимодействий

-- Сегменты клиентов
create table if not exists public.client_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  color text default '#3b82f6',
  criteria jsonb, -- условия автоматической сегментации
  created_at timestamp with time zone not null default now()
);

-- Таблица клиентов (если не существует, создаём)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  company text,
  website text,
  address text,
  notes text,
  segment_id uuid references public.client_segments(id) on delete set null,
  lifetime_value decimal(12,2) default 0,
  last_contact_date timestamp with time zone,
  lead_source text check (lead_source in ('website', 'referral', 'cold_call', 'social_media', 'advertising', 'other')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'vip')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Добавление user_id если таблица уже существует или только что создана
do $$ 
begin
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'user_id') then
    alter table public.clients add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'segment_id') then
    alter table public.clients add column segment_id uuid references public.client_segments(id) on delete set null;
  end if;
  
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'lifetime_value') then
    alter table public.clients add column lifetime_value decimal(12,2) default 0;
  end if;
  
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'last_contact_date') then
    alter table public.clients add column last_contact_date timestamp with time zone;
  end if;
  
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'lead_source') then
    alter table public.clients add column lead_source text check (lead_source in ('website', 'referral', 'cold_call', 'social_media', 'advertising', 'other'));
  end if;
  
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'priority') then
    alter table public.clients add column priority text default 'medium' check (priority in ('low', 'medium', 'high', 'vip'));
  end if;
end $$;

-- Стадии воронки продаж
create table if not exists public.sales_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  order_index integer not null,
  probability integer default 0 check (probability >= 0 and probability <= 100), -- вероятность закрытия сделки на этой стадии
  color text default '#64748b',
  is_won boolean default false, -- финальная стадия "выиграно"
  is_lost boolean default false, -- финальная стадия "проиграно"
  created_at timestamp with time zone not null default now(),
  unique (order_index)
);

-- Сделки (opportunities)
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid references public.clients(id) on delete cascade,
  stage_id uuid not null references public.sales_stages(id) on delete restrict,
  amount decimal(12,2) not null default 0,
  expected_close_date date,
  actual_close_date date,
  probability integer default 50 check (probability >= 0 and probability <= 100),
  owner_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'open' check (status in ('open', 'won', 'lost', 'abandoned')),
  lost_reason text,
  tags text[],
  custom_fields jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- История перемещения сделок по воронке
create table if not exists public.deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  from_stage_id uuid references public.sales_stages(id) on delete set null,
  to_stage_id uuid not null references public.sales_stages(id) on delete cascade,
  moved_by uuid not null references auth.users(id) on delete set null,
  notes text,
  created_at timestamp with time zone not null default now()
);

-- Взаимодействия с клиентами (звонки, встречи, email)
create table if not exists public.client_interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  type text not null check (type in ('call', 'meeting', 'email', 'note', 'task')),
  subject text not null,
  description text,
  outcome text,
  duration_minutes integer,
  scheduled_at timestamp with time zone,
  completed_at timestamp with time zone,
  user_id uuid not null references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

-- Задачи по клиентам/сделкам
create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid references public.clients(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  assigned_to uuid not null references auth.users(id) on delete restrict,
  due_date timestamp with time zone,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  check ((client_id is not null) or (deal_id is not null))
);

-- Индексы
create index if not exists clients_user_idx on public.clients (user_id);
create index if not exists clients_segment_idx on public.clients (segment_id);
create index if not exists clients_priority_idx on public.clients (priority);
create index if not exists clients_email_idx on public.clients (email);

create index if not exists deals_client_idx on public.deals (client_id);
create index if not exists deals_stage_idx on public.deals (stage_id);
create index if not exists deals_owner_idx on public.deals (owner_id);
create index if not exists deals_status_idx on public.deals (status);
create index if not exists deals_close_date_idx on public.deals (expected_close_date);

create index if not exists deal_stage_history_deal_idx on public.deal_stage_history (deal_id, created_at desc);

create index if not exists client_interactions_client_idx on public.client_interactions (client_id, created_at desc);
create index if not exists client_interactions_deal_idx on public.client_interactions (deal_id);
create index if not exists client_interactions_type_idx on public.client_interactions (type);

create index if not exists crm_tasks_client_idx on public.crm_tasks (client_id);
create index if not exists crm_tasks_deal_idx on public.crm_tasks (deal_id);
create index if not exists crm_tasks_assigned_idx on public.crm_tasks (assigned_to, status);

-- RLS
alter table public.client_segments enable row level security;
alter table public.clients enable row level security;
alter table public.sales_stages enable row level security;
alter table public.deals enable row level security;
alter table public.deal_stage_history enable row level security;
alter table public.client_interactions enable row level security;
alter table public.crm_tasks enable row level security;

-- Policies
drop policy if exists client_segments_select_all on public.client_segments;
create policy client_segments_select_all on public.client_segments for select using (auth.role() = 'authenticated');

drop policy if exists clients_select_own on public.clients;
create policy clients_select_own on public.clients for select using (auth.uid() = user_id);

drop policy if exists clients_insert_own on public.clients;
create policy clients_insert_own on public.clients for insert with check (auth.uid() = user_id);

drop policy if exists clients_update_own on public.clients;
create policy clients_update_own on public.clients for update using (auth.uid() = user_id);

drop policy if exists clients_delete_own on public.clients;
create policy clients_delete_own on public.clients for delete using (auth.uid() = user_id);

drop policy if exists sales_stages_select_all on public.sales_stages;
create policy sales_stages_select_all on public.sales_stages for select using (auth.role() = 'authenticated');

drop policy if exists deals_select_all on public.deals;
create policy deals_select_all on public.deals for select using (auth.role() = 'authenticated');

drop policy if exists deals_insert_auth on public.deals;
create policy deals_insert_auth on public.deals for insert with check (auth.uid() = owner_id);

drop policy if exists deals_update_owner on public.deals;
create policy deals_update_owner on public.deals for update using (auth.uid() = owner_id);

drop policy if exists deal_stage_history_select_all on public.deal_stage_history;
create policy deal_stage_history_select_all on public.deal_stage_history for select using (auth.role() = 'authenticated');

drop policy if exists deal_stage_history_insert_auth on public.deal_stage_history;
create policy deal_stage_history_insert_auth on public.deal_stage_history for insert with check (auth.role() = 'authenticated');

drop policy if exists client_interactions_select_all on public.client_interactions;
create policy client_interactions_select_all on public.client_interactions for select using (auth.role() = 'authenticated');

drop policy if exists client_interactions_insert_auth on public.client_interactions;
create policy client_interactions_insert_auth on public.client_interactions for insert with check (auth.uid() = user_id);

drop policy if exists crm_tasks_select_all on public.crm_tasks;
create policy crm_tasks_select_all on public.crm_tasks for select using (auth.role() = 'authenticated');

drop policy if exists crm_tasks_insert_auth on public.crm_tasks;
create policy crm_tasks_insert_auth on public.crm_tasks for insert with check (auth.role() = 'authenticated');

drop policy if exists crm_tasks_update_assigned on public.crm_tasks;
create policy crm_tasks_update_assigned on public.crm_tasks for update using (auth.uid() = assigned_to);

-- Функции
create or replace function update_clients_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_clients_updated_at_trigger on public.clients;
create trigger update_clients_updated_at_trigger
  before update on public.clients
  for each row
  execute function update_clients_updated_at();

create or replace function update_deals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_deals_updated_at_trigger on public.deals;
create trigger update_deals_updated_at_trigger
  before update on public.deals
  for each row
  execute function update_deals_updated_at();

-- Функция для логирования перемещения сделки по стадиям
create or replace function log_deal_stage_change()
returns trigger as $$
begin
  if (TG_OP = 'UPDATE' and old.stage_id != new.stage_id) then
    insert into public.deal_stage_history (deal_id, from_stage_id, to_stage_id, moved_by)
    values (new.id, old.stage_id, new.stage_id, auth.uid());
    
    -- Обновляем вероятность на основе стадии
    update public.deals
    set probability = (select probability from public.sales_stages where id = new.stage_id)
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists log_deal_stage_change_trigger on public.deals;
create trigger log_deal_stage_change_trigger
  after update on public.deals
  for each row
  execute function log_deal_stage_change();

-- Функция для автоматического обновления статуса сделки при перемещении в финальную стадию
create or replace function update_deal_status_on_stage()
returns trigger as $$
declare
  stage_is_won boolean;
  stage_is_lost boolean;
begin
  select is_won, is_lost into stage_is_won, stage_is_lost
  from public.sales_stages
  where id = new.stage_id;
  
  if stage_is_won then
    new.status = 'won';
    new.actual_close_date = current_date;
  elsif stage_is_lost then
    new.status = 'lost';
    new.actual_close_date = current_date;
  end if;
  
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_deal_status_on_stage_trigger on public.deals;
create trigger update_deal_status_on_stage_trigger
  before update on public.deals
  for each row
  when (old.stage_id is distinct from new.stage_id)
  execute function update_deal_status_on_stage();

-- Enable Realtime
do $$
begin
  -- Добавляем таблицы в publication с проверкой существования
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'client_segments') then
    alter publication supabase_realtime add table public.client_segments;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'clients') then
    alter publication supabase_realtime add table public.clients;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sales_stages') then
    alter publication supabase_realtime add table public.sales_stages;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deals') then
    alter publication supabase_realtime add table public.deals;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deal_stage_history') then
    alter publication supabase_realtime add table public.deal_stage_history;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'client_interactions') then
    alter publication supabase_realtime add table public.client_interactions;
  end if;
  
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'crm_tasks') then
    alter publication supabase_realtime add table public.crm_tasks;
  end if;
end $$;

-- Вставка демо-данных
insert into public.client_segments (name, description, color) values
  ('VIP клиенты', 'Клиенты с высоким LTV', '#f59e0b'),
  ('Новые лиды', 'Потенциальные клиенты', '#3b82f6'),
  ('Постоянные', 'Регулярные заказчики', '#10b981'),
  ('Неактивные', 'Давно не было заказов', '#6b7280')
on conflict (name) do nothing;

insert into public.sales_stages (name, order_index, probability, color, is_won, is_lost) values
  ('Новый лид', 1, 10, '#64748b', false, false),
  ('Квалификация', 2, 20, '#3b82f6', false, false),
  ('Презентация', 3, 40, '#8b5cf6', false, false),
  ('Переговоры', 4, 60, '#f59e0b', false, false),
  ('Согласование', 5, 80, '#10b981', false, false),
  ('Выиграно', 6, 100, '#22c55e', true, false),
  ('Проиграно', 7, 0, '#ef4444', false, true)
on conflict (order_index) do nothing;
