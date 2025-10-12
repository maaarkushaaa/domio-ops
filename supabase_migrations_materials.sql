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

-- Вставка расширенного каталога материалов
insert into public.materials (name, category, unit, price_per_unit, stock_quantity, min_stock, supplier) values
-- ЛДСП EGGER (популярные декоры)
('EGGER H1137 ST9 Дуб Галифакс белый', 'ЛДСП EGGER', 'м²', 1250.00, 28.0, 10.0, 'EGGER'),
('EGGER H1176 ST9 Дуб Галифакс натуральный', 'ЛДСП EGGER', 'м²', 1250.00, 32.0, 10.0, 'EGGER'),
('EGGER H1181 ST10 Дуб Бардолино серый', 'ЛДСП EGGER', 'м²', 1250.00, 25.0, 10.0, 'EGGER'),
('EGGER H3309 ST28 Дуб Небраска натуральный', 'ЛДСП EGGER', 'м²', 1280.00, 30.0, 10.0, 'EGGER'),
('EGGER H3450 ST22 Дуб Гладстоун песочный', 'ЛДСП EGGER', 'м²', 1280.00, 22.0, 10.0, 'EGGER'),
('EGGER H1318 ST10 Дуб Суннберг', 'ЛДСП EGGER', 'м²', 1250.00, 35.0, 10.0, 'EGGER'),
('EGGER H3070 ST22 Дуб Аризона серый', 'ЛДСП EGGER', 'м²', 1280.00, 18.0, 10.0, 'EGGER'),
('EGGER U702 ST9 Кашемир серый', 'ЛДСП EGGER', 'м²', 1180.00, 45.0, 15.0, 'EGGER'),
('EGGER U708 ST9 Светло-серый', 'ЛДСП EGGER', 'м²', 1180.00, 40.0, 15.0, 'EGGER'),
('EGGER U727 ST9 Камень Сонора бежевый', 'ЛДСП EGGER', 'м²', 1200.00, 20.0, 10.0, 'EGGER'),
('EGGER U763 ST9 Перламутровый серый', 'ЛДСП EGGER', 'м²', 1200.00, 25.0, 10.0, 'EGGER'),
('EGGER U899 ST9 Кашемир', 'ЛДСП EGGER', 'м²', 1180.00, 38.0, 15.0, 'EGGER'),
('EGGER W980 ST2 Платиновый серый', 'ЛДСП EGGER', 'м²', 1150.00, 50.0, 20.0, 'EGGER'),
('EGGER W1000 ST9 Белый Premium', 'ЛДСП EGGER', 'м²', 1150.00, 60.0, 25.0, 'EGGER'),
('EGGER U999 ST2 Чёрный', 'ЛДСП EGGER', 'м²', 1150.00, 30.0, 10.0, 'EGGER'),
('EGGER F637 ST16 Хромикс белый', 'ЛДСП EGGER', 'м²', 1320.00, 15.0, 8.0, 'EGGER'),
('EGGER F509 ST2 Сталь тёмная', 'ЛДСП EGGER', 'м²', 1320.00, 12.0, 8.0, 'EGGER'),
('EGGER H1342 ST10 Клён Гальский', 'ЛДСП EGGER', 'м²', 1250.00, 20.0, 10.0, 'EGGER'),
('EGGER H1145 ST10 Дуб Сорано чёрно-коричневый', 'ЛДСП EGGER', 'м²', 1250.00, 18.0, 10.0, 'EGGER'),
('EGGER H3840 ST38 Орех Диамант', 'ЛДСП EGGER', 'м²', 1280.00, 22.0, 10.0, 'EGGER'),

