-- Создание енума для ролей
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Создание енума для статусов
create type public.task_status as enum ('todo', 'in_progress', 'done', 'backlog');
create type public.project_status as enum ('planning', 'active', 'completed', 'on_hold');
create type public.priority as enum ('low', 'medium', 'high', 'urgent');

-- Таблица профилей пользователей
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Триггер для автоматического создания профиля
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Таблица ролей пользователей
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Функция проверки роли
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Таблица проектов
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status project_status default 'planning',
  priority priority default 'medium',
  start_date date,
  end_date date,
  budget numeric(12, 2),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

-- Таблица задач
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status task_status default 'todo',
  priority priority default 'medium',
  project_id uuid references public.projects(id) on delete cascade,
  assignee_id uuid references auth.users(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

-- Таблица клиентов
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

-- Таблица сделок
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid references public.clients(id) on delete cascade,
  amount numeric(12, 2),
  stage text default 'lead',
  probability integer default 0,
  expected_close_date date,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.deals enable row level security;

-- Таблица финансовых операций
create table public.financial_operations (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'income' или 'expense'
  category text not null,
  amount numeric(12, 2) not null,
  description text,
  date date not null default current_date,
  project_id uuid references public.projects(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.financial_operations enable row level security;

-- Таблица поставщиков
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.suppliers enable row level security;

-- Таблица заказов снабжения
create table public.procurement_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text default 'pending',
  total_amount numeric(12, 2),
  order_date date not null default current_date,
  delivery_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.procurement_orders enable row level security;

-- Таблица продуктов производства
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  description text,
  unit_price numeric(12, 2),
  quantity integer default 0,
  min_stock_level integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

-- Таблица производственных заказов
create table public.production_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  product_id uuid references public.products(id) on delete cascade,
  quantity integer not null,
  status text default 'pending',
  start_date date,
  completion_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.production_orders enable row level security;

-- Таблица документов
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_path text not null,
  file_size bigint,
  mime_type text,
  project_id uuid references public.projects(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

-- Таблица событий календаря
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  attendees uuid[],
  project_id uuid references public.projects(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.calendar_events enable row level security;

-- RLS политики для profiles
create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- RLS политики для user_roles
create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS политики для projects
create policy "Users can view all projects"
  on public.projects for select
  to authenticated
  using (true);

create policy "Users can create projects"
  on public.projects for insert
  to authenticated
  with check (true);

create policy "Users can update own projects"
  on public.projects for update
  to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Users can delete own projects"
  on public.projects for delete
  to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- RLS политики для tasks
create policy "Users can view all tasks"
  on public.tasks for select
  to authenticated
  using (true);

create policy "Users can create tasks"
  on public.tasks for insert
  to authenticated
  with check (true);

create policy "Users can update tasks"
  on public.tasks for update
  to authenticated
  using (assignee_id = auth.uid() or created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Users can delete own tasks"
  on public.tasks for delete
  to authenticated
  using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- RLS политики для clients
create policy "Users can view all clients"
  on public.clients for select
  to authenticated
  using (true);

create policy "Users can manage clients"
  on public.clients for all
  to authenticated
  using (true);

-- RLS политики для deals
create policy "Users can view all deals"
  on public.deals for select
  to authenticated
  using (true);

create policy "Users can manage deals"
  on public.deals for all
  to authenticated
  using (true);

-- RLS политики для financial_operations
create policy "Users can view all operations"
  on public.financial_operations for select
  to authenticated
  using (true);

create policy "Users can create operations"
  on public.financial_operations for insert
  to authenticated
  with check (true);

create policy "Admins can manage operations"
  on public.financial_operations for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS политики для suppliers
create policy "Users can view all suppliers"
  on public.suppliers for select
  to authenticated
  using (true);

create policy "Users can manage suppliers"
  on public.suppliers for all
  to authenticated
  using (true);

-- RLS политики для procurement_orders
create policy "Users can view all orders"
  on public.procurement_orders for select
  to authenticated
  using (true);

create policy "Users can manage orders"
  on public.procurement_orders for all
  to authenticated
  using (true);

-- RLS политики для products
create policy "Users can view all products"
  on public.products for select
  to authenticated
  using (true);

create policy "Users can manage products"
  on public.products for all
  to authenticated
  using (true);

-- RLS политики для production_orders
create policy "Users can view all production orders"
  on public.production_orders for select
  to authenticated
  using (true);

create policy "Users can manage production orders"
  on public.production_orders for all
  to authenticated
  using (true);

-- RLS политики для documents
create policy "Users can view all documents"
  on public.documents for select
  to authenticated
  using (true);

create policy "Users can upload documents"
  on public.documents for insert
  to authenticated
  with check (true);

create policy "Users can delete own documents"
  on public.documents for delete
  to authenticated
  using (uploaded_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- RLS политики для calendar_events
create policy "Users can view all events"
  on public.calendar_events for select
  to authenticated
  using (true);

create policy "Users can create events"
  on public.calendar_events for insert
  to authenticated
  with check (true);

create policy "Users can update own events"
  on public.calendar_events for update
  to authenticated
  using (created_by = auth.uid() or auth.uid() = any(attendees) or public.has_role(auth.uid(), 'admin'));

create policy "Users can delete own events"
  on public.calendar_events for delete
  to authenticated
  using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Создание индексов для производительности
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_assignee_id on public.tasks(assignee_id);
create index idx_tasks_status on public.tasks(status);
create index idx_projects_owner_id on public.projects(owner_id);
create index idx_deals_client_id on public.deals(client_id);
create index idx_procurement_orders_supplier_id on public.procurement_orders(supplier_id);
create index idx_production_orders_product_id on public.production_orders(product_id);
create index idx_documents_project_id on public.documents(project_id);
create index idx_calendar_events_project_id on public.calendar_events(project_id);
