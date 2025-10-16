-- Исправление таблицы subscriptions - добавление недостающих колонок
-- Проблема: колонки могут отсутствовать если таблица была создана ранее

-- Добавить next_billing_date если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'next_billing_date'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN next_billing_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month');
    -- Убрать DEFAULT после добавления
    ALTER TABLE public.subscriptions ALTER COLUMN next_billing_date DROP DEFAULT;
  END IF;
END $$;

-- Добавить billing_period если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'billing_period'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'quarterly', 'yearly'));
    ALTER TABLE public.subscriptions ALTER COLUMN billing_period DROP DEFAULT;
  END IF;
END $$;

-- Добавить status если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled'));
  END IF;
END $$;

-- Добавить provider если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'provider'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN provider TEXT;
  END IF;
END $$;

-- Комментарии
COMMENT ON COLUMN public.subscriptions.next_billing_date IS 'Дата следующего списания';
COMMENT ON COLUMN public.subscriptions.billing_period IS 'Период оплаты: monthly, quarterly, yearly';
COMMENT ON COLUMN public.subscriptions.status IS 'Статус подписки: active, paused, cancelled';
COMMENT ON COLUMN public.subscriptions.provider IS 'Поставщик услуги';
