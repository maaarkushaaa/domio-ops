-- Finance RLS and Audit Migration
-- Safe to run multiple times (IF NOT EXISTS guards)

-- Ensure auth extension is available (Supabase default)
create extension if not exists "uuid-ossp";

-- Tables to protect
do $$
declare
  tbl text;
  tables text[] := array['accounts','invoices','budgets','subscriptions','financial_operations'];
begin
  foreach tbl in array tables loop
    -- Add created_by if missing
    execute format('alter table if exists %I add column if not exists created_by uuid', tbl);
  end loop;
end $$;

-- Function to set created_by on INSERT
create or replace function public.set_created_by()
returns trigger as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Attach BEFORE INSERT triggers
do $$
declare
  tbl text;
  tables text[] := array['accounts','invoices','budgets','subscriptions','financial_operations'];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists trg_set_created_by on %I', tbl);
    execute format('create trigger trg_set_created_by before insert on %I for each row execute function public.set_created_by()', tbl);
  end loop;
end $$;

-- Enable RLS and add policies
do $$
declare
  tbl text;
  tables text[] := array['accounts','invoices','budgets','subscriptions','financial_operations'];
begin
  foreach tbl in array tables loop
    execute format('alter table if exists %I enable row level security', tbl);

    -- SELECT policy
    execute format('create policy if not exists %I_select_own on %I for select using (created_by = auth.uid())', tbl||'_p', tbl);
    -- INSERT policy
    execute format('create policy if not exists %I_insert_own on %I for insert with check (created_by = auth.uid())', tbl||'_p2', tbl);
    -- UPDATE policy
    execute format('create policy if not exists %I_update_own on %I for update using (created_by = auth.uid()) with check (created_by = auth.uid())', tbl||'_p3', tbl);
    -- DELETE policy
    execute format('create policy if not exists %I_delete_own on %I for delete using (created_by = auth.uid())', tbl||'_p4', tbl);
  end loop;
end $$;

-- Audit log table
create table if not exists public.audit_log (
  id bigserial primary key,
  table_name text not null,
  row_id text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid,
  acted_at timestamptz not null default now()
);

-- Audit function
create or replace function public.audit_changes()
returns trigger as $$
declare
  rid text;
begin
  rid := coalesce( (case when tg_op = 'DELETE' then (old).id::text else (new).id::text end), '');
  insert into public.audit_log(table_name, row_id, action, old_data, new_data, actor_id)
  values (tg_table_name, rid, tg_op, to_jsonb(old), to_jsonb(new), auth.uid());
  return null;
end;
$$ language plpgsql security definer;

-- Attach audit triggers (AFTER ROW for insert/update/delete)
do $$
declare
  tbl text;
  tables text[] := array['accounts','invoices','budgets','subscriptions','financial_operations'];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists trg_audit_changes on %I', tbl);
    execute format('create trigger trg_audit_changes after insert or update or delete on %I for each row execute function public.audit_changes()', tbl);
  end loop;
end $$;
