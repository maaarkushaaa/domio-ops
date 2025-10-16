-- Исправление таблицы budgets - добавление недостающих колонок
-- Проблема: колонки start_date и end_date могут отсутствовать если таблица была создана ранее

-- Добавить start_date если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'budgets' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN start_date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Добавить end_date если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'budgets' 
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month');
  END IF;
END $$;

-- Убрать DEFAULT после добавления (чтобы новые записи требовали явного указания дат)
ALTER TABLE public.budgets ALTER COLUMN start_date DROP DEFAULT;
ALTER TABLE public.budgets ALTER COLUMN end_date DROP DEFAULT;

-- Комментарии
COMMENT ON COLUMN public.budgets.start_date IS 'Дата начала бюджетного периода';
COMMENT ON COLUMN public.budgets.end_date IS 'Дата окончания бюджетного периода';
