import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

// Конфигурация
const config = {
  watchFolder: process.env.WATCH_FOLDER || './csv-imports',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api/csv-import',
  apiKey: process.env.CSV_IMPORT_API_KEY || '',
  processedFolder: './csv-imports/processed',
  errorFolder: './csv-imports/errors',
  slackWebhook: process.env.SLACK_WEBHOOK_URL || ''
};

// Создаем необходимые папки
function ensureDirectories() {
  [config.watchFolder, config.processedFolder, config.errorFolder].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Создана папка: ${dir}`);
    }
  });
}

// Определяем тип импорта по имени файла
function getImportType(filename: string): 'materials' | 'bom' | null {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('materials') || lowerName.includes('материалы') || lowerName.includes('остатки')) {
    return 'materials';
  }
  
  if (lowerName.includes('bom') || lowerName.includes('спецификация') || lowerName.includes('комплектация')) {
    return 'bom';
  }
  
  return null;
}

// Отправляем уведомление в Slack
async function sendSlackNotification(message: string, isError = false) {
  if (!config.slackWebhook) return;
  
  try {
    const emoji = isError ? '❌' : '✅';
    const payload = {
      text: `${emoji} CSV Auto-Import: ${message}`,
      username: 'CSV Importer',
      icon_emoji: ':file_folder:'
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

// Импортируем CSV файл
async function importCsvFile(filePath: string): Promise<{ success: boolean; message: string }> {
  const filename = path.basename(filePath);
  const importType = getImportType(filename);
  
  if (!importType) {
    return {
      success: false,
      message: `Не удалось определить тип импорта для файла: ${filename}`
    };
  }
  
  try {
    console.log(`🔄 Импорт файла: ${filename} (тип: ${importType})`);
    
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'text/csv' });
    
    formData.append('file', blob, filename);
    formData.append('type', importType);
    
    if (config.apiKey) {
      formData.append('api_key', config.apiKey);
    }
    
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Успешно импортирован: ${filename}`);
      console.log(`   Успешно: ${result.success}, Ошибок: ${result.errors}`);
      
      // Перемещаем файл в папку processed
      const processedPath = path.join(config.processedFolder, filename);
      fs.renameSync(filePath, processedPath);
      
      await sendSlackNotification(`Импорт ${filename} завершен. Успешно: ${result.success}, Ошибок: ${result.errors}`);
      
      return { success: true, message: result.message };
    } else {
      throw new Error(result.error || 'Неизвестная ошибка');
    }
    
  } catch (error) {
    const errorMessage = `Ошибка импорта ${filename}: ${(error as Error).message}`;
    console.error(`❌ ${errorMessage}`);
    
    // Перемещаем файл в папку errors
    const errorPath = path.join(config.errorFolder, filename);
    fs.renameSync(filePath, errorPath);
    
    await sendSlackNotification(errorMessage, true);
    
    return { success: false, message: errorMessage };
  }
}

// Основная функция
async function startWatcher() {
  console.log('🚀 Запуск CSV Auto-Importer');
  console.log(`📁 Мониторинг папки: ${config.watchFolder}`);
  console.log(`🔗 API URL: ${config.apiUrl}`);
  
  ensureDirectories();
  
  // Обрабатываем существующие файлы
  const existingFiles = fs.readdirSync(config.watchFolder)
    .filter(file => file.toLowerCase().endsWith('.csv'));
  
  if (existingFiles.length > 0) {
    console.log(`📄 Найдено ${existingFiles.length} существующих CSV файлов`);
    for (const file of existingFiles) {
      const filePath = path.join(config.watchFolder, file);
      await importCsvFile(filePath);
    }
  }
  
  // Настраиваем мониторинг новых файлов
  const watcher = chokidar.watch(path.join(config.watchFolder, '*.csv'), {
    ignored: /(^|[\/\\])\../, // игнорируем скрытые файлы
    persistent: true,
    ignoreInitial: true
  });
  
  watcher
    .on('add', async (filePath) => {
      console.log(`📥 Новый файл обнаружен: ${path.basename(filePath)}`);
      
      // Небольшая задержка для завершения записи файла
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await importCsvFile(filePath);
    })
    .on('error', (error) => {
      console.error('❌ Ошибка мониторинга:', error);
    });
  
  console.log('👀 Мониторинг активен. Ожидание новых CSV файлов...');
  
  // Обработка сигналов завершения
  process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал завершения. Остановка мониторинга...');
    watcher.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал завершения. Остановка мониторинга...');
    watcher.close();
    process.exit(0);
  });
}

// Запуск
if (require.main === module) {
  startWatcher().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
}

export { startWatcher, importCsvFile };
