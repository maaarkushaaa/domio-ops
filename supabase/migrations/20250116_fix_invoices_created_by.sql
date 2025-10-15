-- Fix invoices created_by auto-fill
-- Проблема: RLS policy требует created_by, но поле не заполняется автоматически

-- 1. Добавить created_by если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 2. Создать функцию для автозаполнения created_by
CREATE OR REPLACE FUNCTION public.fn_set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Создать триггер для invoices
DROP TRIGGER IF EXISTS trg_invoices_set_created_by ON public.invoices;
CREATE TRIGGER trg_invoices_set_created_by
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_created_by();

-- 4. Обновить существующие записи без created_by (если есть)
UPDATE public.invoices 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- 5. Сделать поле обязательным
ALTER TABLE public.invoices ALTER COLUMN created_by SET NOT NULL;

-- 6. Применить то же для других финансовых таблиц

-- Accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.accounts ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_accounts_set_created_by ON public.accounts;
CREATE TRIGGER trg_accounts_set_created_by
  BEFORE INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_created_by();

UPDATE public.accounts 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- Budgets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'budgets' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_budgets_set_created_by ON public.budgets;
CREATE TRIGGER trg_budgets_set_created_by
  BEFORE INSERT ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_created_by();

UPDATE public.budgets 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- Subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_subscriptions_set_created_by ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_set_created_by
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_created_by();

UPDATE public.subscriptions 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- Комментарии
COMMENT ON FUNCTION public.fn_set_created_by IS 'Автоматически устанавливает created_by = auth.uid() при INSERT';
COMMENT ON TRIGGER trg_invoices_set_created_by ON public.invoices IS 'Автозаполнение created_by для invoices';
COMMENT ON TRIGGER trg_accounts_set_created_by ON public.accounts IS 'Автозаполнение created_by для accounts';
COMMENT ON TRIGGER trg_budgets_set_created_by ON public.budgets IS 'Автозаполнение created_by для budgets';
COMMENT ON TRIGGER trg_subscriptions_set_created_by ON public.subscriptions IS 'Автозаполнение created_by для subscriptions';