-- Кромка EGGER (под декоры)
('Кромка ABS 2мм H1137 Дуб Галифакс белый', 'Кромка EGGER', 'м', 45.00, 200.0, 50.0, 'EGGER'),
('Кромка ABS 2мм H1176 Дуб Галифакс натуральный', 'Кромка EGGER', 'м', 45.00, 180.0, 50.0, 'EGGER'),
('Кромка ABS 2мм U702 Кашемир серый', 'Кромка EGGER', 'м', 42.00, 220.0, 50.0, 'EGGER'),
('Кромка ABS 2мм W1000 Белый Premium', 'Кромка EGGER', 'м', 42.00, 300.0, 80.0, 'EGGER'),
('Кромка ABS 2мм U999 Чёрный', 'Кромка EGGER', 'м', 42.00, 150.0, 40.0, 'EGGER'),
('Кромка ПВХ 0.4мм W1000 Белый', 'Кромка EGGER', 'м', 18.00, 400.0, 100.0, 'EGGER'),
('Кромка ПВХ 1мм W1000 Белый', 'Кромка EGGER', 'м', 25.00, 350.0, 80.0, 'EGGER'),

-- Фурнитура Blum (самая популярная)
('Blum Clip Top 71T3550 петля накладная с доводчиком', 'Фурнитура Blum', 'шт', 285.00, 120, 40, 'Blum'),
('Blum Clip Top 71T3650 петля полунакладная с доводчиком', 'Фурнитура Blum', 'шт', 285.00, 80, 30, 'Blum'),
('Blum Clip Top 71T3750 петля вкладная с доводчиком', 'Фурнитура Blum', 'шт', 285.00, 60, 25, 'Blum'),
('Blum Clip Top 79B3550 петля накладная угловая', 'Фурнитура Blum', 'шт', 310.00, 40, 15, 'Blum'),
('Blum Tandem 550H5000 направляющая 500мм с доводчиком', 'Фурнитура Blum', 'пара', 850.00, 45, 15, 'Blum'),
('Blum Tandem 550H4500 направляющая 450мм с доводчиком', 'Фурнитура Blum', 'пара', 820.00, 50, 20, 'Blum'),
('Blum Tandem 550H5500 направляющая 550мм с доводчиком', 'Фурнитура Blum', 'пара', 880.00, 35, 15, 'Blum'),
('Blum Movento 760H5000 направляющая TIP-ON 500мм', 'Фурнитура Blum', 'пара', 1250.00, 25, 10, 'Blum'),
('Blum Aventos HK-S подъёмник фасада (600-1000мм)', 'Фурнитура Blum', 'компл', 4200.00, 12, 5, 'Blum'),
('Blum Aventos HF подъёмник фасада складной', 'Фурнитура Blum', 'компл', 5800.00, 8, 3, 'Blum'),
('Blum Servo-Drive электропривод для Aventos', 'Фурнитура Blum', 'шт', 15500.00, 4, 2, 'Blum'),

-- Фурнитура Hettich
('Hettich Sensys 8645i петля накладная с доводчиком', 'Фурнитура Hettich', 'шт', 260.00, 100, 35, 'Hettich'),
('Hettich Sensys 8646i петля полунакладная с доводчиком', 'Фурнитура Hettich', 'шт', 260.00, 70, 25, 'Hettich'),
('Hettich InnoTech 470мм направляющая с доводчиком', 'Фурнитура Hettich', 'пара', 720.00, 55, 20, 'Hettich'),
('Hettich InnoTech 520мм направляющая с доводчиком', 'Фурнитура Hettich', 'пара', 750.00, 48, 18, 'Hettich'),
('Hettich Quadro V6+ 450мм направляющая скрытого монтажа', 'Фурнитура Hettich', 'пара', 980.00, 30, 12, 'Hettich'),
('Hettich Quadro V6+ 500мм направляющая скрытого монтажа', 'Фурнитура Hettich', 'пара', 1020.00, 28, 10, 'Hettich'),
('Hettich AvanTech 470мм ящик с Push-to-Open', 'Фурнитура Hettich', 'компл', 2200.00, 20, 8, 'Hettich'),
('Hettich Silent System амортизатор для дверей', 'Фурнитура Hettich', 'шт', 180.00, 150, 50, 'Hettich'),

