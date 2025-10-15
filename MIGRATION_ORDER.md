# Порядок применения миграций

## ⚠️ ВАЖНО: Применять строго в указанном порядке!

### 1. Базовые таблицы (обязательно первыми)
```sql
-- 1.1 Вспомогательные функции
20250115_helper_functions.sql

-- 1.2 Базовые финансовые таблицы
20250115_base_finance_tables.sql

-- 1.3 CRM система (clients, deals)
20251015_crm_system.sql

-- 1.4 Стена (wall)
20251014_wall.sql
20251014_wall_polls.sql
20251014_wall_realtime.sql
```

### 2. Расширенные функции
```sql
-- 2.1 Расширенные возможности
20251015_advanced_features.sql

-- 2.2 Версионирование документов
20251015_document_versioning.sql

-- 2.3 Учёт запасов
20251015_inventory_tracking.sql
```

### 3. Безопасность и аудит
```sql
-- 3.1 Финансовая безопасность и аудит
202510141412_finance_security.sql

-- 3.2 Исправление функции аудита
20250116_fix_audit_function.sql

-- 3.3 Финансовый аудит RLS
20251014_finance_rls_audit.sql

-- 3.4 Расширенная безопасность
20250116_advanced_security.sql

-- 3.5 Безопасность интеграций
20251015_integrations_security.sql
```

### 4. Автозаполнение и триггеры
```sql
-- 4.1 Автозаполнение created_by
20250116_fix_invoices_created_by.sql
```

### 5. Дополнительные модули
```sql
-- 5.1 Интеграции
20250116_integrations.sql

-- 5.2 Видеовстречи
20250116_video_meetings.sql

-- 5.3 Связь сделок с клиентами
20250116_deals_clients_relation.sql

-- 5.4 Realtime коллаборация
20250116_realtime_collaboration.sql

-- 5.5 AI анализ документов
20250116_ai_document_analysis.sql

-- 5.6 Мультиоблачная синхронизация
20250116_multi_cloud_sync.sql
```

---

## 🚀 Как применить через Supabase Dashboard:

### Вариант 1: SQL Editor (рекомендуется)
1. Откройте https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Создайте новый запрос
5. Скопируйте содержимое миграции
6. Нажмите **Run**
7. Повторите для каждой миграции **в указанном порядке**

### Вариант 2: Через CLI
```bash
# Если у вас настроен Supabase CLI
npx supabase db push

# Или применить конкретную миграцию
npx supabase db execute --file supabase/migrations/20250115_base_finance_tables.sql
```

---

## ✅ Проверка после применения

После применения всех миграций проверьте что созданы таблицы:

```sql
-- Проверить финансовые таблицы
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('accounts', 'invoices', 'budgets', 'subscriptions', 'financial_operations')
ORDER BY table_name;

-- Проверить CRM таблицы
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'deals', 'sales_stages')
ORDER BY table_name;

-- Проверить другие таблицы
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('video_meetings', 'integrations', 'wall_posts')
ORDER BY table_name;
```

Должны вернуться все таблицы.

---

## 🔧 Если что-то пошло не так

### Ошибка: "table already exists"
Это нормально, миграции идемпотентные (используют `IF NOT EXISTS`). Просто продолжайте.

### Ошибка: "relation does not exist"
Значит пропущена базовая миграция. Вернитесь к шагу 1.

### Ошибка: "operator does not exist"
Применена старая версия `fn_write_audit`. Примените `20250116_fix_audit_function.sql`.

---

## 📝 Минимальный набор для работы приложения

Если нужно быстро запустить, примените минимум:

```sql
1. 20250115_helper_functions.sql
2. 20250115_base_finance_tables.sql
3. 20251015_crm_system.sql
4. 20250116_fix_audit_function.sql
5. 20250116_fix_invoices_created_by.sql
6. 20250116_video_meetings.sql
7. 20250116_integrations.sql
8. 20250116_deals_clients_relation.sql
```

Остальные миграции можно применить позже.

---

**Важно**: После применения миграций перезагрузите страницу приложения!
