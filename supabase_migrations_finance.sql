-- Миграция для финансовых операций
-- ВАЖНО: Создаем таблицы в правильном порядке!

-- Сначала создаем таблицу accounts (счета)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'credit', 'investment', 'crypto')),
    currency VARCHAR(3) DEFAULT 'RUB',
    balance DECIMAL(15,2) DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    bank_name VARCHAR(200),
    account_number VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Создание таблицы invoices (счета-фактуры)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('invoice', 'receipt', 'estimate')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    client_id UUID REFERENCES public.clients(id),
    project_id UUID REFERENCES public.projects(id),
    description TEXT,
    notes TEXT,
    items JSONB,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Создание таблицы budgets (бюджеты)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    year INTEGER NOT NULL,
    month INTEGER,
    quarter INTEGER,
    planned_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Создание таблицы subscriptions (подписки)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    next_payment_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renewal BOOLEAN DEFAULT TRUE,
    category VARCHAR(100),
    provider VARCHAR(200),
    account_id UUID REFERENCES public.accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Создание таблицы financial_reports (финансовые отчеты)
CREATE TABLE IF NOT EXISTS public.financial_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income_statement', 'balance_sheet', 'cash_flow', 'budget_variance')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Теперь создаем таблицу financial_operations (после создания всех зависимых таблиц)
CREATE TABLE IF NOT EXISTS public.financial_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    account_id UUID REFERENCES public.accounts(id),
    project_id UUID REFERENCES public.projects(id),
    client_id UUID REFERENCES public.clients(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    invoice_id UUID REFERENCES public.invoices(id),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_financial_operations_date ON public.financial_operations(date);
CREATE INDEX IF NOT EXISTS idx_financial_operations_type ON public.financial_operations(type);
CREATE INDEX IF NOT EXISTS idx_financial_operations_category ON public.financial_operations(category);
CREATE INDEX IF NOT EXISTS idx_financial_operations_account ON public.financial_operations(account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(year, month, quarter);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON public.subscriptions(next_payment_date);

-- RLS политики
ALTER TABLE public.financial_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

-- Политики для accounts (создаем первыми)
CREATE POLICY "Users can view their accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their accounts" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their accounts" ON public.accounts
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their accounts" ON public.accounts
    FOR DELETE USING (auth.uid() = created_by);

-- Политики для financial_operations
CREATE POLICY "Users can view their financial operations" ON public.financial_operations
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their financial operations" ON public.financial_operations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their financial operations" ON public.financial_operations
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their financial operations" ON public.financial_operations
    FOR DELETE USING (auth.uid() = created_by);

-- Политики для invoices
CREATE POLICY "Users can view their invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their invoices" ON public.invoices
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their invoices" ON public.invoices
    FOR DELETE USING (auth.uid() = created_by);

-- Политики для budgets
CREATE POLICY "Users can view their budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their budgets" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their budgets" ON public.budgets
    FOR DELETE USING (auth.uid() = created_by);

-- Политики для subscriptions
CREATE POLICY "Users can view their subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.uid() = created_by);

-- Политики для financial_reports
CREATE POLICY "Users can view their financial reports" ON public.financial_reports
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their financial reports" ON public.financial_reports
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their financial reports" ON public.financial_reports
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their financial reports" ON public.financial_reports
    FOR DELETE USING (auth.uid() = created_by);

-- Realtime подписки
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_operations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- Демо данные
INSERT INTO public.accounts (name, type, currency, balance, is_default, is_active, bank_name, account_number) VALUES
('Основной расчетный счет', 'bank', 'RUB', 1250000.00, true, true, 'Сбербанк', '40817810123456789012'),
('Касса', 'cash', 'RUB', 50000.00, false, true, NULL, NULL),
('Кредитная карта', 'credit', 'RUB', -15000.00, false, true, 'Тинькофф', '5536912345678901'),
('Инвестиционный счет', 'investment', 'RUB', 250000.00, false, true, 'ВТБ', '40817810987654321098');

INSERT INTO public.financial_operations (type, amount, category, subcategory, description, date, account_id, created_by) VALUES
('income', 150000.00, 'Продажи', 'Мебель', 'Продажа кухонного гарнитура', '2024-10-01', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('income', 75000.00, 'Продажи', 'Мебель', 'Продажа шкафа-купе', '2024-10-02', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('expense', 45000.00, 'Производство', 'Материалы', 'Закупка ЛДСП EGGER', '2024-10-03', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('expense', 12000.00, 'Производство', 'Фурнитура', 'Закупка петель Blum', '2024-10-04', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('expense', 8500.00, 'Маркетинг', 'Реклама', 'Контекстная реклама Яндекс', '2024-10-05', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('expense', 15000.00, 'Разработка', 'Зарплата', 'Зарплата разработчика', '2024-10-06', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('income', 200000.00, 'Продажи', 'Мебель', 'Продажа спального гарнитура', '2024-10-07', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('expense', 25000.00, 'Общее', 'Аренда', 'Аренда офиса', '2024-10-08', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1));

INSERT INTO public.invoices (number, type, status, amount, tax_amount, total_amount, issue_date, due_date, client_id, description, created_by) VALUES
('INV-2024-001', 'invoice', 'paid', 150000.00, 27000.00, 177000.00, '2024-10-01', '2024-10-31', (SELECT id FROM public.clients LIMIT 1), 'Кухонный гарнитур "Модерн"', (SELECT id FROM auth.users LIMIT 1)),
('INV-2024-002', 'invoice', 'sent', 75000.00, 13500.00, 88500.00, '2024-10-02', '2024-11-01', (SELECT id FROM public.clients LIMIT 1), 'Шкаф-купе "Классик"', (SELECT id FROM auth.users LIMIT 1)),
('INV-2024-003', 'invoice', 'overdue', 200000.00, 36000.00, 236000.00, '2024-09-15', '2024-10-15', (SELECT id FROM public.clients LIMIT 1), 'Спальный гарнитур "Премиум"', (SELECT id FROM auth.users LIMIT 1));

INSERT INTO public.budgets (name, category, subcategory, period, year, month, planned_amount, actual_amount, created_by) VALUES
('Бюджет на октябрь 2024', 'Производство', 'Материалы', 'monthly', 2024, 10, 200000.00, 57000.00, (SELECT id FROM auth.users LIMIT 1)),
('Бюджет на октябрь 2024', 'Производство', 'Фурнитура', 'monthly', 2024, 10, 50000.00, 12000.00, (SELECT id FROM auth.users LIMIT 1)),
('Бюджет на октябрь 2024', 'Маркетинг', 'Реклама', 'monthly', 2024, 10, 80000.00, 8500.00, (SELECT id FROM auth.users LIMIT 1)),
('Бюджет на октябрь 2024', 'Разработка', 'Зарплата', 'monthly', 2024, 10, 120000.00, 15000.00, (SELECT id FROM auth.users LIMIT 1)),
('Бюджет на октябрь 2024', 'Общее', 'Аренда', 'monthly', 2024, 10, 100000.00, 25000.00, (SELECT id FROM auth.users LIMIT 1));

INSERT INTO public.subscriptions (name, description, amount, period, next_payment_date, category, provider, account_id, created_by) VALUES
('Adobe Creative Cloud', 'Подписка на Adobe Creative Cloud для дизайна', 3500.00, 'monthly', '2024-11-01', 'Дизайн', 'Adobe', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('GitHub Team', 'Подписка на GitHub Team для разработки', 4200.00, 'monthly', '2024-11-05', 'Разработка', 'GitHub', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('AWS', 'Облачные сервисы Amazon Web Services', 12000.00, 'monthly', '2024-10-15', 'Инфраструктура', 'Amazon', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('Figma Professional', 'Подписка на Figma Professional', 2800.00, 'monthly', '2024-10-20', 'Дизайн', 'Figma', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
('Notion Team', 'Подписка на Notion Team', 1800.00, 'monthly', '2024-10-25', 'Продуктивность', 'Notion', (SELECT id FROM public.accounts WHERE is_default = true LIMIT 1), (SELECT id FROM auth.users LIMIT 1));