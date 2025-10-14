-- Wall feature schema (posts, comments, attachments, notifications) + RLS + storage bucket (private)
-- Run in Supabase SQL Editor or through migration runner

-- Extension (uuid/ossp/gen_random_uuid)
create extension if not exists pgcrypto;

-- Enum for attachment types
do $$ begin
  create type wall_attachment_type as enum ('image','video','audio','file');
exception when duplicate_object then null; end $$;

-- Posts
create table if not exists public.wall_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid null,
  task_id uuid null,
  content text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Comments
create table if not exists public.wall_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.wall_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  created_at timestamp with time zone not null default now()
);

-- Attachments (can belong to post OR comment)
create table if not exists public.wall_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid null references public.wall_posts(id) on delete cascade,
  comment_id uuid null references public.wall_comments(id) on delete cascade,
  type wall_attachment_type not null,
  url text not null,
  meta jsonb null,
  created_at timestamp with time zone not null default now(),
  check ((post_id is not null) <> (comment_id is not null)) -- exactly one of them
);

-- Optional reactions (reserved for future)
create table if not exists public.wall_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid null references public.wall_posts(id) on delete cascade,
  comment_id uuid null references public.wall_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (length(type) between 1 and 32),
  created_at timestamp with time zone not null default now(),
  unique (post_id, comment_id, user_id, type),
  check ((post_id is not null) <> (comment_id is not null))
);

-- Notifications: inserted on new post/comment; clients subscribe to changes
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  event text not null check (event in ('wall_post_created','wall_comment_created')),
  actor_id uuid not null references auth.users(id) on delete set null,
  target_id uuid not null, -- post id or comment id
  scope text not null check (scope in ('project','task')),
  scope_id uuid null,
  payload jsonb null,
  created_at timestamp with time zone not null default now()
);

-- Indexes
create index if not exists wall_posts_project_idx on public.wall_posts (project_id, created_at desc);
create index if not exists wall_posts_task_idx on public.wall_posts (task_id, created_at desc);
create index if not exists wall_comments_post_idx on public.wall_comments (post_id, created_at asc);
create index if not exists wall_attachments_post_idx on public.wall_attachments (post_id);
create index if not exists wall_attachments_comment_idx on public.wall_attachments (comment_id);
create index if not exists notifications_created_idx on public.notifications (created_at desc);

-- RLS
alter table public.wall_posts enable row level security;
alter table public.wall_comments enable row level security;
alter table public.wall_attachments enable row level security;
alter table public.wall_reactions enable row level security;
alter table public.notifications enable row level security;

-- Policies: authenticated can read all (not public), create; update/delete only authors
drop policy if exists wall_posts_select_all on public.wall_posts;
create policy wall_posts_select_all on public.wall_posts for select using (auth.role() = 'authenticated');
drop policy if exists wall_posts_insert_auth on public.wall_posts;
create policy wall_posts_insert_auth on public.wall_posts for insert with check (auth.uid() = author_id);
drop policy if exists wall_posts_update_owner on public.wall_posts;
create policy wall_posts_update_owner on public.wall_posts for update using (auth.uid() = author_id);
drop policy if exists wall_posts_delete_owner on public.wall_posts;
create policy wall_posts_delete_owner on public.wall_posts for delete using (auth.uid() = author_id);

drop policy if exists wall_comments_select_all on public.wall_comments;
create policy wall_comments_select_all on public.wall_comments for select using (auth.role() = 'authenticated');
drop policy if exists wall_comments_insert_auth on public.wall_comments;
create policy wall_comments_insert_auth on public.wall_comments for insert with check (auth.uid() = author_id);
drop policy if exists wall_comments_delete_owner on public.wall_comments;
create policy wall_comments_delete_owner on public.wall_comments for delete using (auth.uid() = author_id);

drop policy if exists wall_attachments_select_all on public.wall_attachments;
create policy wall_attachments_select_all on public.wall_attachments for select using (auth.role() = 'authenticated');
drop policy if exists wall_attachments_insert_auth on public.wall_attachments;
create policy wall_attachments_insert_auth on public.wall_attachments for insert with check (auth.role() = 'authenticated');
drop policy if exists wall_attachments_delete_auth on public.wall_attachments;
create policy wall_attachments_delete_auth on public.wall_attachments for delete using (auth.role() = 'authenticated');

drop policy if exists wall_reactions_select_all on public.wall_reactions;
create policy wall_reactions_select_all on public.wall_reactions for select using (auth.role() = 'authenticated');
drop policy if exists wall_reactions_upsert_auth on public.wall_reactions;
create policy wall_reactions_upsert_auth on public.wall_reactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists notifications_select_all on public.notifications;
create policy notifications_select_all on public.notifications for select using (auth.role() = 'authenticated');
drop policy if exists notifications_insert_auth on public.notifications;
create policy notifications_insert_auth on public.notifications for insert with check (auth.role() = 'authenticated');

-- Triggers: write notifications on new post/comment
create or replace function public.fn_wall_post_notify() returns trigger as $$
begin
  insert into public.notifications(event, actor_id, target_id, scope, scope_id, payload)
  values ('wall_post_created', new.author_id, new.id,
    case when new.project_id is not null then 'project' else 'task' end,
    coalesce(new.project_id, new.task_id), jsonb_build_object('content', new.content));
  return new;
end;$$ language plpgsql security definer;

create or replace function public.fn_wall_comment_notify() returns trigger as $$
begin
  insert into public.notifications(event, actor_id, target_id, scope, scope_id, payload)
  values ('wall_comment_created', new.author_id, new.id,
    (select case when p.project_id is not null then 'project' else 'task' end from public.wall_posts p where p.id = new.post_id),
    (select coalesce(p.project_id, p.task_id) from public.wall_posts p where p.id = new.post_id),
    jsonb_build_object('content', new.content, 'post_id', new.post_id));
  return new;
end;$$ language plpgsql security definer;

drop trigger if exists trg_wall_post_notify on public.wall_posts;
create trigger trg_wall_post_notify after insert on public.wall_posts for each row execute function public.fn_wall_post_notify();
drop trigger if exists trg_wall_comment_notify on public.wall_comments;
create trigger trg_wall_comment_notify after insert on public.wall_comments for each row execute function public.fn_wall_comment_notify();

-- Storage bucket (private)
insert into storage.buckets (id, name, public)
select 'wall','wall', false
where not exists (select 1 from storage.buckets where id = 'wall');

-- Storage policies: allow authenticated to manage objects in 'wall' bucket; deny anon
drop policy if exists storage_wall_select on storage.objects;
create policy storage_wall_select on storage.objects for select using (
  bucket_id = 'wall' and auth.role() = 'authenticated'
);
drop policy if exists storage_wall_insert on storage.objects;
create policy storage_wall_insert on storage.objects for insert with check (
  bucket_id = 'wall' and auth.role() = 'authenticated'
);
drop policy if exists storage_wall_update on storage.objects;
create policy storage_wall_update on storage.objects for update using (
  bucket_id = 'wall' and auth.role() = 'authenticated'
);
drop policy if exists storage_wall_delete on storage.objects;
create policy storage_wall_delete on storage.objects for delete using (
  bucket_id = 'wall' and auth.role() = 'authenticated'
);
