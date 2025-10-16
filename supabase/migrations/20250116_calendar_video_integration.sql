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
