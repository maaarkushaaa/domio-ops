-- Advanced Features System
-- Электронная подпись, Шаблоны проектов, Управление договорами, Управление рисками, Цели и KPI

-- ============================================================================
-- ЭЛЕКТРОННАЯ ПОДПИСЬ
-- ============================================================================

-- Сертификаты электронной подписи
create table if not exists public.digital_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  certificate_data text not null, -- base64 encoded certificate
  certificate_type text not null check (certificate_type in ('qualified', 'advanced', 'simple')),
  issuer text not null,
  valid_from timestamp with time zone not null,
  valid_until timestamp with time zone not null,
  fingerprint text not null unique,
  revoked boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Подписанные документы
create table if not exists public.signed_documents (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  signature_id uuid not null references public.digital_signatures(id) on delete restrict,
  signature_data text not null, -- base64 encoded signature
  signed_by uuid not null references auth.users(id) on delete set null,
  signed_at timestamp with time zone not null default now(),
  verification_status text not null default 'valid' check (verification_status in ('valid', 'invalid', 'expired', 'revoked'))
);

-- ============================================================================
-- ШАБЛОНЫ ПРОЕКТОВ
-- ============================================================================

-- Шаблоны проектов
create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text check (category in ('furniture', 'construction', 'design', 'other')),
  is_public boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  thumbnail_url text,
  estimated_duration_days integer,
  estimated_budget decimal(12,2),
  tags text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Задачи в шаблоне
create table if not exists public.template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.project_templates(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null,
  estimated_hours decimal(6,2),
  dependencies uuid[], -- массив id других template_tasks
  role_required text, -- какая роль должна выполнять
  created_at timestamp with time zone not null default now()
);

-- Этапы в шаблоне
create table if not exists public.template_milestones (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.project_templates(id) on delete cascade,
  name text not null,
  description text,
  order_index integer not null,
  days_from_start integer not null,
  created_at timestamp with time zone not null default now()
);

-- ============================================================================
-- УПРАВЛЕНИЕ ДОГОВОРАМИ
-- ============================================================================

-- Договоры
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text not null unique,
  title text not null,
  type text not null check (type in ('sale', 'purchase', 'service', 'lease', 'partnership', 'employment', 'other')),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'active', 'completed', 'terminated', 'expired')),
  amount decimal(12,2),
  currency text default 'RUB',
  start_date date not null,
  end_date date,
  auto_renewal boolean not null default false,
  renewal_period_days integer,
  responsible_user_id uuid not null references auth.users(id) on delete restrict,
  document_id uuid references public.documents(id) on delete set null,
  terms jsonb default '{}', -- условия договора
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Обязательства по договору
create table if not exists public.contract_obligations (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  description text not null,
  type text not null check (type in ('payment', 'delivery', 'service', 'milestone', 'other')),
  due_date date not null,
  amount decimal(12,2),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone not null default now()
);

