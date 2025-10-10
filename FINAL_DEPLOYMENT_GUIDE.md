# 🚀 Финальное руководство по деплою DOMIO Ops

## ✅ Pre-Flight Checklist

### Критические проверки перед деплоем

- [ ] **Все тесты прошли** - проверьте работоспособность всех функций
- [ ] **SQL миграция готова** - `supabase_migration.sql` содержит все таблицы
- [ ] **Environment variables настроены** - проверьте `.env` локально
- [ ] **RLS политики активированы** - безопасность критична!
- [ ] **Edge functions работают** - протестируйте локально
- [ ] **AI ассистент отвечает** - проверьте Lovable AI connection
- [ ] **Тема по умолчанию - светлая** - пользовательский опыт
- [ ] **Интерактивный тур работает** - только на Dashboard после входа
- [ ] **Нет console.log в production коде** - безопасность

---

## 🎯 Быстрый старт (5 минут)

### Для опытных разработчиков:

```bash
# 1. Настройка Supabase
# - Создайте проект на supabase.com
# - Выполните supabase_migration.sql в SQL Editor
# - Скопируйте URL, anon key, project ID

# 2. Настройка Vercel
# - Подключите GitHub репозиторий
# - Добавьте env variables:
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
VITE_SUPABASE_PROJECT_ID=your_id

# 3. Deploy
git push origin main
# Vercel автоматически задеплоит
```

---

## 📋 Пошаговая инструкция

### Шаг 1: Supabase Setup (10-15 минут)

#### 1.1 Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "New Project"
3. Заполните:
   - **Name**: domio-ops-production
   - **Database Password**: (сохраните в безопасном месте!)
   - **Region**: выберите ближайший к вашим пользователям
4. Нажмите "Create Project"
5. Дождитесь окончания создания (~2 минуты)

#### 1.2 Выполнение миграции базы данных

1. Откройте **SQL Editor** в левом меню
2. Нажмите "New Query"
3. Скопируйте **ВЕСЬ** код из `supabase_migration.sql`
4. Вставьте в редактор
5. Нажмите **RUN** (или F5)
6. Проверьте что нет ошибок:
   ```
   ✓ Success. No rows returned
   ```

#### 1.3 Проверка таблиц

В разделе **Table Editor** должны быть созданы:
- ✅ profiles
- ✅ user_roles
- ✅ projects
- ✅ tasks
- ✅ clients
- ✅ deals
- ✅ financial_operations
- ✅ budgets
- ✅ subscriptions
- ✅ suppliers
- ✅ procurement_orders
- ✅ products
- ✅ production_orders
- ✅ documents
- ✅ calendar_events
- ✅ email_accounts
- ✅ emails

#### 1.4 Создание первого администратора

**ВАЖНО**: Сделайте это ПОСЛЕ первого входа в приложение

```sql
-- 1. Зарегистрируйтесь в приложении через UI
-- 2. Найдите ваш user_id:
SELECT id, email FROM auth.users;

-- 3. Назначьте роль admin (замените YOUR_USER_ID):
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

#### 1.5 Настройка Authentication

1. Перейдите в **Authentication** → **Settings**
2. **Email Auth**:
   - ✅ Enable Email provider
   - ⚠️ **Development**: Enable "Confirm email" = OFF
   - ✅ **Production**: Enable "Confirm email" = ON
3. **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.vercel.app`
4. **Redirect URLs** (добавьте все):
   ```
   http://localhost:5173/**
   https://your-domain.vercel.app/**
   https://your-custom-domain.com/**
   ```

#### 1.6 Развертывание Edge Functions

**Опция A: Через Lovable Cloud** (Рекомендуется)
- Edge functions деплоятся автоматически вместе с кодом
- Просто push в Git, и все готово!

**Опция B: Через Supabase CLI** (Manual)

```bash
# Установка CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy ai-chat
supabase functions deploy ai-assistant
supabase functions deploy admin-create-user

# Verify
supabase functions list
```

#### 1.7 Получение credentials

