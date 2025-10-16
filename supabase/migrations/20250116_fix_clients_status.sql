-- Исправление таблицы clients - добавление недостающих колонок
-- Проблема: колонки status, contact_person могут отсутствовать

-- Добавить status если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));
  END IF;
END $$;

-- Добавить contact_person если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'contact_person'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN contact_person TEXT;
  END IF;
END $$;

-- Комментарии
COMMENT ON COLUMN public.clients.status IS 'Статус клиента: active, inactive, archived';
COMMENT ON COLUMN public.clients.contact_person IS 'Контактное лицо клиента';
