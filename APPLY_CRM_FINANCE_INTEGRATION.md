# 🚀 Применение миграции CRM-Финансы интеграции

## Что было выполнено:

### ✅ **Задача 1: Управление клиентами в CRM**
- Создан компонент `ClientManagement.tsx` с полным функционалом:
  - Просмотр списка клиентов с поиском и фильтрацией
  - Создание новых клиентов
  - Редактирование существующих клиентов
  - Удаление клиентов с подтверждением
  - Статусы клиентов (активный/неактивный/архивирован)

### ✅ **Задача 2: Интеграция CRM с Финансами**
- Создана миграция `20250116_crm_finance_integration.sql`
- Добавлены поля `client_id` в таблицы:
  - `financial_operations` - для связи операций с клиентами
  - `invoices` - для связи счетов с клиентами
  - `budgets` - для связи бюджетов с клиентами
- Созданные индексы для быстрого поиска по клиентам

---

## 📋 Применение миграции:

### В Supabase SQL Editor выполните:

```sql
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
```

---

## 🎯 Что теперь доступно:

### В CRM:
1. **Вкладка "Клиенты"** - полный CRUD клиентов
2. **Поиск и фильтрация** по статусам
3. **Управление контактами** - email, телефон, контактное лицо

### В Финансах:
1. **Связь операций с клиентами** - поле `client_id` в формах
2. **Финансовая история клиентов** - операции, счета, бюджеты
3. **Аналитика по клиентам** - доходы/расходы по каждому клиенту

---

## ✅ Готово к использованию!

После применения миграции:
1. Перезагрузите страницу приложения
2. В CRM перейдите во вкладку "Клиенты"
3. В Финансах создайте операцию и выберите клиента
4. Наслаждайтесь полной интеграцией CRM-Финансы! 🎉
