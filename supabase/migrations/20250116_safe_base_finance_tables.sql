-- Безопасная версия базовых финансовых таблиц
-- Использует IF NOT EXISTS и проверяет существование колонок перед созданием индексов

-- 1. Счета (банковские счета, кассы)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'card', 'other')),
  currency TEXT NOT NULL DEFAULT 'RUB',
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Счета-фактуры (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT,
  type TEXT NOT NULL DEFAULT 'invoice' CHECK (type IN ('invoice', 'receipt', 'estimate')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB',
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  issue_date DATE,
  due_date DATE,
  paid_date DATE,
  description TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Добавить UNIQUE constraint для number если его нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoices_number_key' AND conrelid = 'public.invoices'::regclass
  ) THEN
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_number_key UNIQUE (number);
  END IF;
END $$;

-- 3. Бюджеты
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  spent DECIMAL(15,2) DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Подписки
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'yearly')),
  next_billing_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Финансовые операции
CREATE TABLE IF NOT EXISTS public.financial_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  subcategory TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Индексы (создаются только если колонки существуют)
CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON public.accounts(created_by);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON public.accounts(is_active) WHERE is_active IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date DESC) WHERE issue_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON public.budgets(created_by);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'period') THEN
    CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(period);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_created_by ON public.subscriptions(created_by);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'next_billing_date') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON public.subscriptions(next_billing_date);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_operations_created_by ON public.financial_operations(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_operations_type ON public.financial_operations(type);
CREATE INDEX IF NOT EXISTS idx_financial_operations_category ON public.financial_operations(category);
CREATE INDEX IF NOT EXISTS idx_financial_operations_date ON public.financial_operations(date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_operations_account ON public.financial_operations(account_id) WHERE account_id IS NOT NULL;

-- Комментарии
COMMENT ON TABLE public.accounts IS 'Банковские счета и кассы';
COMMENT ON TABLE public.invoices IS 'Счета-фактуры и квитанции';
COMMENT ON TABLE public.budgets IS 'Бюджеты по категориям';
COMMENT ON TABLE public.subscriptions IS 'Подписки на сервисы';
COMMENT ON TABLE public.financial_operations IS 'Финансовые операции (доходы/расходы)';
