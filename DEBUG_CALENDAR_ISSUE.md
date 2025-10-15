# Отладка проблемы с Calendar (Планировщик)

## Проблема
Страница Calendar (планировщик) не загружается - пустая страница

## Проверка

### 1. Проверить консоль браузера
Откройте https://domio-ops.vercel.app/calendar и проверьте консоль (F12):
- Есть ли ошибки JavaScript?
- Есть ли ошибки загрузки модулей?
- Есть ли ошибки сети (Network tab)?

### 2. Возможные причины

#### A. Lazy Loading ошибка
После оптимизации с `React.lazy()` может быть проблема с импортом:
```typescript
// src/App.tsx
const Calendar = lazy(() => import("./pages/Calendar"));
```

**Решение**: Проверить что export default правильный:
```typescript
// src/pages/Calendar.tsx
export default function Calendar() { ... }
```

#### B. Отсутствующий компонент
Импорт `EventDetailsDialog` может не работать:
```typescript
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";
```

**Проверка**: Файл существует в `src/components/calendar/EventDetailsDialog.tsx`

#### C. Runtime ошибка
Может быть ошибка в useEffect или при загрузке данных из Supabase

**Решение**: Добавить Error Boundary или try-catch

### 3. Быстрое решение

Если проблема в lazy loading, можно временно вернуть обычный импорт:

```typescript
// src/App.tsx
// Вместо:
// const Calendar = lazy(() => import("./pages/Calendar"));

// Использовать:
import Calendar from "./pages/Calendar";
```

### 4. Проверка build

Локально собрать проект:
```bash
npm run build
npm run preview
```

Открыть http://localhost:4173/calendar и проверить работает ли

### 5. Vercel Logs

Проверить логи Vercel:
1. Зайти на https://vercel.com/dashboard
2. Выбрать проект domio-ops
3. Открыть последний деплой
4. Проверить Build Logs и Runtime Logs

### 6. Временный workaround

Если нужно срочно исправить, можно:

1. Откатить App.tsx к версии без lazy loading:
```bash
git checkout HEAD~4 src/App.tsx
git add src/App.tsx
git commit -m "fix: откат lazy loading для Calendar"
git push
```

2. Или добавить fallback для Calendar:
```typescript
<Suspense fallback={<PageLoader />}>
  <ErrorBoundary>
    <Calendar />
  </ErrorBoundary>
</Suspense>
```

### 7. Проверить зависимости

Возможно проблема в отсутствующих зависимостях на Vercel:
- qrcode.react (недавно добавлена)
- Другие новые пакеты

**Решение**: Убедиться что package.json закоммичен с новыми зависимостями

## Следующие шаги

1. ✅ Проверить консоль браузера на production
2. ✅ Проверить Vercel Build Logs
3. ✅ Проверить Vercel Runtime Logs
4. ⏳ Если нужно - откатить lazy loading
5. ⏳ Добавить Error Boundary для Calendar
6. ⏳ Пересобрать и задеплоить

## Контакты для проверки

- Production: https://domio-ops.vercel.app/calendar
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/maaarkushaaa/domio-ops
