-- ================================================
-- FIX: Обновление ENUM типов для task_status и project_status
-- ================================================

-- 1. Добавляем отсутствующие значения в task_status
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'review';

-- 2. Добавляем отсутствующие значения в project_status
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'archived';

-- 3. Проверяем, что profiles существует и имеет правильную структуру
DO $$
BEGIN
  -- Если таблицы profiles нет, создаём
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE public.profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name text,
      email text,
      avatar_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "read profiles" ON public.profiles FOR SELECT USING (true);
    CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  -- Заполняем profiles из auth.users если пусто
  INSERT INTO public.profiles (id, email, full_name)
  SELECT 
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', u.email)
  FROM auth.users u
  WHERE u.id NOT IN (SELECT id FROM public.profiles)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- 4. Обновляем внешний ключ task_comments.author_id
DO $$ 
BEGIN
  -- Удаляем старый constraint если он ссылается на auth.users
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'task_comments' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'author_id'
      AND ccu.table_name = 'users'
  ) THEN
    ALTER TABLE public.task_comments DROP CONSTRAINT IF EXISTS task_comments_author_id_fkey;
    
    -- Создаём новый constraint на profiles
    ALTER TABLE public.task_comments 
    ADD CONSTRAINT task_comments_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Создаём индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON public.task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 6. Обновляем Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

COMMIT;

