import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import FormData from 'form-data';
import fetch from 'node-fetch';

interface CSVImportConfig {
  watchFolder: string;
  apiEndpoint: string;
  apiKey: string;
  filePattern: RegExp;
  processedFolder: string;
  errorFolder: string;
}

class CSVAutoImporter {
  private config: CSVImportConfig;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(config: CSVImportConfig) {
    this.config = config;
    this.ensureDirectories();
  }

  private ensureDirectories() {
    // Создаем необходимые папки
    [this.config.watchFolder, this.config.processedFolder, this.config.errorFolder].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  public startWatching() {
    console.log(`🔍 Начинаем мониторинг папки: ${this.config.watchFolder}`);
    
    this.watcher = chokidar.watch(this.config.watchFolder, {
      ignored: /(^|[\/\\])\../, // игнорируем скрытые файлы
      persistent: true,
      ignoreInitial: false // обрабатываем файлы, которые уже есть в папке
    });

    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('change', (filePath) => this.handleNewFile(filePath))
      .on('error', (error) => console.error('Ошибка мониторинга:', error));

    console.log('✅ Мониторинг CSV файлов запущен');
  }

  public stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('⏹️ Мониторинг остановлен');
    }
  }

  private async handleNewFile(filePath: string) {
    const fileName = path.basename(filePath);
    
    // Проверяем, соответствует ли файл нашему паттерну
    if (!this.config.filePattern.test(fileName)) {
      console.log(`⏭️ Пропускаем файл: ${fileName} (не соответствует паттерну)`);
      return;
    }

    console.log(`📁 Обнаружен новый файл: ${fileName}`);

    try {
      // Определяем тип импорта по имени файла
      const importType = this.getImportType(fileName);
      
      // Импортируем файл
      const result = await this.importFile(filePath, importType);
      
      if (result.success) {
        console.log(`✅ Успешно импортирован: ${fileName}`);
        console.log(`📊 Результат: ${result.result.success} успешно, ${result.result.errors} ошибок`);
        
        // Перемещаем файл в папку обработанных
        await this.moveFile(filePath, this.config.processedFolder, fileName);
        
        // Отправляем уведомление об успехе
        await this.sendNotification('success', fileName, result.result);
      } else {
        console.error(`❌ Ошибка импорта: ${fileName}`);
        
        // Перемещаем файл в папку ошибок
        await this.moveFile(filePath, this.config.errorFolder, fileName);
        
        // Отправляем уведомление об ошибке
        await this.sendNotification('error', fileName, result);
      }
      
    } catch (error) {
      console.error(`💥 Критическая ошибка при обработке ${fileName}:`, error);
      
      // Перемещаем файл в папку ошибок
      await this.moveFile(filePath, this.config.errorFolder, fileName);
      
      await this.sendNotification('error', fileName, { error: (error as Error).message });
    }
  }

  private getImportType(fileName: string): 'materials' | 'bom' {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('materials') || lowerName.includes('stock') || lowerName.includes('остатки')) {
      return 'materials';
    } else if (lowerName.includes('bom') || lowerName.includes('состав') || lowerName.includes('материалы_изделий')) {
      return 'bom';
    } else {
      // По умолчанию считаем материалами
      return 'materials';
    }
  }

  private async importFile(filePath: string, type: 'materials' | 'bom') {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      
      const formData = new FormData();
      formData.append('file', fileBuffer, path.basename(filePath));
      formData.append('type', type);
      formData.append('apiKey', this.config.apiKey);

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      return { success: true, result: result.result };
      
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  private async moveFile(sourcePath: string, targetDir: string, fileName: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFileName = `${timestamp}_${fileName}`;
    const targetPath = path.join(targetDir, newFileName);
    
    fs.renameSync(sourcePath, targetPath);
    console.log(`📦 Файл перемещен: ${fileName} → ${newFileName}`);
  }

  private async sendNotification(type: 'success' | 'error', fileName: string, data: any) {
    // Здесь можно добавить отправку уведомлений:
    // - Email
    // - Slack
    // - Telegram
    // - Webhook
    
    const message = type === 'success' 
      ? `✅ CSV импорт успешен: ${fileName}`
      : `❌ Ошибка CSV импорта: ${fileName}`;
    
    console.log(`📢 ${message}`, data);
    
    // Пример отправки в Slack (если настроен webhook)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: message,
            attachments: [{
              color: type === 'success' ? 'good' : 'danger',
              fields: [
                { title: 'Файл', value: fileName, short: true },
                { title: 'Время', value: new Date().toLocaleString('ru-RU'), short: true },
                { title: 'Детали', value: JSON.stringify(data, null, 2), short: false }
              ]
            }]
          })
        });
      } catch (error) {
        console.error('Ошибка отправки уведомления в Slack:', error);
      }
    }
  }
}

// Конфигурация для разных сред
const configs = {
  development: {
    watchFolder: './csv-import/watch',
    apiEndpoint: 'http://localhost:3000/api/csv-import',
    apiKey: process.env.CSV_IMPORT_API_KEY || 'dev-key-123',
    filePattern: /\.(csv|CSV)$/,
    processedFolder: './csv-import/processed',
    errorFolder: './csv-import/errors'
  },
  production: {
    watchFolder: process.env.CSV_WATCH_FOLDER || '/var/csv-import/watch',
    apiEndpoint: process.env.CSV_API_ENDPOINT || 'https://your-domain.com/api/csv-import',
    apiKey: process.env.CSV_IMPORT_API_KEY || '',
    filePattern: /\.(csv|CSV)$/,
    processedFolder: process.env.CSV_PROCESSED_FOLDER || '/var/csv-import/processed',
    errorFolder: process.env.CSV_ERROR_FOLDER || '/var/csv-import/errors'
  }
};

// Запуск мониторинга
const environment = process.env.NODE_ENV || 'development';
const config = configs[environment as keyof typeof configs];

if (!config.apiKey) {
  console.error('❌ Не настроен CSV_IMPORT_API_KEY');
  process.exit(1);
}

const importer = new CSVAutoImporter(config);

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  importer.stopWatching();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  importer.stopWatching();
  process.exit(0);
});

// Запускаем мониторинг
importer.startWatching();

export default CSVAutoImporter;
