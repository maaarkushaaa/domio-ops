-- Document Versioning System
-- Таблицы для версионирования документов с историей изменений

-- Документы (основная таблица) - создаём или обновляем
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'documents') then
    create table public.documents (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      description text,
      project_id uuid references public.projects(id) on delete cascade,
      created_by uuid not null references auth.users(id) on delete set null,
      created_at timestamp with time zone not null default now(),
      updated_at timestamp with time zone not null default now(),
      current_version_id uuid,
      status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'archived')),
      tags text[],
      category text default 'general' check (category in ('general', 'contract', 'specification', 'drawing', 'report', 'other'))
    );
  else
    -- Добавляем недостающие колонки если таблица уже существует
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'created_by') then
      alter table public.documents add column created_by uuid references auth.users(id) on delete set null;
      update public.documents set created_by = (select id from auth.users limit 1) where created_by is null;
      alter table public.documents alter column created_by set not null;
    end if;
    
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'updated_at') then
      alter table public.documents add column updated_at timestamp with time zone not null default now();
    end if;
    
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'current_version_id') then
      alter table public.documents add column current_version_id uuid;
    end if;
    
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'status') then
      alter table public.documents add column status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'archived'));
    end if;
    
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'tags') then
      alter table public.documents add column tags text[];
    end if;
    
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'documents' and column_name = 'category') then
      alter table public.documents add column category text default 'general' check (category in ('general', 'contract', 'specification', 'drawing', 'report', 'other'));
    end if;
  end if;
end $$;

-- Версии документов
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null,
  file_path text not null, -- путь в Supabase Storage
  file_name text not null,
  file_size bigint not null,
  mime_type text not null,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  comment text,
  changes_summary text,
  unique (document_id, version_number)
);

-- История изменений (audit log)
create table if not exists public.document_history (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_id uuid references public.document_versions(id) on delete set null,
  action text not null check (action in ('created', 'updated', 'deleted', 'approved', 'rejected', 'restored')),
  user_id uuid not null references auth.users(id) on delete set null,
  metadata jsonb,
  created_at timestamp with time zone not null default now()
);

-- Комментарии к версиям
create table if not exists public.document_comments (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.document_versions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  comment text not null,
  created_at timestamp with time zone not null default now()
);

-- Индексы
create index if not exists documents_project_idx on public.documents (project_id);
create index if not exists documents_created_by_idx on public.documents (created_by);
create index if not exists documents_status_idx on public.documents (status);
create index if not exists documents_category_idx on public.documents (category);

create index if not exists document_versions_document_idx on public.document_versions (document_id, version_number desc);
create index if not exists document_versions_created_at_idx on public.document_versions (created_at desc);

create index if not exists document_history_document_idx on public.document_history (document_id, created_at desc);
create index if not exists document_history_user_idx on public.document_history (user_id);

create index if not exists document_comments_version_idx on public.document_comments (version_id);

-- Foreign key для current_version_id (добавляем после создания document_versions)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'documents_current_version_fk' 
    and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents 
      add constraint documents_current_version_fk 
      foreign key (current_version_id) 
      references public.document_versions(id) 
      on delete set null;
  end if;
end $$;

-- RLS
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_history enable row level security;
alter table public.document_comments enable row level security;

-- Policies: authenticated can read all, create; update/delete only authors or admins
drop policy if exists documents_select_all on public.documents;
create policy documents_select_all on public.documents for select using (auth.role() = 'authenticated');

drop policy if exists documents_insert_auth on public.documents;
create policy documents_insert_auth on public.documents for insert with check (auth.uid() = created_by);

drop policy if exists documents_update_owner on public.documents;
create policy documents_update_owner on public.documents for update using (auth.uid() = created_by);

drop policy if exists documents_delete_owner on public.documents;
create policy documents_delete_owner on public.documents for delete using (auth.uid() = created_by);

-- Document versions policies
drop policy if exists document_versions_select_all on public.document_versions;
create policy document_versions_select_all on public.document_versions for select using (auth.role() = 'authenticated');

drop policy if exists document_versions_insert_auth on public.document_versions;
create policy document_versions_insert_auth on public.document_versions for insert with check (auth.role() = 'authenticated');

-- Document history policies
drop policy if exists document_history_select_all on public.document_history;
create policy document_history_select_all on public.document_history for select using (auth.role() = 'authenticated');

drop policy if exists document_history_insert_auth on public.document_history;
create policy document_history_insert_auth on public.document_history for insert with check (auth.role() = 'authenticated');

-- Document comments policies
drop policy if exists document_comments_select_all on public.document_comments;
create policy document_comments_select_all on public.document_comments for select using (auth.role() = 'authenticated');

drop policy if exists document_comments_insert_auth on public.document_comments;
create policy document_comments_insert_auth on public.document_comments for insert with check (auth.uid() = user_id);

drop policy if exists document_comments_delete_owner on public.document_comments;
create policy document_comments_delete_owner on public.document_comments for delete using (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
create or replace function update_documents_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_documents_updated_at_trigger on public.documents;
create trigger update_documents_updated_at_trigger
  before update on public.documents
  for each row
  execute function update_documents_updated_at();

-- Функция для автоматического создания записи в истории
create or replace function log_document_change()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.document_history (document_id, action, user_id, metadata)
    values (new.id, 'created', auth.uid(), jsonb_build_object('name', new.name));
  elsif (TG_OP = 'UPDATE') then
    insert into public.document_history (document_id, version_id, action, user_id, metadata)
    values (new.id, new.current_version_id, 'updated', auth.uid(), jsonb_build_object('status', new.status));
  elsif (TG_OP = 'DELETE') then
    insert into public.document_history (document_id, action, user_id, metadata)
    values (old.id, 'deleted', auth.uid(), jsonb_build_object('name', old.name));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists log_document_change_trigger on public.documents;
create trigger log_document_change_trigger
  after insert or update or delete on public.documents
  for each row
  execute function log_document_change();

-- Enable Realtime
do $$
begin
  -- Добавляем таблицы в publication только если их там ещё нет
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'documents'
  ) then
    alter publication supabase_realtime add table public.documents;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'document_versions'
  ) then
    alter publication supabase_realtime add table public.document_versions;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'document_history'
  ) then
    alter publication supabase_realtime add table public.document_history;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'document_comments'
  ) then
    alter publication supabase_realtime add table public.document_comments;
  end if;
end $$;
