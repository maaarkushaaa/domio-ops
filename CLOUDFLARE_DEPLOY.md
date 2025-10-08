# Деплой на Cloudflare Pages

## Шаги для деплоя:

### 1. Подготовка репозитория
Загрузите код в Git репозиторий (GitHub, GitLab, или Bitbucket)

### 2. Создание проекта в Cloudflare Pages
1. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Перейдите в **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Выберите ваш репозиторий
4. Настройте параметры сборки:

**Build settings:**
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/`

### 3. Переменные окружения
В настройках проекта Cloudflare Pages добавьте следующие переменные окружения:

```
VITE_SUPABASE_URL=https://zsqfgjfgipcyalhpdpvw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcWZnamZnaXBjeWFsaHBkcHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4OTQ3MDgsImV4cCI6MjA3NTQ3MDcwOH0.emHzLDSKH3_GoYsNL54AczyZC2u7qUEhLc9s_HbQoCM
VITE_SUPABASE_PROJECT_ID=zsqfgjfgipcyalhpdpvw
```

### 4. Настройка custom domain (опционально)
1. В настройках проекта перейдите в **Custom domains**
2. Добавьте ваш домен
3. Следуйте инструкциям для настройки DNS записей

### 5. Автоматический деплой
После настройки каждый push в основную ветку будет автоматически деплоить новую версию

## Особенности:
- ✅ SPA routing настроен через `_redirects`
- ✅ Security headers добавлены через `_headers`
- ✅ PWA поддержка (service worker и manifest)
- ✅ Оптимизация для production build

## Полезные команды:
```bash
# Локальная сборка для проверки
npm run build

# Предпросмотр production сборки
npm run preview
```

## Дополнительная информация:
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Deploy a Vite site](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite-site/)
