# 🚀 Инструкция по развертыванию DOMIO Ops

## Предварительные требования

- Аккаунт на [Vercel](https://vercel.com)
- Аккаунт на [Supabase](https://supabase.com)
- Git установлен локально

## Шаг 1: Настройка Supabase

### 1.1 Создание проекта

1. Войдите в [Supabase Dashboard](https://app.supabase.com)
2. Создайте новый проект
3. Сохраните:
   - `Project URL` (SUPABASE_URL)
   - `anon public` ключ (SUPABASE_PUBLISHABLE_KEY)
   - `service_role` ключ (для миграций)

### 1.2 Выполнение миграций базы данных

1. Откройте SQL Editor в Supabase Dashboard
2. Скопируйте весь код из файла `supabase_migration.sql`
3. Выполните SQL скрипт
4. Проверьте создание таблиц в разделе "Table Editor"

### 1.3 Создание первого администратора

После выполнения миграций, создайте первого пользователя:

```sql
-- 1. Зарегистрируйте пользователя через UI приложения или создайте вручную
-- 2. Получите user_id из таблицы auth.users
-- 3. Назначьте роль администратора:

INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

### 1.4 Настройка Edge Functions (опционально)

Если вы хотите использовать AI функции:

1. Установите Supabase CLI:
```bash
npm install -g supabase
```

2. Войдите в Supabase:
```bash
supabase login
```

3. Свяжите проект:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Деплой функций:
```bash
supabase functions deploy ai-chat
supabase functions deploy admin-create-user
```

### 1.5 Настройка аутентификации

1. Перейдите в **Authentication** → **Settings**
2. Включите **Email** провайдера
3. **ВАЖНО**: Включите **"Auto Confirm"** для быстрой разработки:
   - Authentication → Settings → Email Auth
   - Enable email confirmations: **OFF** (для разработки)
4. Настройте Email Templates (опционально)

### 1.6 Настройка Storage (опционально)

Если нужно хранилище файлов:

1. Перейдите в **Storage**
2. Создайте bucket `documents`
3. Настройте политики доступа:

```sql
-- Политика для загрузки документов
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Политика для чтения документов
CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Шаг 2: Настройка Vercel

### 2.1 Подключение репозитория

1. Войдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите **"Add New Project"**
3. Импортируйте Git репозиторий
4. Выберите фреймворк: **Vite**

### 2.2 Настройка переменных окружения

В настройках проекта Vercel добавьте:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Где найти значения:**
- VITE_SUPABASE_URL: Settings → API → Project URL
- VITE_SUPABASE_PUBLISHABLE_KEY: Settings → API → Project API keys → anon public
- VITE_SUPABASE_PROJECT_ID: Settings → General → Reference ID

### 2.3 Настройка Build команд

Vercel автоматически определит настройки, но проверьте:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 2.4 Деплой

1. Нажмите **"Deploy"**
2. Дождитесь завершения сборки
3. Проверьте статус в логах

## Шаг 3: Проверка развертывания

### 3.1 Проверка фронтенда

1. Откройте URL вашего приложения (предоставленный Vercel)
2. Проверьте загрузку главной страницы
3. Проверьте страницу авторизации `/auth`

### 3.2 Проверка базы данных

1. Попробуйте зарегистрироваться через UI
2. Проверьте создание пользователя в Supabase Dashboard
3. Проверьте создание профиля в таблице `profiles`

### 3.3 Проверка функциональности

- ✅ Авторизация и регистрация
- ✅ Создание задач
- ✅ Создание проектов
- ✅ Работа с клиентами
- ✅ Финансовые операции
- ✅ Уведомления
- ✅ Темная/светлая тема

## Шаг 4: Production оптимизации

### 4.1 Безопасность

1. **Отключите Auto-confirm** для production:
   - Supabase → Authentication → Settings
   - Enable email confirmations: **ON**

2. **Настройте RLS политики:**
   - Проверьте все таблицы
   - Убедитесь что RLS включен
   - Протестируйте доступ разных ролей

3. **Настройте Rate Limiting** в Supabase

### 4.2 Производительность

1. **Включите кэширование** в Vercel:
   - Headers уже настроены в `vercel.json`

2. **Оптимизация изображений:**
   - Используйте Vercel Image Optimization
   - Добавьте lazy loading

3. **Настройте CDN:**
   - Vercel автоматически использует Edge Network

### 4.3 Мониторинг

1. **Vercel Analytics:**
   - Включите в настройках проекта
   - Отслеживайте производительность

2. **Supabase Logs:**
   - Мониторьте API запросы
   - Отслеживайте ошибки базы данных

## Шаг 5: Обновления

### 5.1 Автоматический деплой

Vercel автоматически деплоит изменения при push в main ветку:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### 5.2 Миграции базы данных

При обновлении схемы базы данных:

1. Создайте новый SQL файл с миграцией
2. Выполните в Supabase SQL Editor
3. Или используйте Supabase CLI:

```bash
supabase db push
```

## Troubleshooting

### Проблема: "Invalid API key"

- Проверьте переменные окружения в Vercel
- Убедитесь что используете правильные ключи
- Перезапустите деплой

### Проблема: "CORS error"

- Проверьте настройки CORS в Supabase
- Добавьте домен Vercel в Allowed Origins

### Проблема: "RLS policy violation"

- Проверьте политики RLS в Supabase
- Убедитесь что пользователь авторизован
- Проверьте роли пользователей

### Проблема: "Build failed"

- Проверьте логи в Vercel Dashboard
- Убедитесь что все зависимости установлены
- Проверьте TypeScript ошибки

## Полезные ссылки

- [Документация Vercel](https://vercel.com/docs)
- [Документация Supabase](https://supabase.com/docs)
- [Vite документация](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)

## Поддержка

При возникновении проблем:
1. Проверьте логи в Vercel и Supabase
2. Изучите документацию
3. Проверьте GitHub Issues
4. Обратитесь в техподдержку Vercel/Supabase

---

🎉 **Поздравляем! Ваше приложение DOMIO Ops успешно развернуто!**
