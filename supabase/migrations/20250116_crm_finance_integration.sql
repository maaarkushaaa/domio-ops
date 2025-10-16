-- Интеграция CRM с Финансами
-- Добавление связи клиентов с финансовыми операциями

-- Добавить поле client_id в финансовые операции если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'financial_operations'
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.financial_operations ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Создать индекс для быстрого поиска операций по клиенту
CREATE INDEX IF NOT EXISTS idx_financial_operations_client ON public.financial_operations(client_id) WHERE client_id IS NOT NULL;

-- Добавить поле client_id в счета-фактуры если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Создать индекс для счетов-фактур по клиенту
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id) WHERE client_id IS NOT NULL;

-- Добавить поле client_id в бюджеты если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'budgets'
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Создать индекс для бюджетов по клиенту
CREATE INDEX IF NOT EXISTS idx_budgets_client ON public.budgets(client_id) WHERE client_id IS NOT NULL;

-- Комментарии
COMMENT ON COLUMN public.financial_operations.client_id IS 'Связь финансовой операции с клиентом';
COMMENT ON COLUMN public.invoices.client_id IS 'Связь счета-фактуры с клиентом';
COMMENT ON COLUMN public.budgets.client_id IS 'Связь бюджета с клиентом';

COMMENT ON INDEX idx_financial_operations_client IS 'Индекс для поиска операций по клиенту';
COMMENT ON INDEX idx_invoices_client IS 'Индекс для поиска счетов по клиенту';
COMMENT ON INDEX idx_budgets_client IS 'Индекс для поиска бюджетов по клиенту';
