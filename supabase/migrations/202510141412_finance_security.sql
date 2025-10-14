-- Finance security and auditing migration
-- Safe guards
create extension if not exists pgcrypto;

-- 1) Audit table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  actor uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- 2) Audit function
create or replace function public.fn_write_audit() returns trigger as $$
begin
  insert into public.audit_logs (table_name, action, record_id, old_data, new_data, actor)
  values (TG_TABLE_NAME, TG_OP, coalesce((case when TG_OP = 'DELETE' then (OLD->>'id')::uuid else (NEW->>'id')::uuid end), gen_random_uuid()), to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  return null;
end;
$$ language plpgsql security definer;

-- 3) Helper to attach triggers
create or replace function public.fn_attach_audit_triggers(tbl regclass) returns void as $$
begin
  execute format('drop trigger if exists trg_audit_ins on %s', tbl);
  execute format('drop trigger if exists trg_audit_upd on %s', tbl);
  execute format('drop trigger if exists trg_audit_del on %s', tbl);

  execute format('create trigger trg_audit_ins after insert on %s for each row execute function public.fn_write_audit()', tbl);
  execute format('create trigger trg_audit_upd after update on %s for each row execute function public.fn_write_audit()', tbl);
  execute format('create trigger trg_audit_del after delete on %s for each row execute function public.fn_write_audit()', tbl);
end;
$$ language plpgsql security definer;

-- 4) Enable RLS and policies
-- Tables: financial_operations, accounts, invoices, budgets, subscriptions
-- Assumes each table has column created_by uuid referencing auth.uid()

-- Enable RLS
alter table if exists public.financial_operations enable row level security;
alter table if exists public.accounts enable row level security;
alter table if exists public.invoices enable row level security;
alter table if exists public.budgets enable row level security;
alter table if exists public.subscriptions enable row level security;

-- Drop existing policies to avoid duplicates (idempotent)
do $$
begin
  perform 1 from pg_policies where schemaname='public' and tablename='financial_operations';
  if found then
    execute 'drop policy if exists p_finops_select on public.financial_operations';
    execute 'drop policy if exists p_finops_modify on public.financial_operations';
  end if;
  perform 1 from pg_policies where schemaname='public' and tablename='accounts';
  if found then
    execute 'drop policy if exists p_accounts_select on public.accounts';
    execute 'drop policy if exists p_accounts_modify on public.accounts';
  end if;
  perform 1 from pg_policies where schemaname='public' and tablename='invoices';
  if found then
    execute 'drop policy if exists p_invoices_select on public.invoices';
    execute 'drop policy if exists p_invoices_modify on public.invoices';
  end if;
  perform 1 from pg_policies where schemaname='public' and tablename='budgets';
  if found then
    execute 'drop policy if exists p_budgets_select on public.budgets';
    execute 'drop policy if exists p_budgets_modify on public.budgets';
  end if;
  perform 1 from pg_policies where schemaname='public' and tablename='subscriptions';
  if found then
    execute 'drop policy if exists p_subs_select on public.subscriptions';
    execute 'drop policy if exists p_subs_modify on public.subscriptions';
  end if;
end $$;

-- Select policies
drop policy if exists p_finops_select on public.financial_operations;
create policy p_finops_select on public.financial_operations for select using (created_by = auth.uid());
drop policy if exists p_accounts_select on public.accounts;
create policy p_accounts_select on public.accounts for select using (created_by = auth.uid());
drop policy if exists p_invoices_select on public.invoices;
create policy p_invoices_select on public.invoices for select using (created_by = auth.uid());
drop policy if exists p_budgets_select on public.budgets;
create policy p_budgets_select on public.budgets for select using (created_by = auth.uid());
drop policy if exists p_subs_select on public.subscriptions;
create policy p_subs_select on public.subscriptions for select using (created_by = auth.uid());

-- Insert/Update/Delete policies
drop policy if exists p_finops_modify on public.financial_operations;
create policy p_finops_modify on public.financial_operations for all using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists p_accounts_modify on public.accounts;
create policy p_accounts_modify on public.accounts for all using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists p_invoices_modify on public.invoices;
create policy p_invoices_modify on public.invoices for all using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists p_budgets_modify on public.budgets;
create policy p_budgets_modify on public.budgets for all using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists p_subs_modify on public.subscriptions;
create policy p_subs_modify on public.subscriptions for all using (created_by = auth.uid()) with check (created_by = auth.uid());

-- 5) Attach audit triggers
select public.fn_attach_audit_triggers('public.financial_operations'::regclass);
select public.fn_attach_audit_triggers('public.accounts'::regclass);
select public.fn_attach_audit_triggers('public.invoices'::regclass);
select public.fn_attach_audit_triggers('public.budgets'::regclass);
select public.fn_attach_audit_triggers('public.subscriptions'::regclass);
