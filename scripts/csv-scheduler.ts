import cron from 'node-cron';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface ScheduledImportConfig {
  name: string;
  schedule: string; // cron expression
  type: 'materials' | 'bom';
  source: {
    type: 'url' | 'file' | 'api';
    url?: string;
    filePath?: string;
    apiEndpoint?: string;
    apiKey?: string;
  };
  enabled: boolean;
}

class CSVScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private configs: ScheduledImportConfig[] = [];

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs() {
    // Загружаем конфигурации из файла или переменных окружения
    const configFile = process.env.CSV_SCHEDULER_CONFIG || './csv-scheduler-config.json';
    
    if (fs.existsSync(configFile)) {
      try {
        const configData = fs.readFileSync(configFile, 'utf8');
        this.configs = JSON.parse(configData);
      } catch (error) {
        console.error('Ошибка загрузки конфигурации планировщика:', error);
        this.configs = this.getDefaultConfigs();
      }
    } else {
      this.configs = this.getDefaultConfigs();
      this.saveConfigs();
    }

    console.log(`📋 Загружено ${this.configs.length} задач планировщика`);
  }

  private getDefaultConfigs(): ScheduledImportConfig[] {
    return [
      {
        name: 'daily_materials_import',
        schedule: '0 6 * * *', // Каждый день в 6:00
        type: 'materials',
        source: {
          type: 'url',
          url: process.env.DAILY_MATERIALS_URL || 'https://warehouse.example.com/api/materials/export'
        },
        enabled: false
      },
      {
        name: 'weekly_bom_import',
        schedule: '0 8 * * 1', // Каждый понедельник в 8:00
        type: 'bom',
        source: {
          type: 'file',
          filePath: process.env.WEEKLY_BOM_FILE || '/var/csv-import/scheduled/bom.csv'
        },
        enabled: false
      },
      {
        name: 'hourly_stock_update',
        schedule: '0 * * * *', // Каждый час
        type: 'materials',
        source: {
          type: 'api',
          apiEndpoint: process.env.STOCK_API_ENDPOINT || 'https://stock-api.example.com/current',
          apiKey: process.env.STOCK_API_KEY || ''
        },
        enabled: false
      }
    ];
  }

  private saveConfigs() {
    const configFile = process.env.CSV_SCHEDULER_CONFIG || './csv-scheduler-config.json';
    fs.writeFileSync(configFile, JSON.stringify(this.configs, null, 2));
  }

  public startScheduler() {
    console.log('🚀 Запуск планировщика CSV импорта...');

    for (const config of this.configs) {
      if (!config.enabled) {
        console.log(`⏭️ Пропускаем отключенную задачу: ${config.name}`);
        continue;
      }

      try {
        const task = cron.schedule(config.schedule, async () => {
          console.log(`⏰ Выполняем задачу: ${config.name}`);
          await this.executeTask(config);
        }, {
          scheduled: true,
          timezone: process.env.TZ || 'Europe/Moscow'
        });

        this.tasks.set(config.name, task);
        console.log(`✅ Задача запланирована: ${config.name} (${config.schedule})`);
      } catch (error) {
        console.error(`❌ Ошибка создания задачи ${config.name}:`, error);
      }
    }

    console.log(`🎯 Планировщик запущен. Активных задач: ${this.tasks.size}`);
  }

  public stopScheduler() {
    console.log('🛑 Остановка планировщика...');
    
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`⏹️ Остановлена задача: ${name}`);
    }
    
    this.tasks.clear();
    console.log('✅ Планировщик остановлен');
  }

  private async executeTask(config: ScheduledImportConfig) {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Начинаем выполнение: ${config.name}`);
      
      let data;
      
      switch (config.source.type) {
        case 'url':
          data = await this.fetchFromUrl(config.source.url!);
          break;
        case 'file':
          data = await this.readFromFile(config.source.filePath!);
          break;
        case 'api':
          data = await this.fetchFromApi(config.source.apiEndpoint!, config.source.apiKey!);
          break;
        default:
          throw new Error(`Неизвестный тип источника: ${config.source.type}`);
      }

      // Импортируем данные
      const result = await this.importData(data, config.type);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Задача выполнена: ${config.name}`);
      console.log(`📊 Результат: ${result.success} успешно, ${result.errors} ошибок`);
      console.log(`⏱️ Время выполнения: ${duration}ms`);
      
      // Отправляем уведомление
      await this.sendTaskNotification(config.name, result, duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`💥 Ошибка выполнения задачи ${config.name}:`, error);
      
      await this.sendTaskNotification(config.name, { 
        success: 0, 
        errors: 1, 
        details: [(error as Error).message] 
      }, duration, true);
    }
  }

  private async fetchFromUrl(url: string): Promise<any[]> {
    console.log(`🌐 Загружаем данные из URL: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    return this.parseCSV(csvText);
  }

  private async readFromFile(filePath: string): Promise<any[]> {
    console.log(`📁 Читаем данные из файла: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл не найден: ${filePath}`);
    }
    
    const csvText = fs.readFileSync(filePath, 'utf8');
    return this.parseCSV(csvText);
  }

  private async fetchFromApi(endpoint: string, apiKey: string): Promise<any[]> {
    console.log(`🔌 Загружаем данные из API: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items || data.data || data;
  }

  private parseCSV(csvText: string): any[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
    
    return data;
  }

  private async importData(data: any[], type: 'materials' | 'bom'): Promise<{success: number, errors: number, details: string[]}> {
    const formData = new FormData();
    
    // Создаем CSV из данных
    const csvContent = this.createCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    formData.append('file', blob, `scheduled_${type}_${Date.now()}.csv`);
    formData.append('type', type);
    formData.append('apiKey', process.env.CSV_IMPORT_API_KEY || '');
    
    const response = await fetch(process.env.CSV_IMPORT_API_ENDPOINT || 'http://localhost:3000/api/csv-import', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Import API Error: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    return result.result;
  }

  private createCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Экранируем кавычки и запятые
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(values.join(','));
    }
    
    return csvLines.join('\n');
  }

  private async sendTaskNotification(taskName: string, result: any, duration: number, isError = false) {
    const message = isError 
      ? `❌ Ошибка выполнения задачи: ${taskName}`
      : `✅ Задача выполнена: ${taskName}`;
    
    console.log(`📢 ${message}`, result);
    
    // Отправка в Slack (если настроен)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: message,
            attachments: [{
              color: isError ? 'danger' : 'good',
              fields: [
                { title: 'Задача', value: taskName, short: true },
                { title: 'Время выполнения', value: `${duration}ms`, short: true },
                { title: 'Успешно', value: result.success || 0, short: true },
                { title: 'Ошибки', value: result.errors || 0, short: true },
                { title: 'Детали', value: result.details?.join('\n') || 'Нет деталей', short: false }
              ]
            }]
          })
        });
      } catch (error) {
        console.error('Ошибка отправки уведомления в Slack:', error);
      }
    }
  }

  // Методы управления задачами
  public enableTask(taskName: string) {
    const config = this.configs.find(c => c.name === taskName);
    if (config) {
      config.enabled = true;
      this.saveConfigs();
      console.log(`✅ Задача включена: ${taskName}`);
    }
  }

  public disableTask(taskName: string) {
    const config = this.configs.find(c => c.name === taskName);
    if (config) {
      config.enabled = false;
      this.saveConfigs();
      console.log(`⏸️ Задача отключена: ${taskName}`);
    }
  }

  public addTask(config: ScheduledImportConfig) {
    this.configs.push(config);
    this.saveConfigs();
    console.log(`➕ Добавлена новая задача: ${config.name}`);
  }

  public removeTask(taskName: string) {
    this.configs = this.configs.filter(c => c.name !== taskName);
    this.saveConfigs();
    console.log(`➖ Удалена задача: ${taskName}`);
  }

  public listTasks() {
    console.log('📋 Список задач планировщика:');
    this.configs.forEach(config => {
      console.log(`  ${config.enabled ? '✅' : '❌'} ${config.name} (${config.schedule}) - ${config.type}`);
    });
  }
}

// Запуск планировщика
const scheduler = new CSVScheduler();

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  scheduler.stopScheduler();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  scheduler.stopScheduler();
  process.exit(0);
});

// Запускаем планировщик
scheduler.startScheduler();

export default scheduler;