-- Уведомления по договорам
create table if not exists public.contract_alerts (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  alert_type text not null check (alert_type in ('expiring_soon', 'expired', 'renewal_due', 'obligation_overdue', 'payment_due')),
  alert_date date not null,
  message text not null,
  acknowledged boolean not null default false,
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- ============================================================================
-- УПРАВЛЕНИЕ РИСКАМИ
-- ============================================================================

-- Реестр рисков
create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null check (category in ('financial', 'operational', 'strategic', 'compliance', 'reputational', 'technical', 'market')),
  project_id uuid references public.projects(id) on delete cascade,
  probability text not null check (probability in ('very_low', 'low', 'medium', 'high', 'very_high')),
  impact text not null check (impact in ('negligible', 'minor', 'moderate', 'major', 'catastrophic')),
  risk_score integer generated always as (
    case probability
      when 'very_low' then 1
      when 'low' then 2
      when 'medium' then 3
      when 'high' then 4
      when 'very_high' then 5
    end *
    case impact
      when 'negligible' then 1
      when 'minor' then 2
      when 'moderate' then 3
      when 'major' then 4
      when 'catastrophic' then 5
    end
  ) stored,
  status text not null default 'identified' check (status in ('identified', 'assessed', 'mitigated', 'accepted', 'closed')),
  owner_id uuid not null references auth.users(id) on delete restrict,
  identified_date date not null default current_date,
  review_date date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Меры по снижению рисков
create table if not exists public.risk_mitigations (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references public.risks(id) on delete cascade,
  strategy text not null check (strategy in ('avoid', 'transfer', 'mitigate', 'accept')),
  action_plan text not null,
  responsible_user_id uuid not null references auth.users(id) on delete restrict,
  due_date date,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  cost_estimate decimal(12,2),
  effectiveness_rating integer check (effectiveness_rating between 1 and 5),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ============================================================================
-- ЦЕЛИ И KPI
-- ============================================================================

-- Цели (OKR - Objectives and Key Results)
create table if not exists public.objectives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('company', 'department', 'team', 'individual')),
  owner_id uuid not null references auth.users(id) on delete restrict,
  parent_id uuid references public.objectives(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'cancelled')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Ключевые результаты (Key Results)
create table if not exists public.key_results (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives(id) on delete cascade,
  title text not null,
  description text,
  metric_type text not null check (metric_type in ('number', 'percentage', 'currency', 'boolean')),
  target_value decimal(12,2) not null,
  current_value decimal(12,2) default 0,
  unit text,
  progress integer generated always as (
    case 
      when target_value = 0 then 0
      else least(100, round((current_value / target_value * 100)::numeric, 0)::integer)
    end
  ) stored,
  due_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'at_risk', 'cancelled')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- KPI метрики
create table if not exists public.kpi_metrics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null check (category in ('financial', 'operational', 'customer', 'employee', 'quality', 'growth')),
  metric_type text not null check (metric_type in ('number', 'percentage', 'currency', 'ratio')),
  calculation_formula text,
  target_value decimal(12,2),
  warning_threshold decimal(12,2),
  critical_threshold decimal(12,2),
  unit text,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  owner_id uuid not null references auth.users(id) on delete restrict,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Значения KPI
create table if not exists public.kpi_values (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references public.kpi_metrics(id) on delete cascade,
  value decimal(12,2) not null,
  period_start date not null,
  period_end date not null,
  notes text,
  recorded_by uuid not null references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  unique (kpi_id, period_start, period_end)
);

-- ============================================================================
-- ИНДЕКСЫ
-- ============================================================================

create index if not exists digital_signatures_user_idx on public.digital_signatures (user_id);
create index if not exists digital_signatures_valid_idx on public.digital_signatures (valid_until) where not revoked;
create index if not exists signed_documents_document_idx on public.signed_documents (document_id);
create index if not exists project_templates_category_idx on public.project_templates (category);
create index if not exists project_templates_public_idx on public.project_templates (is_public) where is_public;
create index if not exists template_tasks_template_idx on public.template_tasks (template_id, order_index);
create index if not exists contracts_status_idx on public.contracts (status);
create index if not exists contracts_client_idx on public.contracts (client_id);
create index if not exists contracts_dates_idx on public.contracts (start_date, end_date);
create index if not exists contract_obligations_contract_idx on public.contract_obligations (contract_id);
create index if not exists contract_obligations_due_idx on public.contract_obligations (due_date, status);
create index if not exists risks_project_idx on public.risks (project_id);
create index if not exists risks_score_idx on public.risks (risk_score desc);
create index if not exists risks_status_idx on public.risks (status);
create index if not exists risk_mitigations_risk_idx on public.risk_mitigations (risk_id);
create index if not exists objectives_owner_idx on public.objectives (owner_id);
create index if not exists objectives_period_idx on public.objectives (period_start, period_end);
create index if not exists key_results_objective_idx on public.key_results (objective_id);
create index if not exists kpi_metrics_category_idx on public.kpi_metrics (category) where active;
create index if not exists kpi_values_kpi_idx on public.kpi_values (kpi_id, period_start desc);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

alter table public.digital_signatures enable row level security;
alter table public.signed_documents enable row level security;
alter table public.project_templates enable row level security;
alter table public.template_tasks enable row level security;
alter table public.template_milestones enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_obligations enable row level security;
alter table public.contract_alerts enable row level security;
alter table public.risks enable row level security;
alter table public.risk_mitigations enable row level security;
alter table public.objectives enable row level security;
alter table public.key_results enable row level security;
alter table public.kpi_metrics enable row level security;
alter table public.kpi_values enable row level security;

-- Digital signatures - только свои
drop policy if exists digital_signatures_own on public.digital_signatures;
create policy digital_signatures_own on public.digital_signatures for all using (auth.uid() = user_id);

-- Project templates - публичные видят все, приватные только создатель
drop policy if exists project_templates_select on public.project_templates;
create policy project_templates_select on public.project_templates for select using (
  is_public or auth.uid() = created_by
);

drop policy if exists project_templates_manage_owner on public.project_templates;
create policy project_templates_manage_owner on public.project_templates for all using (auth.uid() = created_by);

-- Contracts - все аутентифицированные
drop policy if exists contracts_select_all on public.contracts;
create policy contracts_select_all on public.contracts for select using (auth.role() = 'authenticated');

drop policy if exists contracts_manage_responsible on public.contracts;
create policy contracts_manage_responsible on public.contracts for all using (auth.uid() = responsible_user_id);

-- Risks - все аутентифицированные
drop policy if exists risks_select_all on public.risks;
create policy risks_select_all on public.risks for select using (auth.role() = 'authenticated');

drop policy if exists risks_manage_owner on public.risks;
create policy risks_manage_owner on public.risks for all using (auth.uid() = owner_id);

-- Objectives - владелец или подчинённые
drop policy if exists objectives_select_all on public.objectives;
create policy objectives_select_all on public.objectives for select using (auth.role() = 'authenticated');

drop policy if exists objectives_manage_owner on public.objectives;
create policy objectives_manage_owner on public.objectives for all using (auth.uid() = owner_id);

-- KPI - все аутентифицированные читают, владелец управляет
drop policy if exists kpi_metrics_select_all on public.kpi_metrics;
create policy kpi_metrics_select_all on public.kpi_metrics for select using (auth.role() = 'authenticated');

drop policy if exists kpi_metrics_manage_owner on public.kpi_metrics;
create policy kpi_metrics_manage_owner on public.kpi_metrics for all using (auth.uid() = owner_id);

-- ============================================================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ============================================================================

-- Автообновление updated_at
create or replace function update_advanced_features_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_project_templates_updated_at_trigger on public.project_templates;
create trigger update_project_templates_updated_at_trigger
  before update on public.project_templates
  for each row execute function update_advanced_features_updated_at();

drop trigger if exists update_contracts_updated_at_trigger on public.contracts;
create trigger update_contracts_updated_at_trigger
  before update on public.contracts
  for each row execute function update_advanced_features_updated_at();

drop trigger if exists update_risks_updated_at_trigger on public.risks;
create trigger update_risks_updated_at_trigger
  before update on public.risks
  for each row execute function update_advanced_features_updated_at();

drop trigger if exists update_risk_mitigations_updated_at_trigger on public.risk_mitigations;
create trigger update_risk_mitigations_updated_at_trigger
  before update on public.risk_mitigations
  for each row execute function update_advanced_features_updated_at();

drop trigger if exists update_objectives_updated_at_trigger on public.objectives;
create trigger update_objectives_updated_at_trigger
  before update on public.objectives
  for each row execute function update_advanced_features_updated_at();

drop trigger if exists update_key_results_updated_at_trigger on public.key_results;
create trigger update_key_results_updated_at_trigger
  before update on public.key_results
  for each row execute function update_advanced_features_updated_at();

drop trigger if exists update_kpi_metrics_updated_at_trigger on public.kpi_metrics;
create trigger update_kpi_metrics_updated_at_trigger
  before update on public.kpi_metrics
  for each row execute function update_advanced_features_updated_at();

-- Автоматическое создание алертов для истекающих договоров
create or replace function check_contract_expiration()
returns void as $$
begin
  insert into public.contract_alerts (contract_id, alert_type, alert_date, message)
  select 
    id,
    'expiring_soon',
    end_date - interval '30 days',
    format('Договор "%s" истекает через 30 дней', title)
  from public.contracts
  where 
    end_date is not null 
    and end_date > current_date
    and end_date <= current_date + interval '30 days'
    and status = 'active'
    and not exists (
      select 1 from public.contract_alerts 
      where contract_id = contracts.id 
      and alert_type = 'expiring_soon'
      and not acknowledged
    );
end;
$$ language plpgsql security definer;

-- ============================================================================
-- REALTIME
-- ============================================================================

alter publication supabase_realtime add table public.signed_documents;
alter publication supabase_realtime add table public.project_templates;
alter publication supabase_realtime add table public.contracts;
alter publication supabase_realtime add table public.contract_alerts;
alter publication supabase_realtime add table public.risks;
alter publication supabase_realtime add table public.objectives;
alter publication supabase_realtime add table public.key_results;
alter publication supabase_realtime add table public.kpi_values;
