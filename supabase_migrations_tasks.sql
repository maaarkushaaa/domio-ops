-- Projects status type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE public.project_status AS ENUM ('active','archived');
  END IF;
END $$;

-- Tasks priority type (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE public.task_priority AS ENUM ('low','medium','high');
  END IF;
END $$;

-- Tasks status type (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE public.task_status AS ENUM ('backlog','todo','in_progress','review','done');
  END IF;
END $$;

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status public.project_status NOT NULL DEFAULT 'active',
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  due_end date,
  tags text[] DEFAULT '{}',
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  "order" integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Checklists
CREATE TABLE IF NOT EXISTS public.task_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.task_checklists(id) ON DELETE CASCADE,
  content text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0
);

-- Attachments meta (files stored in storage bucket)
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  bucket text NOT NULL DEFAULT 'task-files',
  object_path text NOT NULL,
  mime_type text,
  size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity log
CREATE TABLE IF NOT EXISTS public.task_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- WIP limits per column
CREATE TABLE IF NOT EXISTS public.kanban_wip_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  status public.task_status NOT NULL,
  limit_value integer NOT NULL CHECK (limit_value >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_comments_task ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_task ON public.task_activity(task_id);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) 
SELECT 'task-files','task-files', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='task-files');

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read projects/tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='read projects') THEN
    CREATE POLICY "read projects" ON public.projects FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='read tasks') THEN
    CREATE POLICY "read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_comments' AND policyname='read comments') THEN
    CREATE POLICY "read comments" ON public.task_comments FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_checklists' AND policyname='read checklists') THEN
    CREATE POLICY "read checklists" ON public.task_checklists FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_checklist_items' AND policyname='read checklist items') THEN
    CREATE POLICY "read checklist items" ON public.task_checklist_items FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_attachments' AND policyname='read attachments') THEN
    CREATE POLICY "read attachments" ON public.task_attachments FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_activity' AND policyname='read activity') THEN
    CREATE POLICY "read activity" ON public.task_activity FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Insert rights
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='insert projects') THEN
    CREATE POLICY "insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='insert tasks') THEN
    CREATE POLICY "insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_comments' AND policyname='insert comments') THEN
    CREATE POLICY "insert comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_checklists' AND policyname='insert checklists') THEN
    CREATE POLICY "insert checklists" ON public.task_checklists FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_checklist_items' AND policyname='insert checklist items') THEN
    CREATE POLICY "insert checklist items" ON public.task_checklist_items FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_attachments' AND policyname='insert attachments') THEN
    CREATE POLICY "insert attachments" ON public.task_attachments FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_activity' AND policyname='insert activity') THEN
    CREATE POLICY "insert activity" ON public.task_activity FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Update/Delete permissions (simple, можно ужесточить позже)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='update projects') THEN
    CREATE POLICY "update projects" ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='update tasks') THEN
    CREATE POLICY "update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_comments' AND policyname='delete own comment') THEN
    CREATE POLICY "delete own comment" ON public.task_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
  END IF;
END $$;

-- Storage RLS (task-files)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='task files read') THEN
    CREATE POLICY "task files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'task-files');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='task files write') THEN
    CREATE POLICY "task files write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-files');
  END IF;
END $$;

-- Realtime
DO $$
DECLARE
  tabname text;
BEGIN
  FOR tabname IN SELECT unnest(ARRAY['tasks','projects','task_comments','task_checklists','task_checklist_items','task_activity']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tabname
    ) THEN
      EXECUTE format('alter publication supabase_realtime add table public.%I', tabname);
    END IF;
  END LOOP;
END $$;
