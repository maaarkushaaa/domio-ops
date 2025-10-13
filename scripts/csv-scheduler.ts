import * as fs from 'fs';
import * as cron from 'node-cron';

interface ScheduleTask {
  name: string;
  schedule: string;
  type: 'materials' | 'bom';
  source: {
    type: 'url' | 'file';
    url?: string;
    file?: string;
  };
  enabled: boolean;
}

interface ScheduleConfig {
  tasks: ScheduleTask[];
}

// Конфигурация
const config = {
  scheduleFile: process.env.SCHEDULE_FILE || './csv-schedule.json',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api/csv-import',
  apiKey: process.env.CSV_IMPORT_API_KEY || '',
  slackWebhook: process.env.SLACK_WEBHOOK_URL || ''
};

// Отправляем уведомление в Slack
async function sendSlackNotification(message: string, isError = false) {
  if (!config.slackWebhook) return;
  
  try {
    const emoji = isError ? '❌' : '✅';
    const payload = {
      text: `${emoji} CSV Scheduler: ${message}`,
      username: 'CSV Scheduler',
      icon_emoji: ':clock1:'
    };
    
    await fetch(config.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Ошибка отправки Slack уведомления:', error);
  }
}

// Загружаем конфигурацию расписания
function loadScheduleConfig(): ScheduleConfig {
  try {
    if (fs.existsSync(config.scheduleFile)) {
      const content = fs.readFileSync(config.scheduleFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Ошибка загрузки конфигурации:', error);
  }
  
  // Возвращаем конфигурацию по умолчанию
  return {
    tasks: [
      {
        name: 'daily-materials-import',
        schedule: '0 9 * * *', // Каждый день в 9:00
        type: 'materials',
        source: {
          type: 'url',
          url: 'https://supplier.com/api/materials.csv'
        },
        enabled: false
      }
    ]
  };
}

// Выполняем задачу импорта
async function executeImportTask(task: ScheduleTask): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔄 Выполнение задачи: ${task.name}`);
    
    let csvData: string;
    
    if (task.source.type === 'url') {
      // Загружаем данные по URL
      if (!task.source.url) {
        throw new Error('URL не указан для задачи');
      }
      
      const response = await fetch(task.source.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      csvData = await response.text();
    } else if (task.source.type === 'file') {
      // Читаем данные из файла
      if (!task.source.file) {
        throw new Error('Путь к файлу не указан для задачи');
      }
      
      if (!fs.existsSync(task.source.file)) {
        throw new Error(`Файл не найден: ${task.source.file}`);
      }
      
      csvData = fs.readFileSync(task.source.file, 'utf-8');
    } else {
      throw new Error('Неподдерживаемый тип источника');
    }
    
    // Создаем временный файл
    const tempFile = `temp_${task.name}_${Date.now()}.csv`;
    fs.writeFileSync(tempFile, csvData);
    
    try {
      // Отправляем данные на API
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(tempFile);
      const blob = new Blob([fileBuffer], { type: 'text/csv' });
      
      formData.append('file', blob, tempFile);
      formData.append('type', task.type);
      
      if (config.apiKey) {
        formData.append('api_key', config.apiKey);
      }
      
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const message = `Задача ${task.name} выполнена. Успешно: ${result.success}, Ошибок: ${result.errors}`;
        console.log(`✅ ${message}`);
        
        await sendSlackNotification(message);
        
        return { success: true, message };
      } else {
        throw new Error(result.error || 'Неизвестная ошибка API');
      }
      
    } finally {
      // Удаляем временный файл
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
    
  } catch (error) {
    const errorMessage = `Ошибка выполнения задачи ${task.name}: ${(error as Error).message}`;
    console.error(`❌ ${errorMessage}`);
    
    await sendSlackNotification(errorMessage, true);
    
    return { success: false, message: errorMessage };
  }
}

// Основная функция
async function startScheduler() {
  console.log('🚀 Запуск CSV Scheduler');
  console.log(`📅 Конфигурация: ${config.scheduleFile}`);
  console.log(`🔗 API URL: ${config.apiUrl}`);
  
  const scheduleConfig = loadScheduleConfig();
  
  if (scheduleConfig.tasks.length === 0) {
    console.log('⚠️ Нет активных задач в конфигурации');
    return;
  }
  
  console.log(`📋 Найдено ${scheduleConfig.tasks.length} задач:`);
  
  // Регистрируем задачи
  for (const task of scheduleConfig.tasks) {
    if (!task.enabled) {
      console.log(`⏸️ Задача ${task.name} отключена`);
      continue;
    }
    
    if (!cron.validate(task.schedule)) {
      console.error(`❌ Неверное расписание для задачи ${task.name}: ${task.schedule}`);
      continue;
    }
    
    console.log(`⏰ Задача ${task.name}: ${task.schedule} (${task.type})`);
    
    cron.schedule(task.schedule, async () => {
      console.log(`⏰ Запуск задачи по расписанию: ${task.name}`);
      await executeImportTask(task);
    });
  }
  
  console.log('👀 Планировщик активен. Ожидание выполнения задач...');
  
  // Обработка сигналов завершения
  process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал завершения. Остановка планировщика...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал завершения. Остановка планировщика...');
    process.exit(0);
  });
}

// Создаем пример конфигурации
function createExampleConfig() {
  const exampleConfig: ScheduleConfig = {
    tasks: [
      {
        name: 'daily-materials-import',
        schedule: '0 9 * * *', // Каждый день в 9:00
        type: 'materials',
        source: {
          type: 'url',
          url: 'https://supplier.com/api/materials.csv'
        },
        enabled: false
      },
      {
        name: 'weekly-bom-import',
        schedule: '0 8 * * 1', // Каждый понедельник в 8:00
        type: 'bom',
        source: {
          type: 'file',
          file: './data/bom-export.csv'
        },
        enabled: false
      },
      {
        name: 'hourly-stock-update',
        schedule: '0 * * * *', // Каждый час
        type: 'materials',
        source: {
          type: 'url',
          url: 'https://warehouse.com/api/stock.csv'
        },
        enabled: false
      }
    ]
  };
  
  if (!fs.existsSync(config.scheduleFile)) {
    fs.writeFileSync(config.scheduleFile, JSON.stringify(exampleConfig, null, 2));
    console.log(`📄 Создан пример конфигурации: ${config.scheduleFile}`);
  }
}

// Запуск
if (require.main === module) {
  createExampleConfig();
  
  startScheduler().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
}

export { startScheduler, executeImportTask, loadScheduleConfig };
