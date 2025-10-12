-- materials: справочник материалов и связь с изделиями
-- Таблицы: materials (материалы), product_materials (связь изделий и материалов)

-- 1. materials: справочник материалов
drop table if exists public.materials cascade;
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text, -- ЛДСП, Фурнитура, Крепеж, Ткань, Металл и т.д.
  unit text not null default 'шт', -- шт, м, м², м³, кг, л, пог.м
  price_per_unit numeric(10,2),
  stock_quantity numeric(10,2) default 0,
  min_stock numeric(10,2), -- минимальный остаток для уведомления
  supplier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_materials_category on public.materials(category);
create index idx_materials_name on public.materials(name);

-- 2. product_materials: связь изделий и материалов (BOM)
drop table if exists public.product_materials cascade;
create table public.product_materials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  quantity numeric(10,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, material_id)
);

create index idx_product_materials_product on public.product_materials(product_id);
create index idx_product_materials_material on public.product_materials(material_id);

-- Триггеры updated_at
drop trigger if exists trg_materials_updated_at on public.materials;
create trigger trg_materials_updated_at
before update on public.materials
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_materials_updated_at on public.product_materials;
create trigger trg_product_materials_updated_at
before update on public.product_materials
for each row execute function public.set_updated_at();

-- RLS
alter table public.materials enable row level security;
alter table public.product_materials enable row level security;

do $$ begin
  -- materials
  if not exists(select 1 from pg_policies where tablename='materials' and policyname='read all materials') then
    create policy "read all materials" on public.materials for select to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='materials' and policyname='manage materials') then
    create policy "manage materials" on public.materials for all to authenticated using (true);
  end if;

  -- product_materials
  if not exists(select 1 from pg_policies where tablename='product_materials' and policyname='read all product_materials') then
    create policy "read all product_materials" on public.product_materials for select to authenticated using (true);
  end if;
  if not exists(select 1 from pg_policies where tablename='product_materials' and policyname='manage product_materials') then
    create policy "manage product_materials" on public.product_materials for all to authenticated using (true);
  end if;
end $$;

-- Realtime публикация
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'materials') then
    alter publication supabase_realtime add table public.materials;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'product_materials') then
    alter publication supabase_realtime add table public.product_materials;
  end if;
end $$;

-- Вставка демо-материалов
insert into public.materials (name, category, unit, price_per_unit, stock_quantity, min_stock, supplier) values
('ЛДСП 16мм белый', 'ЛДСП', 'м²', 850.00, 25.5, 10.0, 'ООО "МебельКомплект"'),
('ЛДСП 16мм венге', 'ЛДСП', 'м²', 920.00, 18.0, 10.0, 'ООО "МебельКомплект"'),
('ЛДСП 16мм дуб сонома', 'ЛДСП', 'м²', 880.00, 32.0, 15.0, 'ООО "МебельКомплект"'),
('Кромка ПВХ 2мм белая', 'Кромка', 'м', 12.50, 150.0, 50.0, 'ООО "Кромка+"'),
('Кромка ПВХ 2мм венге', 'Кромка', 'м', 13.00, 100.0, 40.0, 'ООО "Кромка+"'),
('Петли Blum Clip Top', 'Фурнитура', 'шт', 245.00, 48, 20, 'ООО "Фурнитура-Люкс"'),
('Направляющие Hettich 500мм', 'Фурнитура', 'пара', 420.00, 28, 10, 'ООО "Фурнитура-Люкс"'),
('Направляющие Hettich 400мм', 'Фурнитура', 'пара', 380.00, 35, 15, 'ООО "Фурнитура-Люкс"'),
('Конфирматы 5x70', 'Крепеж', 'шт', 2.50, 5000, 1000, 'ООО "МетизСнаб"'),
('Саморезы 4x16', 'Крепеж', 'шт', 0.80, 8000, 2000, 'ООО "МетизСнаб"'),
('Шканты 8x40', 'Крепеж', 'шт', 1.20, 3000, 500, 'ООО "МетизСнаб"'),
('Лак акриловый прозрачный', 'Покрытие', 'л', 450.00, 12.0, 5.0, 'ООО "ХимПром"'),
('Морилка дуб', 'Покрытие', 'л', 280.00, 8.0, 3.0, 'ООО "ХимПром"'),
('Ткань обивочная велюр серая', 'Ткань', 'м', 680.00, 45.0, 20.0, 'ООО "ТекстильТорг"'),
('Поролон мебельный 30мм', 'Наполнитель', 'м²', 220.00, 60.0, 25.0, 'ООО "ПолимерСнаб"')
on conflict do nothing;

