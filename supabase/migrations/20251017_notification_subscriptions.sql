create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  platform text,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_notification_subscriptions_user on public.notification_subscriptions(user_id);

alter table public.notification_subscriptions enable row level security;

drop policy if exists "Select own notification subscriptions" on public.notification_subscriptions;
create policy "Select own notification subscriptions"
  on public.notification_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Insert own notification subscriptions" on public.notification_subscriptions;
create policy "Insert own notification subscriptions"
  on public.notification_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Delete own notification subscriptions" on public.notification_subscriptions;
create policy "Delete own notification subscriptions"
  on public.notification_subscriptions for delete
  using (auth.uid() = user_id);

select pg_notify('pgrst', json_build_object(
  'schema', 'public',
  'table', 'notification_subscriptions',
  'action', 'reload cache'
)::text);

-- ensure table participates in realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notification_subscriptions'
  ) then
    alter publication supabase_realtime add table public.notification_subscriptions;
  end if;
end $$;
