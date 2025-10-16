# 🚀 Применение миграции для интеграции видео в календарь

## Что нужно сделать:

### 1. Применить миграцию в Supabase SQL Editor:
```sql
-- Скопируйте и выполните в SQL Editor:

-- Добавление поддержки видеовстреч в календарь
-- Добавляем поля для хранения видео комнаты в события календаря

-- Добавить поле video_room в календарь если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'calendar_events'
    AND column_name = 'video_room'
  ) THEN
    ALTER TABLE public.calendar_events ADD COLUMN video_room TEXT;
  END IF;
END $$;

-- Добавить поле has_video если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'calendar_events'
    AND column_name = 'has_video'
  ) THEN
    ALTER TABLE public.calendar_events ADD COLUMN has_video BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Создать индекс для быстрого поиска событий с видео
CREATE INDEX IF NOT EXISTS idx_calendar_events_video ON public.calendar_events(has_video) WHERE has_video = true;

-- Комментарии
COMMENT ON COLUMN public.calendar_events.video_room IS 'Название видео комнаты для события';
COMMENT ON COLUMN public.calendar_events.has_video IS 'Флаг указывающий что событие включает видеовстречу';
COMMENT ON INDEX idx_calendar_events_video IS 'Индекс для поиска событий с видеовстречами';
```

### 2. Как использовать новую функциональность:

1. **Создание события с видео:**
   - В календаре нажмите "Создать событие"
   - Поставьте галочку "Видеоконференция"
   - Название комнаты сгенерируется автоматически
   - Создайте событие

2. **Присоединение к видео звонку:**
   - В календаре увидите событие с зелёным значком видео 📹
   - Нажмите кнопку "Видео" или зелёный значок телефона 📞
   - Откроется встроенная видеоконференция Jitsi

3. **Особенности:**
   - ✅ Видео комната создаётся автоматически
   - ✅ Встроенный Jitsi клиент (не внешняя ссылка)
   - ✅ Один клик для присоединения
   - ✅ Работает в модальном окне

### 3. Что обновилось в коде:

- **Calendar.tsx**: Добавлена интеграция с JitsiVideoCall
- **JitsiVideoCall.tsx**: Обновлён для работы с iframe вместо сложного API
- **Миграция**: Добавлены поля `has_video` и `video_room` в таблицу `calendar_events`

---

## ✅ Готово к использованию!

После применения миграции:
1. Перезагрузите страницу приложения
2. Создайте событие с видеоконференцией
3. Наслаждайтесь встроенными видеозвонками прямо в календаре! 🎉
