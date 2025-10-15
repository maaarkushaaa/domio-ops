-- AI Document Analysis System
-- Система AI-анализа документов

-- Таблица для анализа документов
create table if not exists public.document_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null, -- MIME type
  file_size bigint not null,
  analysis_type text not null check (analysis_type in (
    'ocr', 'text_extraction', 'entity_extraction', 'classification', 
    'sentiment', 'summary', 'translation', 'full'
  )),
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  accuracy_score numeric(5,2), -- Точность анализа (0-100)
  confidence_score numeric(5,2), -- Уверенность AI (0-100)
  language_detected text,
  page_count integer,
  word_count integer,
  character_count integer,
  processing_time_ms integer,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Таблица для результатов анализа
create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.document_analysis(id) on delete cascade,
  result_type text not null check (result_type in (
    'extracted_text', 'entities', 'keywords', 'summary', 'metadata', 
    'tables', 'images', 'signatures', 'dates', 'amounts', 'custom'
  )),
  result_data jsonb not null,
  confidence numeric(5,2),
  page_number integer,
  position jsonb, -- {x, y, width, height} для координат на странице
  created_at timestamp with time zone not null default now()
);

-- Таблица для извлечённых сущностей
create table if not exists public.extracted_entities (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.document_analysis(id) on delete cascade,
  entity_type text not null check (entity_type in (
    'person', 'organization', 'location', 'date', 'money', 'phone', 
    'email', 'address', 'contract_number', 'inn', 'kpp', 'account_number', 'custom'
  )),
  entity_value text not null,
  entity_label text,
  confidence numeric(5,2) not null,
  context text, -- Контекст, в котором найдена сущность
  page_number integer,
  position jsonb,
  metadata jsonb default '{}',
  created_at timestamp with time zone not null default now()
);

-- Таблица для шаблонов документов
create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  template_name text not null,
  template_type text not null check (template_type in (
    'contract', 'invoice', 'receipt', 'specification', 'report', 'letter', 'custom'
  )),
  description text,
  fields jsonb not null, -- Поля для извлечения
  validation_rules jsonb default '{}',
  is_active boolean not null default true,
  is_public boolean not null default false,
  usage_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Таблица для истории обучения AI
create table if not exists public.ai_training_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.document_analysis(id) on delete set null,
  training_type text not null check (training_type in (
    'correction', 'validation', 'feedback', 'custom_entity'
  )),
  original_value jsonb not null,
  corrected_value jsonb not null,
  field_name text,
  is_applied boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Таблица для очереди обработки
create table if not exists public.analysis_queue (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.document_analysis(id) on delete cascade,
  priority integer not null default 5 check (priority >= 1 and priority <= 10),
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  scheduled_at timestamp with time zone not null default now(),
  claimed_at timestamp with time zone,
  claimed_by text, -- Worker ID
  created_at timestamp with time zone not null default now()
);

-- Индексы для производительности
create index if not exists idx_document_analysis_user_id on public.document_analysis(user_id);
create index if not exists idx_document_analysis_document_id on public.document_analysis(document_id);
create index if not exists idx_document_analysis_status on public.document_analysis(status);
create index if not exists idx_document_analysis_created_at on public.document_analysis(created_at desc);
create index if not exists idx_analysis_results_analysis_id on public.analysis_results(analysis_id);
create index if not exists idx_analysis_results_result_type on public.analysis_results(result_type);
create index if not exists idx_extracted_entities_analysis_id on public.extracted_entities(analysis_id);
create index if not exists idx_extracted_entities_entity_type on public.extracted_entities(entity_type);
create index if not exists idx_document_templates_user_id on public.document_templates(user_id);
create index if not exists idx_document_templates_template_type on public.document_templates(template_type);
create index if not exists idx_ai_training_data_user_id on public.ai_training_data(user_id);
create index if not exists idx_analysis_queue_scheduled_at on public.analysis_queue(scheduled_at);
create index if not exists idx_analysis_queue_claimed_at on public.analysis_queue(claimed_at);

-- Функция для автоматического обновления updated_at
create or replace function update_ai_analysis_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Триггеры для обновления updated_at
drop trigger if exists document_analysis_updated_at on public.document_analysis;
create trigger document_analysis_updated_at
  before update on public.document_analysis
  for each row
  execute function update_ai_analysis_timestamp();

