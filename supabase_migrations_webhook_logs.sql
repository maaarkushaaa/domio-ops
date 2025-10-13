-- Создание таблицы для логов webhook запросов
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'partial')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint ON public.webhook_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- RLS политики
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Политика для аутентифицированных пользователей
CREATE POLICY "Authenticated users can view webhook logs" ON public.webhook_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Политика для сервисных запросов (API)
CREATE POLICY "Service role can manage webhook logs" ON public.webhook_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Realtime публикация
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;

-- Комментарии к таблице и колонкам
COMMENT ON TABLE public.webhook_logs IS 'Логи webhook запросов и автоматических импортов';
COMMENT ON COLUMN public.webhook_logs.endpoint IS 'URL endpoint который обработал запрос';
COMMENT ON COLUMN public.webhook_logs.method IS 'HTTP метод (GET, POST, PUT, DELETE)';
COMMENT ON COLUMN public.webhook_logs.status IS 'Статус обработки: success, error, partial';
COMMENT ON COLUMN public.webhook_logs.request_data IS 'Данные входящего запроса (JSON)';
COMMENT ON COLUMN public.webhook_logs.response_data IS 'Данные ответа (JSON)';
COMMENT ON COLUMN public.webhook_logs.error_message IS 'Сообщение об ошибке (если есть)';
COMMENT ON COLUMN public.webhook_logs.processing_time_ms IS 'Время обработки в миллисекундах';
COMMENT ON COLUMN public.webhook_logs.created_at IS 'Время создания записи';

-- Функция для очистки старых логов (старше 30 дней)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.webhook_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создание расширения для планировщика (если не существует)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Планировщик для автоматической очистки логов (каждый день в 2:00)
-- SELECT cron.schedule('cleanup-webhook-logs', '0 2 * * *', 'SELECT cleanup_old_webhook_logs();');

-- Функция для получения статистики импорта
CREATE OR REPLACE FUNCTION get_import_statistics(days INTEGER DEFAULT 7)
RETURNS TABLE (
    date DATE,
    total_imports BIGINT,
    successful_imports BIGINT,
    failed_imports BIGINT,
    avg_processing_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(wl.created_at) as date,
        COUNT(*) as total_imports,
        SUM(CASE WHEN wl.status = 'success' THEN 1 ELSE 0 END) as successful_imports,
        SUM(CASE WHEN wl.status = 'error' THEN 1 ELSE 0 END) as failed_imports,
        ROUND(AVG(wl.processing_time_ms), 2) as avg_processing_time
    FROM public.webhook_logs wl
    WHERE wl.created_at >= NOW() - INTERVAL '1 day' * days
    GROUP BY DATE(wl.created_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения ошибок импорта
CREATE OR REPLACE FUNCTION get_import_errors(hours INTEGER DEFAULT 24)
RETURNS TABLE (
    endpoint VARCHAR(255),
    error_message TEXT,
    error_count BIGINT,
    last_occurrence TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wl.endpoint,
        wl.error_message,
        COUNT(*) as error_count,
        MAX(wl.created_at) as last_occurrence
    FROM public.webhook_logs wl
    WHERE wl.status = 'error' 
        AND wl.created_at >= NOW() - INTERVAL '1 hour' * hours
        AND wl.error_message IS NOT NULL
    GROUP BY wl.endpoint, wl.error_message
    ORDER BY error_count DESC, last_occurrence DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Демо данные для тестирования
INSERT INTO public.webhook_logs (endpoint, method, status, request_data, response_data, processing_time_ms) VALUES
('/api/csv-import', 'POST', 'success', '{"type": "materials", "filename": "demo_materials.csv", "rows": 5}', '{"success": 5, "errors": 0}', 1250),
('/api/webhook/csv', 'POST', 'success', '{"type": "bom", "records_count": 3}', '{"success": 3, "errors": 0}', 890),
('/api/csv-import', 'POST', 'error', '{"type": "materials", "filename": "invalid.csv", "rows": 0}', '{"success": 0, "errors": 1}', 500)
ON CONFLICT DO NOTHING;
