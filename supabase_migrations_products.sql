-- products: таблица изделий/продукции
-- Создание таблицы, индексов, RLS, Realtime

-- Удаляем старую таблицу если существует (для чистой миграции)
drop table if exists public.products cascade;

-- Создаём таблицу products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  description text,
  status text not null default 'planning' check (status in ('planning', 'in_progress', 'quality_check', 'completed', 'on_hold')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  assignee_id uuid references auth.users(id) on delete set null,
  deadline timestamptz,
  unit_price numeric(12, 2),
  quantity_in_stock numeric(12, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Индексы
create index idx_products_status on public.products(status);
create index idx_products_assignee_id on public.products(assignee_id);
create index idx_products_created_at on public.products(created_at);
create index idx_products_name on public.products(name);

-- Триггер updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- RLS
alter table public.products enable row level security;

do $$ begin
  -- Политики для чтения
  if not exists(select 1 from pg_policies where tablename='products' and policyname='read all products') then
    create policy "read all products" on public.products for select to authenticated using (true);
  end if;
  
  -- Политики для создания (любой авторизованный пользователь)
  if not exists(select 1 from pg_policies where tablename='products' and policyname='insert products') then
    create policy "insert products" on public.products for insert to authenticated with check (true);
  end if;
  
  -- Политики для обновления (любой авторизованный пользователь)
  if not exists(select 1 from pg_policies where tablename='products' and policyname='update products') then
    create policy "update products" on public.products for update to authenticated using (true) with check (true);
  end if;
  
  -- Политики для удаления (любой авторизованный пользователь)
  if not exists(select 1 from pg_policies where tablename='products' and policyname='delete products') then
    create policy "delete products" on public.products for delete to authenticated using (true);
  end if;
end $$;

-- Realtime публикация
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;

-- Демо-данные (опционально, можно удалить)
insert into public.products (name, description, status, progress, unit_price, quantity_in_stock) values
('Шкаф-купе Бергамо', 'Двухдверный шкаф с зеркалом, 2000x600x2400мм', 'in_progress', 45, 35000.00, 0),
('Кухонный гарнитур Модерн', 'Угловая кухня 3.2м, ЛДСП + МДФ фасады', 'quality_check', 90, 85000.00, 0),
('Прихожая Комфорт', 'Модульная система: шкаф + обувница + зеркало', 'planning', 0, 28000.00, 0),
('Стол письменный Лофт', 'Письменный стол в стиле лофт, 1200x600x750мм', 'completed', 100, 12500.00, 3),
('Кровать двуспальная Скандинавия', 'Кровать 1600x2000 с подъёмным механизмом', 'in_progress', 60, 32000.00, 0)
on conflict do nothing;

