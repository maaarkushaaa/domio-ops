# Система автоматического импорта CSV файлов

## Обзор

Система автоматического импорта позволяет интегрировать CSV данные из внешних источников в систему управления производством. Поддерживаются различные методы интеграции и форматы данных.

## Методы импорта

### 1. API Endpoint

**URL:** `POST /api/csv-import`

**Параметры:**
- `type`: тип импорта (`materials` или `bom`)
- `file`: CSV файл
- `api_key`: ключ авторизации (опционально)

**Пример использования:**
```bash
curl -X POST http://localhost:3000/api/csv-import \
  -F "type=materials" \
  -F "file=@materials.csv" \
  -F "api_key=your-api-key"
```

### 2. Мониторинг папки

**Скрипт:** `scripts/csv-auto-importer.ts`

**Настройка:**
```bash
# Установка зависимостей
npm install chokidar

# Запуск мониторинга
node scripts/csv-auto-importer.ts
```

**Переменные окружения:**
```bash
WATCH_FOLDER=/path/to/csv/files
API_URL=http://localhost:3000/api/csv-import
API_KEY=your-api-key
```

### 3. Webhook интеграция

**URL:** `POST /api/webhook/csv`

**Формат данных:**
```json
{
  "type": "materials",
  "data": [
    {
      "name": "EGGER H1137 ST9",
      "sku": "H1137-ST9",
      "category": "ЛДСП",
      "stock_quantity": 50,
      "min_stock": 10,
      "supplier": "EGGER",
      "unit": "м²"
    }
  ],
  "signature": "optional-signature"
}
```

### 4. Планировщик задач

**Скрипт:** `scripts/csv-scheduler.ts`

**Конфигурация:** `csv-schedule.json`
```json
{
  "tasks": [
    {
      "name": "daily-materials-import",
      "schedule": "0 9 * * *",
      "type": "materials",
      "source": {
        "type": "url",
        "url": "https://supplier.com/api/materials.csv"
      }
    }
  ]
}
```

## Форматы CSV

### Материалы (materials)

**Обязательные поля:**
- `name` - название материала
- `sku` - артикул
- `stock_quantity` - количество на складе
- `unit` - единица измерения

**Опциональные поля:**
- `category` - категория
- `min_stock` - минимальный остаток
- `supplier` - поставщик
- `price` - цена за единицу

### BOM (Bill of Materials)

**Обязательные поля:**
- `product_name` - название изделия
- `product_sku` - артикул изделия
- `material_name` - название материала
- `material_sku` - артикул материала
- `quantity` - количество

**Опциональные поля:**
- `unit` - единица измерения

## Логирование

Все операции импорта логируются в таблицу `webhook_logs`:

```sql
SELECT * FROM webhook_logs 
WHERE created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;
```

## Уведомления

**Slack интеграция:**
```bash
# Настройка webhook URL (замените на ваш реальный URL)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Формат уведомлений:
# ✅ CSV импорт успешен: materials_stock.csv
# ❌ Ошибка CSV импорта: bom_products.csv
```

**Email уведомления (планируется):**
- Успешные импорты
- Ошибки импорта
- Еженедельные отчеты

## Безопасность

### API ключи
```bash
# Генерация API ключа
API_KEY=$(openssl rand -hex 32)
```

### Подпись webhook
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Мониторинг

### Статистика импорта
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_imports,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
FROM webhook_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Ошибки импорта
```sql
SELECT 
  endpoint,
  error_message,
  COUNT(*) as error_count
FROM webhook_logs 
WHERE status = 'error' 
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint, error_message
ORDER BY error_count DESC;
```

## Интеграция с внешними системами

### Складская система
- Автоматический импорт остатков материалов
- Обновление каждые 4 часа
- Уведомления о низких остатках

### CAD система
- Экспорт BOM из проектов
- Автоматический импорт при сохранении
- Синхронизация изменений

### ERP система
- Двусторонняя синхронизация
- Импорт заказов и поставок
- Экспорт готовой продукции

## Troubleshooting

### Частые проблемы

1. **Неправильная кодировка CSV**
   - Решение: используйте UTF-8 с BOM
   - Проверка: откройте файл в текстовом редакторе

2. **Ошибки парсинга**
   - Решение: проверьте разделители и кавычки
   - Используйте шаблоны из системы

3. **Таймауты при больших файлах**
   - Решение: разбейте файл на части
   - Увеличьте лимиты сервера

### Логи отладки
```bash
# Включить подробные логи
DEBUG=csv-import node scripts/csv-auto-importer.ts

# Логи webhook
DEBUG=webhook node scripts/csv-scheduler.ts
```

## Примеры использования

### Импорт материалов из Excel
1. Сохраните данные как CSV UTF-8
2. Загрузите через API или поместите в папку мониторинга
3. Проверьте результат в логах

### Автоматический импорт BOM
1. Настройте webhook в CAD системе
2. Укажите URL: `https://your-domain.com/api/webhook/csv`
3. Отправляйте данные при сохранении проекта

### Планировщик задач
1. Создайте `csv-schedule.json`
2. Настройте cron расписание
3. Запустите `scripts/csv-scheduler.ts`

## Поддержка

При возникновении проблем:
1. Проверьте логи в `webhook_logs`
2. Убедитесь в правильности формата CSV
3. Проверьте настройки API ключей
4. Обратитесь к документации по интеграции
