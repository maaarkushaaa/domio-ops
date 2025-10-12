-- ================================================
-- FIX: Исправление связей и ENUM типов
-- ================================================

-- 1. Добавляем недостающие значения в ENUMs (если нужно)
DO $$ 
BEGIN
  -- Проверка task_status
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'review' AND enumtypid = 'public.task_status'::regtype) THEN
    ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'review';
  END IF;
  
  -- Проверка project_status
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'archived' AND enumtypid = 'public.project_status'::regtype) THEN
    ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'archived';
  END IF;
END $$;

-- 2. Создаём таблицу profiles если её нет (связка с auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Заполняем profiles из auth.users (если пусто)
INSERT INTO public.profiles (id, email)
SELECT 
  id,
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Пересоздаём внешний ключ для task_comments.author_id
-- Удаляем старый constraint если есть
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'task_comments_author_id_fkey' 
    AND table_name = 'task_comments'
  ) THEN
    ALTER TABLE public.task_comments DROP CONSTRAINT task_comments_author_id_fkey;
  END IF;
END $$;

-- Добавляем constraint на profiles вместо auth.users
ALTER TABLE public.task_comments 
ADD CONSTRAINT task_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. RLS policies для profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read profiles" ON public.profiles;
CREATE POLICY "read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "update own profile" ON public.profiles;
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. Обновляем Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- 7. Создаём индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON public.task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

COMMIT;

