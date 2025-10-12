-- ================================================
-- FIX: Создание storage buckets для файлов
-- ================================================

-- 1. Создаём bucket для вложений задач
INSERT INTO storage.buckets (id, name, public)
SELECT 'task-files', 'task-files', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='task-files');

-- 2. RLS политики для task-files bucket
DO $$ 
BEGIN
  -- Политика для чтения (публичный доступ)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'task files read'
  ) THEN
    CREATE POLICY "task files read" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'task-files');
  END IF;

  -- Политика для записи (только аутентифицированные)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'task files write'
  ) THEN
    CREATE POLICY "task files write" 
    ON storage.objects 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'task-files');
  END IF;

  -- Политика для удаления (только аутентифицированные)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'task files delete'
  ) THEN
    CREATE POLICY "task files delete" 
    ON storage.objects 
    FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'task-files');
  END IF;
END $$;

-- 3. Проверяем, что bucket chat-audio тоже существует (для голосовых сообщений)
INSERT INTO storage.buckets (id, name, public)
SELECT 'chat-audio', 'chat-audio', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='chat-audio');

-- 4. RLS для chat-audio
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'chat audio read'
  ) THEN
    CREATE POLICY "chat audio read" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'chat-audio');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'chat audio write'
  ) THEN
    CREATE POLICY "chat audio write" 
    ON storage.objects 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'chat-audio');
  END IF;
END $$;

COMMIT;

