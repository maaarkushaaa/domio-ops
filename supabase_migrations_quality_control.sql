-- quality_control: система контроля качества производства
-- Таблицы: checklists (шаблоны), checks (пункты), inspections (проверки), results (результаты)

-- 1. quality_checklists: шаблоны чек-листов
drop table if exists public.quality_checklists cascade;
create table public.quality_checklists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  product_type text, -- тип изделия (опционально)
  is_template boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quality_checklists_product_type on public.quality_checklists(product_type);
create index idx_quality_checklists_created_by on public.quality_checklists(created_by);

-- 2. quality_checks: пункты проверки в чек-листах
drop table if exists public.quality_checks cascade;
create table public.quality_checks (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.quality_checklists(id) on delete cascade,
  name text not null,
  category text not null default 'other', -- visual, measurements, functionality, finish, other
  description text,
  is_required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_quality_checks_checklist on public.quality_checks(checklist_id);
create index idx_quality_checks_category on public.quality_checks(category);

-- 3. quality_inspections: проверки изделий
drop table if exists public.quality_inspections cascade;
create table public.quality_inspections (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  checklist_id uuid not null references public.quality_checklists(id) on delete restrict,
  inspector_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending', -- pending, in_progress, passed, failed
  score int, -- оценка 0-100
  notes text, -- комментарии инспектора
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quality_inspections_product on public.quality_inspections(product_id);
create index idx_quality_inspections_inspector on public.quality_inspections(inspector_id);
create index idx_quality_inspections_status on public.quality_inspections(status);
create index idx_quality_inspections_completed on public.quality_inspections(completed_at);

-- 4. quality_inspection_results: результаты по каждому пункту проверки
drop table if exists public.quality_inspection_results cascade;
create table public.quality_inspection_results (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.quality_inspections(id) on delete cascade,
  check_id uuid not null references public.quality_checks(id) on delete restrict,
  checked boolean not null default false,
  notes text,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_quality_inspection_results_inspection on public.quality_inspection_results(inspection_id);
create index idx_quality_inspection_results_check on public.quality_inspection_results(check_id);

-- Триггеры updated_at
drop trigger if exists trg_quality_checklists_updated_at on public.quality_checklists;
create trigger trg_quality_checklists_updated_at
before update on public.quality_checklists
for each row execute function public.set_updated_at();

drop trigger if exists trg_quality_inspections_updated_at on public.quality_inspections;
create trigger trg_quality_inspections_updated_at
before update on public.quality_inspections
for each row execute function public.set_updated_at();

-- RLS
alter table public.quality_checklists enable row level security;
alter table public.quality_checks enable row level security;
alter table public.quality_inspections enable row level security;
alter table public.quality_inspection_results enable row level security;

-- Политики: все аутентифицированные пользователи могут читать и писать (упрощённо для старта)
do $$ begin
  -- quality_checklists
  if not exists(select 1 from pg_policies where tablename='quality_checklists' and policyname='read all checklists') then
    create policy "read all checklists" on public.quality_checklists for select to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='quality_checklists' and policyname='insert checklists') then
    create policy "insert checklists" on public.quality_checklists for insert to authenticated with check (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='quality_checklists' and policyname='update checklists') then
    create policy "update checklists" on public.quality_checklists for update to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='quality_checklists' and policyname='delete checklists') then
    create policy "delete checklists" on public.quality_checklists for delete to authenticated using (true);
  end if;

  -- quality_checks
  if not exists(select 1 from pg_policies where tablename='quality_checks' and policyname='read all checks') then
    create policy "read all checks" on public.quality_checks for select to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='quality_checks' and policyname='manage checks') then
    create policy "manage checks" on public.quality_checks for all to authenticated using (true);
  end if;

  -- quality_inspections
  if not exists(select 1 from pg_policies where tablename='quality_inspections' and policyname='read all inspections') then
    create policy "read all inspections" on public.quality_inspections for select to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='quality_inspections' and policyname='manage inspections') then
    create policy "manage inspections" on public.quality_inspections for all to authenticated using (true);
  end if;

  -- quality_inspection_results
  if not exists(select 1 from pg_policies where tablename='quality_inspection_results' and policyname='read all results') then
    create policy "read all results" on public.quality_inspection_results for select to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='quality_inspection_results' and policyname='manage results') then
    create policy "manage results" on public.quality_inspection_results for all to authenticated using (true);
  end if;
end $$;

-- Realtime публикация
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quality_checklists') then
    alter publication supabase_realtime add table public.quality_checklists;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quality_checks') then
    alter publication supabase_realtime add table public.quality_checks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quality_inspections') then
    alter publication supabase_realtime add table public.quality_inspections;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quality_inspection_results') then
    alter publication supabase_realtime add table public.quality_inspection_results;
  end if;
end $$;

