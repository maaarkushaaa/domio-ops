# 🚀 Быстрый старт - Применение миграций

## ⚠️ КРИТИЧЕСКИ ВАЖНО!

**Проблема**: Таблицы уже существуют в вашей БД, но без некоторых колонок.

**Решение**: Применять миграции в СТРОГОМ порядке - сначала патчи, потом создание.

---

## 📋 Правильный порядок (копируйте по одной в SQL Editor):

### 1️⃣ Вспомогательные функции
```sql
-- Файл: 20250115_helper_functions.sql
-- Скопируйте весь файл и выполните
```

### 2️⃣ CRM система (clients, deals)
```sql
-- Файл: 20251015_crm_system.sql
-- Создаёт таблицы clients, deals, sales_stages
```

### 3️⃣ ПАТЧИ для существующих таблиц

#### Патч для clients:
```sql
-- Файл: 20250116_fix_clients_status.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'contact_person'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN contact_person TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN notes TEXT;
  END IF;
END $$;
```

#### Патч для budgets:
```sql
-- Файл: 20250116_fix_budgets_dates.sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'start_date') THEN
      ALTER TABLE public.budgets ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
      ALTER TABLE public.budgets ALTER COLUMN start_date DROP DEFAULT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'end_date') THEN
      ALTER TABLE public.budgets ADD COLUMN end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month');
      ALTER TABLE public.budgets ALTER COLUMN end_date DROP DEFAULT;
    END IF;
  END IF;
END $$;
```

#### Патч для subscriptions:
```sql
-- Файл: 20250116_fix_subscriptions_columns.sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'next_billing_date') THEN
      ALTER TABLE public.subscriptions ADD COLUMN next_billing_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month');
      ALTER TABLE public.subscriptions ALTER COLUMN next_billing_date DROP DEFAULT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'billing_period') THEN
      ALTER TABLE public.subscriptions ADD COLUMN billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'quarterly', 'yearly'));
      ALTER TABLE public.subscriptions ALTER COLUMN billing_period DROP DEFAULT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'status') THEN
      ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'provider') THEN
      ALTER TABLE public.subscriptions ADD COLUMN provider TEXT;
    END IF;
  END IF;
END $$;
```

### 4️⃣ Создание финансовых таблиц
```sql
-- Файл: 20250116_safe_base_finance_tables.sql
-- ТЕПЕРЬ БЕЗОПАСНО - все патчи применены
-- Скопируйте весь файл и выполните
```

### 5️⃣ Исправление функции аудита
```sql
-- Файл: 20250116_fix_audit_function.sql
-- Скопируйте весь файл и выполните
```

### 6️⃣ Автозаполнение created_by
```sql
-- Файл: 20250116_fix_invoices_created_by.sql
-- Скопируйте весь файл и выполните
```

### 7️⃣ Дополнительные модули
```sql
-- 20250116_video_meetings.sql

-- ⚠️ Если ошибка "policy already exists" при применении integrations.sql:
-- СНАЧАЛА примените: 20250116_drop_existing_integration_policies.sql
-- ПОТОМ: 20250116_integrations.sql

-- 20250116_integrations.sql
-- 20250116_deals_clients_relation.sql
```

---

## ✅ Проверка после применения

```sql
-- Проверить что все таблицы созданы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'accounts', 'invoices', 'budgets', 'subscriptions', 'financial_operations',
  'clients', 'deals', 'sales_stages',
  'video_meetings', 'integrations'
)
ORDER BY table_name;

-- Проверить что все колонки на месте
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'budgets', 'subscriptions')
AND column_name IN ('status', 'contact_person', 'start_date', 'end_date', 'next_billing_date', 'billing_period')
ORDER BY table_name, column_name;
```

Должно вернуть:
- 10+ таблиц
- Все указанные колонки

---

## 🎯 Если всё равно ошибка

### Вариант 1: Удалить проблемные таблицы и пересоздать
```sql
-- ⚠️ ОСТОРОЖНО: Удалит все данные!
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.financial_operations CASCADE;

-- Теперь примените 20250116_safe_base_finance_tables.sql
```

### Вариант 2: Пропустить индексы
Если ошибка при создании индекса - просто пропустите эту строку, индексы не критичны.

---

## 📞 Поддержка

Если ошибка повторяется:
1. Скопируйте ПОЛНЫЙ текст ошибки
2. Выполните: `SELECT * FROM information_schema.columns WHERE table_name = 'subscriptions';`
3. Отправьте результат

---

**После успешного применения всех миграций перезагрузите приложение!**