-- Фурнитура GTV (польская, бюджетная)
('GTV PRESTIGE петля накладная с доводчиком', 'Фурнитура GTV', 'шт', 145.00, 200, 60, 'GTV Poland'),
('GTV PRESTIGE петля полунакладная с доводчиком', 'Фурнитура GTV', 'шт', 145.00, 150, 50, 'GTV Poland'),
('GTV Jet метабокс 450мм серый', 'Фурнитура GTV', 'компл', 580.00, 65, 25, 'GTV Poland'),
('GTV Jet метабокс 500мм серый', 'Фурнитура GTV', 'компл', 620.00, 58, 22, 'GTV Poland'),
('GTV Push-to-Open толкатель для дверей', 'Фурнитура GTV', 'шт', 85.00, 180, 60, 'GTV Poland'),
('GTV Push-to-Open толкатель для ящиков', 'Фурнитура GTV', 'шт', 95.00, 160, 50, 'GTV Poland'),

-- Ручки мебельные
('Ручка-скоба 128мм хром матовый', 'Ручки', 'шт', 65.00, 250, 80, 'ООО "Фурнитура-Стиль"'),
('Ручка-скоба 160мм хром матовый', 'Ручки', 'шт', 75.00, 220, 70, 'ООО "Фурнитура-Стиль"'),
('Ручка-скоба 128мм чёрный мат', 'Ручки', 'шт', 80.00, 200, 60, 'ООО "Фурнитура-Стиль"'),
('Ручка-кнопка d=30мм хром', 'Ручки', 'шт', 35.00, 400, 120, 'ООО "Фурнитура-Стиль"'),
('Ручка-профиль 2500мм алюминий', 'Ручки', 'шт', 320.00, 45, 15, 'ООО "Фурнитура-Стиль"'),
('Ручка врезная 2500мм чёрная', 'Ручки', 'шт', 380.00, 35, 12, 'ООО "Фурнитура-Стиль"'),

-- Крепёж и метизы (расширенный)
('Конфирматы 5x70', 'Крепеж', 'шт', 2.50, 10000, 2000, 'ООО "МетизСнаб"'),
('Конфирматы 7x50', 'Крепеж', 'шт', 3.00, 8000, 1500, 'ООО "МетизСнаб"'),
('Минификс 15x12мм', 'Крепеж', 'шт', 4.50, 5000, 1000, 'ООО "МетизСнаб"'),
('Эксцентрик 15мм под минификс', 'Крепеж', 'шт', 3.80, 5000, 1000, 'ООО "МетизСнаб"'),
('Саморезы 4x16 белые', 'Крепеж', 'шт', 0.90, 12000, 3000, 'ООО "МетизСнаб"'),
('Саморезы 4x16 чёрные', 'Крепеж', 'шт', 1.00, 10000, 2500, 'ООО "МетизСнаб"'),
('Саморезы 3x16 под петли', 'Крепеж', 'шт', 0.70, 15000, 3500, 'ООО "МетизСнаб"'),
('Шканты 8x30', 'Крепеж', 'шт', 1.00, 8000, 1500, 'ООО "МетизСнаб"'),
('Шканты 8x40', 'Крепеж', 'шт', 1.20, 7000, 1500, 'ООО "МетизСнаб"'),
('Шканты 6x30', 'Крепеж', 'шт', 0.80, 10000, 2000, 'ООО "МетизСнаб"'),
('Уголок мебельный усиленный', 'Крепеж', 'шт', 5.50, 2000, 400, 'ООО "МетизСнаб"'),
('Стяжка межсекционная', 'Крепеж', 'шт', 8.00, 1500, 300, 'ООО "МетизСнаб"'),
('Полкодержатель пластик прозрачный', 'Крепеж', 'шт', 2.00, 3000, 600, 'ООО "МетизСнаб"'),
('Полкодержатель металл хром', 'Крепеж', 'шт', 4.50, 2000, 400, 'ООО "МетизСнаб"'),
('Подпятник регулируемый h=100мм', 'Крепеж', 'шт', 12.00, 1000, 200, 'ООО "МетизСнаб"'),
('Подпятник регулируемый h=150мм', 'Крепеж', 'шт', 15.00, 800, 150, 'ООО "МетизСнаб"'),