-- Вставка демо чек-листов
insert into public.quality_checklists (name, description, is_template) values
('Стандартная проверка мебели', 'Базовый чек-лист для контроля качества мебельных изделий', true),
('3D модели - полный контроль', 'Проверка качества 3D моделей: полигональность, текстуры, оптимизация', true),
('Проверка перед отгрузкой', 'Финальная проверка изделия перед отправкой клиенту', true),
('Входной контроль материалов', 'Проверка качества поступивших материалов и комплектующих', true),
('Экспресс-проверка', 'Быстрая проверка основных параметров изделия', true)
on conflict do nothing;

-- Добавляем пункты для каждого чек-листа
do $$
declare
  checklist_uuid uuid;
begin
  -- 1. Стандартная проверка мебели
  select id into checklist_uuid from public.quality_checklists where name = 'Стандартная проверка мебели' limit 1;
  if checklist_uuid is not null then
    insert into public.quality_checks (checklist_id, name, category, is_required, sort_order) values
    (checklist_uuid, 'Проверка размеров изделия', 'measurements', true, 1),
    (checklist_uuid, 'Состояние поверхности (царапины, сколы)', 'visual', true, 2),
    (checklist_uuid, 'Качество фурнитуры (петли, направляющие)', 'functionality', true, 3),
    (checklist_uuid, 'Финишная отделка (лак, краска)', 'finish', true, 4),
    (checklist_uuid, 'Цвет покрытия соответствует образцу', 'visual', false, 5),
    (checklist_uuid, 'Упаковка и маркировка', 'other', false, 6),
    (checklist_uuid, 'Функциональность механизмов', 'functionality', true, 7),
    (checklist_uuid, 'Соответствие чертежам', 'measurements', true, 8)
    on conflict do nothing;
  end if;

  -- 2. 3D модели - полный контроль
  select id into checklist_uuid from public.quality_checklists where name = '3D модели - полный контроль' limit 1;
  if checklist_uuid is not null then
    insert into public.quality_checks (checklist_id, name, category, is_required, sort_order) values
    (checklist_uuid, 'Поликаунт в пределах нормы (< 100K)', 'measurements', true, 1),
    (checklist_uuid, 'PBR-карты созданы и оптимизированы', 'visual', true, 2),
    (checklist_uuid, 'Вес GLB файла < 10MB', 'measurements', true, 3),
    (checklist_uuid, 'Пройдена glTF-валидация', 'functionality', true, 4),
    (checklist_uuid, 'Превью-рендер создан (2K, PNG)', 'visual', true, 5),
    (checklist_uuid, 'UV-развертка без наложений', 'visual', true, 6),
    (checklist_uuid, 'Нормали корректны', 'visual', false, 7),
    (checklist_uuid, 'LOD-уровни созданы', 'other', false, 8),
    (checklist_uuid, 'Материалы именованы правильно', 'other', true, 9),
    (checklist_uuid, 'Модель центрирована', 'measurements', true, 10)
    on conflict do nothing;
  end if;

  -- 3. Проверка перед отгрузкой
  select id into checklist_uuid from public.quality_checklists where name = 'Проверка перед отгрузкой' limit 1;
  if checklist_uuid is not null then
    insert into public.quality_checks (checklist_id, name, category, is_required, sort_order) values
    (checklist_uuid, 'Финальная визуальная проверка', 'visual', true, 1),
    (checklist_uuid, 'Соответствие заказу клиента', 'other', true, 2),
    (checklist_uuid, 'Упаковка (защита от повреждений)', 'other', true, 3),
    (checklist_uuid, 'Комплектация (все детали на месте)', 'other', true, 4),
    (checklist_uuid, 'Документация (инструкции, сертификаты)', 'other', true, 5),
    (checklist_uuid, 'Маркировка и этикетки', 'other', true, 6)
    on conflict do nothing;
  end if;

  -- 4. Входной контроль материалов
  select id into checklist_uuid from public.quality_checklists where name = 'Входной контроль материалов' limit 1;
  if checklist_uuid is not null then
    insert into public.quality_checks (checklist_id, name, category, is_required, sort_order) values
    (checklist_uuid, 'Соответствие спецификации', 'measurements', true, 1),
    (checklist_uuid, 'Отсутствие повреждений', 'visual', true, 2),
    (checklist_uuid, 'Сертификаты качества (если требуется)', 'other', true, 3),
    (checklist_uuid, 'Количество соответствует накладной', 'measurements', true, 4),
    (checklist_uuid, 'Маркировка и упаковка производителя', 'other', false, 5)
    on conflict do nothing;
  end if;

  -- 5. Экспресс-проверка
  select id into checklist_uuid from public.quality_checklists where name = 'Экспресс-проверка' limit 1;
  if checklist_uuid is not null then
    insert into public.quality_checks (checklist_id, name, category, is_required, sort_order) values
    (checklist_uuid, 'Размеры в норме', 'measurements', true, 1),
    (checklist_uuid, 'Нет видимых дефектов', 'visual', true, 2),
    (checklist_uuid, 'Механизмы работают', 'functionality', true, 3)
    on conflict do nothing;
  end if;
end $$;

