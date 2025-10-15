-- Связь сделок с клиентами
-- Добавление поля client_id в таблицу deals

-- 1. Добавить поле client_id если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deals' 
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.deals ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Создать индекс для быстрого поиска сделок по клиенту
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON public.deals(client_id);

-- 3. Комментарии
COMMENT ON COLUMN public.deals.client_id IS 'Связь сделки с клиентом';
COMMENT ON INDEX idx_deals_client_id IS 'Индекс для быстрого поиска сделок по клиенту';
