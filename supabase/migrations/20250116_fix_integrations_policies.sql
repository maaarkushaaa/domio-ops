-- Исправление RLS policies для integrations - сделать идемпотентными
-- Проблема: политики уже существуют, нужно удалить перед созданием

-- Удалить существующие политики для integrations
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.integrations;

-- Удалить существующие политики для integration_events
DROP POLICY IF EXISTS "Users can view events of their integrations" ON public.integration_events;
DROP POLICY IF EXISTS "Users can manage events of their integrations" ON public.integration_events;

-- Удалить существующие политики для integration_logs (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_logs') THEN
    DROP POLICY IF EXISTS "Users can view logs of their integrations" ON public.integration_logs;
  END IF;
END $$;

-- Удалить существующие политики для telegram_chats (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'telegram_chats') THEN
    DROP POLICY IF EXISTS "Users can view their own telegram chats" ON public.telegram_chats;
    DROP POLICY IF EXISTS "Users can manage their own telegram chats" ON public.telegram_chats;
  END IF;
END $$;

-- Удалить существующие политики для whatsapp_chats (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_chats') THEN
    DROP POLICY IF EXISTS "Users can view their own whatsapp chats" ON public.whatsapp_chats;
    DROP POLICY IF EXISTS "Users can manage their own whatsapp chats" ON public.whatsapp_chats;
  END IF;
END $$;

-- Удалить существующие политики для email_accounts (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_accounts') THEN
    DROP POLICY IF EXISTS "Users can view their own email accounts" ON public.email_accounts;
    DROP POLICY IF EXISTS "Users can manage their own email accounts" ON public.email_accounts;
  END IF;
END $$;

-- Удалить существующие политики для calendar_syncs (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_syncs') THEN
    DROP POLICY IF EXISTS "Users can view their own calendar syncs" ON public.calendar_syncs;
    DROP POLICY IF EXISTS "Users can manage their own calendar syncs" ON public.calendar_syncs;
  END IF;
END $$;

-- Удалить существующие политики для zapier_zaps (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'zapier_zaps') THEN
    DROP POLICY IF EXISTS "Users can view their own zaps" ON public.zapier_zaps;
    DROP POLICY IF EXISTS "Users can manage their own zaps" ON public.zapier_zaps;
  END IF;
END $$;

-- Пересоздать политики для integrations
CREATE POLICY "Users can view their own integrations"
  ON public.integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integrations"
  ON public.integrations FOR ALL
  USING (auth.uid() = user_id);

-- Пересоздать политики для integration_events
CREATE POLICY "Users can view events of their integrations"
  ON public.integration_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations
      WHERE integrations.id = integration_events.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage events of their integrations"
  ON public.integration_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations
      WHERE integrations.id = integration_events.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

-- Пересоздать политики для integration_logs (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_logs') THEN
    EXECUTE 'CREATE POLICY "Users can view logs of their integrations"
      ON public.integration_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.integrations
          WHERE integrations.id = integration_logs.integration_id
          AND integrations.user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- Пересоздать политики для telegram_chats (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'telegram_chats') THEN
    EXECUTE 'CREATE POLICY "Users can view their own telegram chats" ON public.telegram_chats FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own telegram chats" ON public.telegram_chats FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Пересоздать политики для whatsapp_chats (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_chats') THEN
    EXECUTE 'CREATE POLICY "Users can view their own whatsapp chats" ON public.whatsapp_chats FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own whatsapp chats" ON public.whatsapp_chats FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Пересоздать политики для email_accounts (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_accounts') THEN
    EXECUTE 'CREATE POLICY "Users can view their own email accounts" ON public.email_accounts FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own email accounts" ON public.email_accounts FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Пересоздать политики для calendar_syncs (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_syncs') THEN
    EXECUTE 'CREATE POLICY "Users can view their own calendar syncs" ON public.calendar_syncs FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own calendar syncs" ON public.calendar_syncs FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Пересоздать политики для zapier_zaps (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'zapier_zaps') THEN
    EXECUTE 'CREATE POLICY "Users can view their own zaps" ON public.zapier_zaps FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can manage their own zaps" ON public.zapier_zaps FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Комментарий
COMMENT ON POLICY "Users can view their own integrations" ON public.integrations IS 'Пользователи видят только свои интеграции';
COMMENT ON POLICY "Users can manage their own integrations" ON public.integrations IS 'Пользователи управляют только своими интеграциями';