1. **Settings** → **API**
2. Скопируйте:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGci...
   ```
3. **Settings** → **General**
4. Скопируйте:
   ```
   Reference ID: xxxxx
   ```

---

### Шаг 2: Vercel Deployment (5-10 минут)

#### 2.1 Подключение репозитория

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите **"Add New..."** → **"Project"**
3. Import Git Repository:
   - Выберите ваш GitHub/GitLab repo
   - Нажмите **"Import"**

#### 2.2 Настройка проекта

**Framework Preset**: Vite (автоопределение)

**Build Settings**:
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Root Directory**: `.` (по умолчанию)

#### 2.3 Environment Variables

Нажмите **"Environment Variables"** и добавьте:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=xxxxx
```

**ВАЖНО**: 
- Применить ко всем окружениям (Production, Preview, Development)
- Проверьте что нет пробелов в начале/конце

#### 2.4 Deploy

1. Нажмите **"Deploy"**
2. Дождитесь окончания build (~2-3 минуты)
3. При успехе увидите:
   ```
   ✓ Production: your-app.vercel.app
   ```

#### 2.5 Проверка деплоя

1. Откройте URL вашего приложения
2. Проверьте:
   - ✅ Загружается страница /auth
   - ✅ Можно зарегистрироваться
   - ✅ После входа открывается Dashboard
   - ✅ Тур не мешает на /auth
   - ✅ Тур работает на Dashboard

---

### Шаг 3: Post-Deployment Setup

#### 3.1 Обновление Redirect URLs в Supabase

1. Вернитесь в **Supabase** → **Authentication** → **Settings**
2. **Redirect URLs**: добавьте production URL:
   ```
   https://your-app.vercel.app/**
   ```

#### 3.2 Создание первого admin пользователя

1. Зарегистрируйтесь через UI приложения
2. В Supabase SQL Editor:
   ```sql
   -- Найдите ID вашего пользователя
   SELECT id, email FROM auth.users 
   ORDER BY created_at DESC LIMIT 1;
   
   -- Назначьте роль admin
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('ваш-user-id', 'admin');
   ```

#### 3.3 Тестирование функциональности

Проверьте каждый раздел:

**Core Functions:**
- [ ] Регистрация/Вход
- [ ] Создание задач
- [ ] Создание проектов
- [ ] Добавление клиентов
- [ ] Финансовые операции
- [ ] Производственные заказы

**Advanced Features:**
- [ ] AI-ассистент (чат)
- [ ] Видеозвонки WebRTC
- [ ] Email клиент
- [ ] Календарь
- [ ] Автоматизация Workflows
- [ ] Продвинутая аналитика
- [ ] Экспорт данных

**Admin Functions:**
- [ ] Создание пользователей
- [ ] Назначение ролей
- [ ] Управление правами

---

## 🔐 Security Checklist

### Production Security Settings

#### Supabase:
- [ ] Auto-confirm email = **OFF**
- [ ] RLS enabled на всех таблицах
- [ ] Проверены все RLS политики
- [ ] Rate limiting настроен
- [ ] Secrets не в коде (используйте Supabase Vault)

#### Vercel:
- [ ] Environment variables не показываются в logs
- [ ] Security headers настроены (vercel.json)
- [ ] HTTPS enforced
- [ ] Custom domain с SSL

#### Application:
- [ ] Нет console.log с чувствительными данными
- [ ] Input validation на всех формах (Zod)
- [ ] XSS защита (React по умолчанию)
- [ ] CSRF protection (если нужно)

---

## 🎨 Custom Domain (Optional)

### Добавление своего домена

#### В Vercel:

1. **Settings** → **Domains**
2. Нажмите **"Add"**
3. Введите ваш домен: `domio-ops.com`
4. Выберите тип:
   - **Root domain**: `domio-ops.com`
   - **Subdomain**: `app.domio-ops.com`

#### У регистратора домена:

Добавьте DNS записи:

**Для root domain:**
```
Type: A
Name: @
Value: 76.76.19.19
```

**Для subdomain:**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

#### В Supabase:

