# СРОЧНАЯ ОТЛАДКА - Пустые страницы

## Проверьте другие страницы:

1. **Dashboard** - https://domio-ops.vercel.app/ - работает?
2. **Tasks** - https://domio-ops.vercel.app/tasks - работает?
3. **Projects** - https://domio-ops.vercel.app/projects - работает?
4. **Production** - https://domio-ops.vercel.app/production - работает?
5. **Materials** - https://domio-ops.vercel.app/materials - работает?

## Если ВСЕ страницы пустые:

Проблема в App.tsx после оптимизации с lazy loading!

### Быстрое решение:
Откатить App.tsx к версии БЕЗ lazy loading:

```bash
git log --oneline -10
# Найти коммит ДО оптимизации
git checkout <commit-hash> src/App.tsx
git add src/App.tsx
git commit -m "fix: откат lazy loading"
git push
```

## Если только Calendar пустой:

Проблема в Calendar.tsx

### Решение:
Проверить импорт EventDetailsDialog:

```bash
ls src/components/calendar/
```

Если файла нет - создать заглушку или убрать импорт

## Проверка Network:

1. F12 → Network
2. Перезагрузить страницу
3. Проверить:
   - Загружаются ли .js chunks?
   - Есть ли 404 ошибки?
   - Есть ли ошибки CORS?

## Проверка Console:

Должны быть логи:
- `🏗️ AppProvider initializing` ✅ (есть)
- `📅 Calendar component mounted` ❌ (нет!)

Это значит Calendar НЕ МОНТИРУЕТСЯ вообще!

## Возможные причины:

1. **Lazy loading chunk не загружается**
2. **Ошибка в импорте Calendar**
3. **ErrorBoundary ловит ошибку молча**
4. **React Router не находит роут**
5. **ProtectedRoute блокирует**

## Что делать СЕЙЧАС:

### Вариант 1: Откатить оптимизацию (быстро)
```bash
git revert 0532012  # коммит с lazy loading
git push
```

### Вариант 2: Убрать lazy loading только для Calendar
В App.tsx заменить:
```typescript
// Было:
const Calendar = lazy(() => import("./pages/Calendar"));

// Стало:
import Calendar from "./pages/Calendar";
```

### Вариант 3: Проверить что Calendar экспортируется правильно
```typescript
// В Calendar.tsx должно быть:
export default function Calendar() { ... }

// НЕ:
export function Calendar() { ... }
```
