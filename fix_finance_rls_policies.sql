-- Исправление RLS политик для финансовых таблиц
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor

-- Удаляем существующие политики
DROP POLICY IF EXISTS "Users can view their accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their accounts" ON public.accounts;

DROP POLICY IF EXISTS "Users can view their financial operations" ON public.financial_operations;
DROP POLICY IF EXISTS "Users can insert their financial operations" ON public.financial_operations;
DROP POLICY IF EXISTS "Users can update their financial operations" ON public.financial_operations;
DROP POLICY IF EXISTS "Users can delete their financial operations" ON public.financial_operations;

DROP POLICY IF EXISTS "Users can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their invoices" ON public.invoices;

DROP POLICY IF EXISTS "Users can view their budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their budgets" ON public.budgets;

DROP POLICY IF EXISTS "Users can view their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their subscriptions" ON public.subscriptions;

-- Создаем новые политики с правильными условиями
-- Политики для accounts
CREATE POLICY "Enable all operations for authenticated users" ON public.accounts
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Политики для financial_operations
CREATE POLICY "Enable all operations for authenticated users" ON public.financial_operations
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Политики для invoices
CREATE POLICY "Enable all operations for authenticated users" ON public.invoices
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Политики для budgets
CREATE POLICY "Enable all operations for authenticated users" ON public.budgets
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Политики для subscriptions
CREATE POLICY "Enable all operations for authenticated users" ON public.subscriptions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Проверяем, что данные есть в таблицах
SELECT 'accounts' as table_name, count(*) as count FROM public.accounts
UNION ALL
SELECT 'financial_operations' as table_name, count(*) as count FROM public.financial_operations
UNION ALL
SELECT 'invoices' as table_name, count(*) as count FROM public.invoices
UNION ALL
SELECT 'budgets' as table_name, count(*) as count FROM public.budgets
UNION ALL
SELECT 'subscriptions' as table_name, count(*) as count FROM public.subscriptions;
