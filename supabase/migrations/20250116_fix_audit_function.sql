-- Исправление функции fn_write_audit
-- Проблема: оператор ->> не работает с типом record, нужно преобразовать в jsonb

-- Удалить старую функцию
DROP FUNCTION IF EXISTS public.fn_write_audit() CASCADE;

-- Создать исправленную функцию
CREATE OR REPLACE FUNCTION public.fn_write_audit() 
RETURNS TRIGGER AS $$
DECLARE
  old_jsonb jsonb;
  new_jsonb jsonb;
  record_id uuid;
BEGIN
  -- Преобразуем OLD и NEW в jsonb
  old_jsonb := to_jsonb(OLD);
  new_jsonb := to_jsonb(NEW);
  
  -- Извлекаем ID
  IF TG_OP = 'DELETE' THEN
    record_id := (old_jsonb->>'id')::uuid;
  ELSE
    record_id := (new_jsonb->>'id')::uuid;
  END IF;
  
  -- Вставляем запись в audit_logs
  INSERT INTO public.audit_logs (
    table_name, 
    action, 
    record_id, 
    old_data, 
    new_data, 
    actor
  )
  VALUES (
    TG_TABLE_NAME, 
    TG_OP, 
    COALESCE(record_id, gen_random_uuid()), 
    old_jsonb, 
    new_jsonb, 
    auth.uid()
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пересоздать триггеры для всех финансовых таблиц
SELECT public.fn_attach_audit_triggers('public.financial_operations'::regclass);
SELECT public.fn_attach_audit_triggers('public.accounts'::regclass);
SELECT public.fn_attach_audit_triggers('public.invoices'::regclass);
SELECT public.fn_attach_audit_triggers('public.budgets'::regclass);
SELECT public.fn_attach_audit_triggers('public.subscriptions'::regclass);

-- Комментарий
COMMENT ON FUNCTION public.fn_write_audit IS 'Исправленная функция аудита - корректно работает с типом record';
