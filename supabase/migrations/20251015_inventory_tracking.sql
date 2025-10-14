-- Inventory Tracking System
-- Система учёта запасов материалов с realtime обновлениями и алертами

-- Категории материалов
create table if not exists public.material_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamp with time zone not null default now()
);

-- Материалы/запасы
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  category_id uuid references public.material_categories(id) on delete set null,
  description text,
  unit text not null default 'шт' check (unit in ('шт', 'м', 'м²', 'м³', 'кг', 'л', 'упак')),
  current_quantity decimal(10,2) not null default 0,
  min_quantity decimal(10,2) not null default 0, -- минимальный остаток для алерта
  max_quantity decimal(10,2), -- максимальный остаток
  unit_price decimal(10,2),
  location text, -- местоположение на складе
  supplier text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- История движения запасов
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjustment', 'reserve', 'unreserve')),
  quantity decimal(10,2) not null,
  quantity_before decimal(10,2) not null,
  quantity_after decimal(10,2) not null,
  reason text,
  reference_type text check (reference_type in ('project', 'task', 'order', 'manual')),
  reference_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

-- Резервирование материалов под проекты/задачи
create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity decimal(10,2) not null,
  reserved_for_type text not null check (reserved_for_type in ('project', 'task')),
  reserved_for_id uuid not null,
  reserved_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamp with time zone,
  status text not null default 'active' check (status in ('active', 'fulfilled', 'cancelled')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Алерты по запасам
create table if not exists public.inventory_alerts (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  alert_type text not null check (alert_type in ('low_stock', 'out_of_stock', 'overstocked', 'expiring')),
  message text not null,
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  acknowledged boolean not null default false,
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- Индексы
create index if not exists inventory_items_category_idx on public.inventory_items (category_id);
create index if not exists inventory_items_sku_idx on public.inventory_items (sku);
create index if not exists inventory_items_quantity_idx on public.inventory_items (current_quantity);

create index if not exists inventory_transactions_item_idx on public.inventory_transactions (item_id, created_at desc);
create index if not exists inventory_transactions_type_idx on public.inventory_transactions (type);
create index if not exists inventory_transactions_reference_idx on public.inventory_transactions (reference_type, reference_id);

create index if not exists inventory_reservations_item_idx on public.inventory_reservations (item_id);
create index if not exists inventory_reservations_status_idx on public.inventory_reservations (status);
create index if not exists inventory_reservations_reference_idx on public.inventory_reservations (reserved_for_type, reserved_for_id);

create index if not exists inventory_alerts_item_idx on public.inventory_alerts (item_id);
create index if not exists inventory_alerts_acknowledged_idx on public.inventory_alerts (acknowledged, created_at desc);

-- RLS
alter table public.material_categories enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.inventory_alerts enable row level security;

-- Policies: authenticated can read all, insert/update based on role
drop policy if exists material_categories_select_all on public.material_categories;
create policy material_categories_select_all on public.material_categories for select using (auth.role() = 'authenticated');

drop policy if exists material_categories_insert_auth on public.material_categories;
create policy material_categories_insert_auth on public.material_categories for insert with check (auth.role() = 'authenticated');

drop policy if exists inventory_items_select_all on public.inventory_items;
create policy inventory_items_select_all on public.inventory_items for select using (auth.role() = 'authenticated');

drop policy if exists inventory_items_insert_auth on public.inventory_items;
create policy inventory_items_insert_auth on public.inventory_items for insert with check (auth.role() = 'authenticated');

drop policy if exists inventory_items_update_auth on public.inventory_items;
create policy inventory_items_update_auth on public.inventory_items for update using (auth.role() = 'authenticated');

drop policy if exists inventory_transactions_select_all on public.inventory_transactions;
create policy inventory_transactions_select_all on public.inventory_transactions for select using (auth.role() = 'authenticated');

drop policy if exists inventory_transactions_insert_auth on public.inventory_transactions;
create policy inventory_transactions_insert_auth on public.inventory_transactions for insert with check (auth.role() = 'authenticated');

drop policy if exists inventory_reservations_select_all on public.inventory_reservations;
create policy inventory_reservations_select_all on public.inventory_reservations for select using (auth.role() = 'authenticated');

drop policy if exists inventory_reservations_insert_auth on public.inventory_reservations;
create policy inventory_reservations_insert_auth on public.inventory_reservations for insert with check (auth.uid() = reserved_by);

drop policy if exists inventory_reservations_update_owner on public.inventory_reservations;
create policy inventory_reservations_update_owner on public.inventory_reservations for update using (auth.uid() = reserved_by);

drop policy if exists inventory_alerts_select_all on public.inventory_alerts;
create policy inventory_alerts_select_all on public.inventory_alerts for select using (auth.role() = 'authenticated');

drop policy if exists inventory_alerts_insert_auth on public.inventory_alerts;
create policy inventory_alerts_insert_auth on public.inventory_alerts for insert with check (auth.role() = 'authenticated');

drop policy if exists inventory_alerts_update_auth on public.inventory_alerts;
create policy inventory_alerts_update_auth on public.inventory_alerts for update using (auth.role() = 'authenticated');

-- Функция для автообновления updated_at
create or replace function update_inventory_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_inventory_items_updated_at_trigger on public.inventory_items;
create trigger update_inventory_items_updated_at_trigger
  before update on public.inventory_items
  for each row
  execute function update_inventory_updated_at();

drop trigger if exists update_inventory_reservations_updated_at_trigger on public.inventory_reservations;
create trigger update_inventory_reservations_updated_at_trigger
  before update on public.inventory_reservations
  for each row
  execute function update_inventory_updated_at();

-- Функция для создания транзакции при изменении количества
create or replace function log_inventory_transaction()
returns trigger as $$
begin
  if (TG_OP = 'UPDATE' and old.current_quantity != new.current_quantity) then
    insert into public.inventory_transactions (
      item_id,
      type,
      quantity,
      quantity_before,
      quantity_after,
      reason,
      user_id
    ) values (
      new.id,
      case 
        when new.current_quantity > old.current_quantity then 'in'
        else 'out'
      end,
      abs(new.current_quantity - old.current_quantity),
      old.current_quantity,
      new.current_quantity,
      'Automatic transaction log',
      auth.uid()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists log_inventory_transaction_trigger on public.inventory_items;
create trigger log_inventory_transaction_trigger
  after update on public.inventory_items
  for each row
  execute function log_inventory_transaction();

-- Функция для создания алертов при низком остатке
create or replace function check_inventory_alerts()
returns trigger as $$
begin
  -- Проверка низкого остатка
  if new.current_quantity <= new.min_quantity and new.current_quantity > 0 then
    insert into public.inventory_alerts (item_id, alert_type, message, severity)
    values (
      new.id,
      'low_stock',
      format('Низкий остаток материала "%s": %s %s (минимум: %s %s)', 
        new.name, new.current_quantity, new.unit, new.min_quantity, new.unit),
      'warning'
    )
    on conflict do nothing;
  end if;
  
  -- Проверка отсутствия на складе
  if new.current_quantity <= 0 then
    insert into public.inventory_alerts (item_id, alert_type, message, severity)
    values (
      new.id,
      'out_of_stock',
      format('Материал "%s" отсутствует на складе', new.name),
      'critical'
    )
    on conflict do nothing;
  end if;
  
  -- Проверка переполнения (если задан max_quantity)
  if new.max_quantity is not null and new.current_quantity > new.max_quantity then
    insert into public.inventory_alerts (item_id, alert_type, message, severity)
    values (
      new.id,
      'overstocked',
      format('Превышен максимальный остаток материала "%s": %s %s (максимум: %s %s)', 
        new.name, new.current_quantity, new.unit, new.max_quantity, new.unit),
      'info'
    )
    on conflict do nothing;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists check_inventory_alerts_trigger on public.inventory_items;
create trigger check_inventory_alerts_trigger
  after insert or update on public.inventory_items
  for each row
  execute function check_inventory_alerts();

-- Enable Realtime
alter publication supabase_realtime add table public.material_categories;
alter publication supabase_realtime add table public.inventory_items;
alter publication supabase_realtime add table public.inventory_transactions;
alter publication supabase_realtime add table public.inventory_reservations;
alter publication supabase_realtime add table public.inventory_alerts;

-- Вставка демо-категорий
insert into public.material_categories (name, description) values
  ('Фурнитура', 'Ручки, петли, направляющие'),
  ('Материалы', 'ДСП, МДФ, фанера'),
  ('Крепеж', 'Саморезы, конфирматы, уголки'),
  ('Отделка', 'Кромка, пленка, лак')
on conflict (name) do nothing;