drop trigger if exists document_templates_updated_at on public.document_templates;
create trigger document_templates_updated_at
  before update on public.document_templates
  for each row
  execute function update_ai_analysis_timestamp();

-- Функция для создания анализа документа
create or replace function create_document_analysis(
  p_user_id uuid,
  p_document_id uuid,
  p_file_name text,
  p_file_url text,
  p_file_type text,
  p_file_size bigint,
  p_analysis_type text default 'full',
  p_priority integer default 5
)
returns uuid as $$
declare
  v_analysis_id uuid;
begin
  -- Создаём запись анализа
  insert into public.document_analysis (
    user_id,
    document_id,
    file_name,
    file_url,
    file_type,
    file_size,
    analysis_type,
    status
  ) values (
    p_user_id,
    p_document_id,
    p_file_name,
    p_file_url,
    p_file_type,
    p_file_size,
    p_analysis_type,
    'pending'
  ) returning id into v_analysis_id;
  
  -- Добавляем в очередь обработки
  insert into public.analysis_queue (
    analysis_id,
    priority
  ) values (
    v_analysis_id,
    p_priority
  );
  
  return v_analysis_id;
end;
$$ language plpgsql security definer;

-- Функция для обновления статуса анализа
create or replace function update_analysis_status(
  p_analysis_id uuid,
  p_status text,
  p_progress integer default null,
  p_error_message text default null
)
returns void as $$
begin
  update public.document_analysis
  set 
    status = p_status,
    progress = coalesce(p_progress, progress),
    error_message = p_error_message,
    started_at = case when p_status = 'processing' and started_at is null then now() else started_at end,
    completed_at = case when p_status in ('completed', 'failed', 'cancelled') then now() else completed_at end
  where id = p_analysis_id;
end;
$$ language plpgsql security definer;

-- Функция для сохранения результатов анализа
create or replace function save_analysis_result(
  p_analysis_id uuid,
  p_result_type text,
  p_result_data jsonb,
  p_confidence numeric default null,
  p_page_number integer default null,
  p_position jsonb default null
)
returns uuid as $$
declare
  v_result_id uuid;
begin
  insert into public.analysis_results (
    analysis_id,
    result_type,
    result_data,
    confidence,
    page_number,
    position
  ) values (
    p_analysis_id,
    p_result_type,
    p_result_data,
    p_confidence,
    p_page_number,
    p_position
  ) returning id into v_result_id;
  
  return v_result_id;
end;
$$ language plpgsql security definer;

-- Функция для извлечения сущностей
create or replace function extract_entity(
  p_analysis_id uuid,
  p_entity_type text,
  p_entity_value text,
  p_entity_label text default null,
  p_confidence numeric default 0.0,
  p_context text default null,
  p_page_number integer default null,
  p_position jsonb default null,
  p_metadata jsonb default '{}'
)
returns uuid as $$
declare
  v_entity_id uuid;
begin
  insert into public.extracted_entities (
    analysis_id,
    entity_type,
    entity_value,
    entity_label,
    confidence,
    context,
    page_number,
    position,
    metadata
  ) values (
    p_analysis_id,
    p_entity_type,
    p_entity_value,
    p_entity_label,
    p_confidence,
    p_context,
    p_page_number,
    p_position,
    p_metadata
  ) returning id into v_entity_id;
  
  return v_entity_id;
end;
$$ language plpgsql security definer;

-- Функция для получения статистики анализа
create or replace function get_analysis_stats(
  p_user_id uuid,
  p_days integer default 30
)
returns jsonb as $$
declare
  v_stats jsonb;
