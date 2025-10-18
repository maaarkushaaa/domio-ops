-- Task dependencies graph management

create table if not exists public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  predecessor_id uuid not null references public.tasks(id) on delete cascade,
  successor_id uuid not null references public.tasks(id) on delete cascade,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  constraint task_dependencies_unique unique (predecessor_id, successor_id),
  constraint task_dependencies_no_self check (predecessor_id <> successor_id)
);

create index if not exists idx_task_dependencies_predecessor on public.task_dependencies(predecessor_id);
create index if not exists idx_task_dependencies_successor on public.task_dependencies(successor_id);

-- Ensure we do not create cyclic dependencies
create or replace function public.task_dependencies_prevent_cycle()
returns trigger
language plpgsql
as $$
declare
  cycle_found boolean;
  effective_id uuid := coalesce(new.id, '00000000-0000-0000-0000-000000000000');
begin
  if new.predecessor_id = new.successor_id then
    raise exception 'Задача не может зависеть сама от себя';
  end if;

  with recursive downstream(successor_id) as (
    select td.successor_id
    from public.task_dependencies td
    where td.predecessor_id = new.successor_id
      and td.id <> effective_id
    union
    select td.successor_id
    from public.task_dependencies td
    join downstream d on td.predecessor_id = d.successor_id
    where td.id <> effective_id
  )
  select true into cycle_found
  from downstream
  where successor_id = new.predecessor_id
  limit 1;

  if cycle_found then
    raise exception 'Добавление зависимости приведет к циклу';
  end if;

  return new;
end;
$$;

create trigger trg_task_dependencies_prevent_cycle
before insert or update on public.task_dependencies
for each row execute function public.task_dependencies_prevent_cycle();

alter table public.task_dependencies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_dependencies'
      and policyname = 'read task dependencies'
  ) then
    create policy "read task dependencies" on public.task_dependencies
      for select using (auth.role() = 'service_role' or auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_dependencies'
      and policyname = 'insert task dependencies'
  ) then
    create policy "insert task dependencies" on public.task_dependencies
      for insert with check (auth.role() = 'service_role' or auth.uid() = coalesce(created_by, auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_dependencies'
      and policyname = 'delete task dependencies'
  ) then
    create policy "delete task dependencies" on public.task_dependencies
      for delete using (auth.role() = 'service_role' or auth.uid() = created_by);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_dependencies'
      and policyname = 'update task dependencies'
  ) then
    create policy "update task dependencies" on public.task_dependencies
      for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;

do $$
declare
  tabname text := 'task_dependencies';
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = tabname
  ) then
    execute format('alter publication supabase_realtime add table public.%I', tabname);
  end if;
end $$;