-- Освещение
('Светодиодная лента 12V 60led/m белая тёплая', 'Освещение', 'м', 120.00, 150.0, 40.0, 'ООО "СветТехника"'),
('Светодиодная лента 12V 60led/m белая холодная', 'Освещение', 'м', 120.00, 140.0, 40.0, 'ООО "СветТехника"'),
('Блок питания 12V 60W для LED', 'Освещение', 'шт', 450.00, 35, 10, 'ООО "СветТехника"'),
('Профиль алюминиевый для LED врезной 2м', 'Освещение', 'шт', 180.00, 80, 25, 'ООО "СветТехника"'),
('Датчик движения PIR мебельный', 'Освещение', 'шт', 280.00, 45, 15, 'ООО "СветТехника"'),
('Сенсорный выключатель для LED', 'Освещение', 'шт', 150.00, 60, 20, 'ООО "СветТехника"'),

-- Системы хранения
('Штанга хромированная d=25мм 3000мм', 'Системы хранения', 'шт', 420.00, 50, 15, 'ООО "Гардероб-Систем"'),
('Кронштейн под штангу d=25мм хром', 'Системы хранения', 'шт', 45.00, 200, 60, 'ООО "Гардероб-Систем"'),
('Пантограф 600-900мм хром', 'Системы хранения', 'шт', 850.00, 25, 8, 'ООО "Гардероб-Систем"'),
('Корзина выдвижная 450мм хром', 'Системы хранения', 'шт', 1200.00, 18, 6, 'ООО "Гардероб-Систем"'),
('Брючница выдвижная 450мм', 'Системы хранения', 'шт', 1450.00, 12, 5, 'ООО "Гардероб-Систем"'),
('Галстучница выдвижная 450мм', 'Системы хранения', 'шт', 1350.00, 10, 4, 'ООО "Гардероб-Систем"'),
('Обувница наклонная 600мм', 'Системы хранения', 'шт', 980.00, 15, 6, 'ООО "Гардероб-Систем"'),

-- Покрытия и клеи
('Лак акриловый матовый', 'Покрытие', 'л', 480.00, 25.0, 10.0, 'ООО "ХимПром"'),
('Лак акриловый глянцевый', 'Покрытие', 'л', 520.00, 20.0, 8.0, 'ООО "ХимПром"'),
('Морилка орех', 'Покрытие', 'л', 290.00, 15.0, 6.0, 'ООО "ХимПром"'),
('Морилка венге', 'Покрытие', 'л', 310.00, 12.0, 5.0, 'ООО "ХимПром"'),
('Клей ПВА столярный D3', 'Клеи', 'кг', 180.00, 50.0, 20.0, 'ООО "ХимПром"'),
('Клей-расплав EVA для кромки', 'Клеи', 'кг', 320.00, 30.0, 10.0, 'ООО "ХимПром"'),
('Клей контактный "Момент"', 'Клеи', 'л', 450.00, 20.0, 8.0, 'ООО "ХимПром"'),

-- Упаковка
('Стрейч-плёнка 50см x 300м', 'Упаковка', 'рулон', 380.00, 45, 15, 'ООО "ПакЭксперт"'),
('Воздушно-пузырьковая плёнка 1.5м x 100м', 'Упаковка', 'рулон', 1200.00, 20, 8, 'ООО "ПакЭксперт"'),
('Картон гофрированный лист 1200x800мм', 'Упаковка', 'лист', 45.00, 500, 100, 'ООО "ПакЭксперт"'),
('Скотч упаковочный прозрачный 50мм x 66м', 'Упаковка', 'рулон', 65.00, 200, 50, 'ООО "ПакЭксперт"'),
('Уголок защитный картонный 50x50x3мм', 'Упаковка', 'шт', 15.00, 1000, 200, 'ООО "ПакЭксперт"')
on conflict do nothing;