begin
  select jsonb_build_object(
    'total_analyses', count(*),
    'completed', count(*) filter (where status = 'completed'),
    'processing', count(*) filter (where status = 'processing'),
    'failed', count(*) filter (where status = 'failed'),
    'avg_accuracy', round(avg(accuracy_score), 2),
    'avg_confidence', round(avg(confidence_score), 2),
    'avg_processing_time_ms', round(avg(processing_time_ms)),
    'total_pages_processed', sum(page_count),
    'total_words_extracted', sum(word_count),
    'by_type', (
      select jsonb_object_agg(analysis_type, cnt)
      from (
        select analysis_type, count(*) as cnt
        from public.document_analysis
        where user_id = p_user_id
          and created_at > now() - (p_days || ' days')::interval
        group by analysis_type
      ) t
    ),
    'by_language', (
      select jsonb_object_agg(language_detected, cnt)
      from (
        select language_detected, count(*) as cnt
        from public.document_analysis
        where user_id = p_user_id
          and created_at > now() - (p_days || ' days')::interval
          and language_detected is not null
        group by language_detected
      ) t
    ),
    'top_entities', (
      select jsonb_agg(
        jsonb_build_object(
          'type', entity_type,
          'count', cnt
        )
      )
      from (
        select ee.entity_type, count(*) as cnt
        from public.extracted_entities ee
        join public.document_analysis da on da.id = ee.analysis_id
        where da.user_id = p_user_id
          and da.created_at > now() - (p_days || ' days')::interval
        group by ee.entity_type
        order by cnt desc
        limit 10
      ) t
    )
  ) into v_stats
  from public.document_analysis
  where user_id = p_user_id
    and created_at > now() - (p_days || ' days')::interval;
  
  return v_stats;
end;
$$ language plpgsql security definer;

-- Функция для применения шаблона к документу
create or replace function apply_template_to_document(
  p_analysis_id uuid,
  p_template_id uuid
)
returns jsonb as $$
declare
  v_template record;
  v_results jsonb;
begin
  -- Получаем шаблон
  select * into v_template
  from public.document_templates
  where id = p_template_id
    and is_active = true;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Template not found');
  end if;
  
  -- Обновляем счётчик использования
  update public.document_templates
  set usage_count = usage_count + 1
  where id = p_template_id;
  
  -- Возвращаем поля шаблона для извлечения
  return jsonb_build_object(
    'success', true,
    'template_name', v_template.template_name,
    'fields', v_template.fields,
    'validation_rules', v_template.validation_rules
  );
end;
$$ language plpgsql security definer;

-- RLS политики
alter table public.document_analysis enable row level security;
alter table public.analysis_results enable row level security;
alter table public.extracted_entities enable row level security;
alter table public.document_templates enable row level security;
alter table public.ai_training_data enable row level security;
alter table public.analysis_queue enable row level security;

-- Политики для document_analysis
create policy "Users can view their own analyses"
  on public.document_analysis for select
  using (auth.uid() = user_id);

create policy "Users can create their own analyses"
  on public.document_analysis for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own analyses"
  on public.document_analysis for update
  using (auth.uid() = user_id);

-- Политики для analysis_results
create policy "Users can view results of their analyses"
  on public.analysis_results for select
  using (
    exists (
      select 1 from public.document_analysis
      where id = analysis_results.analysis_id
        and user_id = auth.uid()
    )
  );

-- Политики для extracted_entities
create policy "Users can view entities from their analyses"
  on public.extracted_entities for select
  using (
    exists (
      select 1 from public.document_analysis
      where id = extracted_entities.analysis_id
        and user_id = auth.uid()
    )
  );

-- Политики для document_templates
create policy "Users can view public templates and their own"
  on public.document_templates for select
  using (is_public = true or user_id = auth.uid());

create policy "Users can manage their own templates"
  on public.document_templates for all
  using (auth.uid() = user_id);

-- Политики для ai_training_data
create policy "Users can view their own training data"
  on public.ai_training_data for select
  using (auth.uid() = user_id);

create policy "Users can create their own training data"
  on public.ai_training_data for insert
  with check (auth.uid() = user_id);

-- Включаем Realtime для таблиц
alter publication supabase_realtime add table public.document_analysis;
alter publication supabase_realtime add table public.analysis_results;

-- Комментарии
comment on table public.document_analysis is 'AI-анализ документов';
comment on table public.analysis_results is 'Результаты анализа документов';
comment on table public.extracted_entities is 'Извлечённые сущности из документов';
comment on table public.document_templates is 'Шаблоны для анализа документов';
comment on table public.ai_training_data is 'Данные для обучения AI';
comment on table public.analysis_queue is 'Очередь обработки документов';
