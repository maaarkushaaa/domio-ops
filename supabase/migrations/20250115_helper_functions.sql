-- Helper Functions for Migrations
-- Вспомогательные функции для миграций

-- Функция для безопасного добавления таблицы в publication
create or replace function add_table_to_publication(
  p_publication_name text,
  p_schema_name text,
  p_table_name text
)
returns void as $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = p_publication_name
    and schemaname = p_schema_name
    and tablename = p_table_name
  ) then
    execute format('alter publication %I add table %I.%I', 
      p_publication_name, p_schema_name, p_table_name);
  end if;
end;
$$ language plpgsql;

-- Функция для безопасного добавления constraint
create or replace function add_constraint_if_not_exists(
  p_table_name text,
  p_constraint_name text,
  p_constraint_definition text
)
returns void as $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = p_constraint_name
    and conrelid = p_table_name::regclass
  ) then
    execute format('alter table %s add constraint %I %s', 
      p_table_name, p_constraint_name, p_constraint_definition);
  end if;
end;
$$ language plpgsql;

comment on function add_table_to_publication is 'Безопасно добавляет таблицу в publication если её там ещё нет';
comment on function add_constraint_if_not_exists is 'Безопасно добавляет constraint если он ещё не существует';