Обновите **Redirect URLs**:
```
https://domio-ops.com/**
https://app.domio-ops.com/**
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics

1. **Project Settings** → **Analytics**
2. Enable **Web Vitals**
3. Monitor:
   - Page views
   - User sessions
   - Performance metrics
   - Error rates

### Supabase Monitoring

1. **Logs** → **API Logs**
2. Отслеживайте:
   - Database queries
   - Authentication events
   - Edge function logs
   - Error logs

### Error Tracking (Optional)

Рекомендуется интегрировать:
- **Sentry** - для frontend errors
- **LogRocket** - для user sessions
- **Datadog** - для infrastructure

---

## 🔄 CI/CD Pipeline

### Automatic Deployments

Vercel автоматически деплоит при:

**Production:**
- Push в `main` branch
- PR merge в main

**Preview:**
- Каждый Pull Request
- Каждый commit в PR

### Manual Deploy

```bash
# Через Vercel CLI
npm i -g vercel
vercel --prod

# Или через Git
git push origin main
```

---

## 🐛 Troubleshooting

### Проблема: "Invalid API key"

**Решение:**
1. Проверьте env variables в Vercel
2. Убедитесь что используете `VITE_SUPABASE_PUBLISHABLE_KEY`, а не ANON_KEY
3. Redeploy после изменения env variables

### Проблема: "CORS error"

**Решение:**
1. Добавьте ваш домен в Supabase Redirect URLs
2. Проверьте что используете правильный SUPABASE_URL
3. Очистите кэш браузера

### Проблема: "RLS policy violation"

**Решение:**
1. Проверьте что пользователь авторизован
2. Проверьте user_roles таблицу
3. Убедитесь что RLS политики правильно настроены:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```

### Проблема: "Build failed"

**Решение:**
1. Проверьте логи в Vercel
2. Убедитесь что все зависимости установлены
3. Проверьте TypeScript errors локально:
   ```bash
   npm run build
   ```

### Проблема: "Тур перекрывает форму входа"

**Решение:**
- ✅ **Уже исправлено!** Тур теперь показывается только на Dashboard после входа

---

## 📚 Production Best Practices

### Performance

- ✅ Code splitting (Vite автоматически)
- ✅ Lazy loading компонентов
- ✅ Image optimization
- ✅ Caching headers (vercel.json)
- ✅ Service Worker (PWA)

### SEO

- ✅ Meta tags на всех страницах
- ✅ robots.txt настроен
- ✅ Semantic HTML
- ✅ Alt текст для изображений
- ✅ Open Graph tags

### Accessibility

- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Color contrast (WCAG AA)
- ✅ Screen reader support

---

## 🎉 Success Indicators

После успешного деплоя вы должны видеть:

✅ **Vercel Dashboard:**
- Build status: Ready
- Deployment: Active
- Analytics: Tracking

✅ **Supabase Dashboard:**
- Tables: Created
- RLS: Enabled
- Auth: Configured
- Functions: Deployed

✅ **Application:**
- Fast loading (< 3s)
- Responsive design
- Working authentication
- All features functional
- Interactive tour on Dashboard
- AI assistant responding

---

## 📞 Support & Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Project README](./README.md)
- [User Guide](./USER_GUIDE.md)
- [Architecture](./ARCHITECTURE.md)

### Tools
- [Vercel Status](https://www.vercel-status.com/)
- [Supabase Status](https://status.supabase.com/)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Supabase Discord](https://discord.supabase.com)

---

## 🚀 Next Steps

После успешного деплоя:

1. **Пригласите команду**
   - Создайте аккаунты для коллег
   - Назначьте роли (admin/manager/user)
   - Проведите краткий тренинг

2. **Настройте интеграции**
   - Email (IMAP/SMTP)
   - Calendar sync (если нужно)
   - Сторонние API

3. **Кастомизация**
   - Загрузите логотип компании
   - Настройте цветовую схему
   - Добавьте шаблоны документов

4. **Мониторинг**
   - Настройте alerts
   - Проверяйте метрики еженедельно
   - Собирайте feedback от пользователей

5. **Backup стратегия**
   - Настройте автоматические бэкапы в Supabase
   - Периодически экспортируйте критичные данные
   - Храните бэкапы в безопасном месте

---

## 🎯 Maintenance Schedule

### Ежедневно:
- Проверка логов на ошибки
- Мониторинг производительности

### Еженедельно:
- Обзор аналитики
- Проверка security updates
- Review user feedback

### Ежемесячно:
- Database optimization
- Security audit
- Feature planning
- Backup testing

---

**🎊 Congratulations! DOMIO Ops is now live in production!**

*Need help? Check [TROUBLESHOOTING.md](./PRODUCTION_CHECKLIST.md) or contact support.*
