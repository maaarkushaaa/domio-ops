-- Удаление существующих RLS политик для integrations перед применением основной миграции
-- Применить ПЕРЕД 20250116_integrations.sql если получаете ошибку "policy already exists"

-- Удалить политики для integrations
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.integrations;

-- Удалить политики для integration_events
DROP POLICY IF EXISTS "Users can view events of their integrations" ON public.integration_events;
DROP POLICY IF EXISTS "Users can manage events of their integrations" ON public.integration_events;

-- Удалить политики для integration_rules
DROP POLICY IF EXISTS "Users can view their own rules" ON public.integration_rules;
DROP POLICY IF EXISTS "Users can manage their own rules" ON public.integration_rules;

-- Удалить политики для rule_execution_logs
DROP POLICY IF EXISTS "Users can view logs of their rules" ON public.rule_execution_logs;

-- Удалить политики для telegram_chats
DROP POLICY IF EXISTS "Users can view their own telegram chats" ON public.telegram_chats;
DROP POLICY IF EXISTS "Users can manage their own telegram chats" ON public.telegram_chats;

-- Удалить политики для whatsapp_chats (если существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_chats') THEN
    DROP POLICY IF EXISTS "Users can view their own whatsapp chats" ON public.whatsapp_chats;
    DROP POLICY IF EXISTS "Users can manage their own whatsapp chats" ON public.whatsapp_chats;
  END IF;
END $$;

-- Удалить политики для email_accounts (если существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_accounts') THEN
    DROP POLICY IF EXISTS "Users can view their own email accounts" ON public.email_accounts;
    DROP POLICY IF EXISTS "Users can manage their own email accounts" ON public.email_accounts;
  END IF;
END $$;

-- Удалить политики для calendar_syncs (если существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_syncs') THEN
    DROP POLICY IF EXISTS "Users can view their own calendar syncs" ON public.calendar_syncs;
    DROP POLICY IF EXISTS "Users can manage their own calendar syncs" ON public.calendar_syncs;
  END IF;
END $$;

-- Удалить политики для calendar_events (если существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') THEN
    DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
    DROP POLICY IF EXISTS "Users can manage their own calendar events" ON public.calendar_events;
  END IF;
END $$;

-- Удалить политики для zapier_zaps
DROP POLICY IF EXISTS "Users can view their own zaps" ON public.zapier_zaps;
DROP POLICY IF EXISTS "Users can manage their own zaps" ON public.zapier_zaps;

-- Комментарий
COMMENT ON SCHEMA public IS 'Политики удалены, готово к применению 20250116_integrations.sql';
