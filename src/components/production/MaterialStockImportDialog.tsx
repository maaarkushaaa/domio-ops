import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MaterialStock {
  name: string;
  sku?: string;
  category?: string;
  stock_quantity: number;
  min_stock?: number;
  supplier?: string;
  unit?: string;
}

interface ImportResult {
  success: number;
  errors: number;
  warnings: number;
  details: string[];
}

export function MaterialStockImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<MaterialStock[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка загрузки файла
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Пожалуйста, выберите CSV файл');
      return;
    }

    setFile(uploadedFile);
    setIsPreviewing(true);

    try {
      // Читаем файл как ArrayBuffer для правильной обработки кодировки
      const arrayBuffer = await uploadedFile.arrayBuffer();
      
      // Пробуем разные кодировки
      let text = '';
      try {
        // Сначала пробуем UTF-8
        text = new TextDecoder('utf-8').decode(arrayBuffer);
      } catch {
        try {
          // Если не получилось, пробуем Windows-1251
          text = new TextDecoder('windows-1251').decode(arrayBuffer);
        } catch {
          // В крайнем случае используем latin1
          text = new TextDecoder('latin1').decode(arrayBuffer);
        }
      }

      // Убираем BOM если есть
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      // Определяем разделитель (запятая, точка с запятой или табуляция)
      const firstLine = text.split('\n')[0];
      let delimiter = ',';
      if (firstLine.includes(';')) delimiter = ';';
      else if (firstLine.includes('\t')) delimiter = '\t';

      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV файл должен содержать заголовки и хотя бы одну строку данных');
        return;
      }

      // Парсим CSV с учетом кавычек
      const parseCSVLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const data: MaterialStock[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          console.warn(`Строка ${i + 1}: несоответствие количества колонок (${values.length} vs ${headers.length})`);
          continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Преобразуем данные в нужный формат
        const material: MaterialStock = {
          name: row.name || row['название'] || row['материал'] || '',
          sku: row.sku || row['артикул'] || row['код'] || '',
          category: row.category || row['категория'] || '',
          stock_quantity: parseFloat(row.stock_quantity || row['остаток'] || row['количество'] || '0'),
          min_stock: parseFloat(row.min_stock || row['мин_остаток'] || row['минимальный_остаток'] || '0'),
          supplier: row.supplier || row['поставщик'] || '',
          unit: row.unit || row['единица'] || row['ед_изм'] || 'шт',
        };

        if (material.name) {
          data.push(material);
        }
      }

      setPreviewData(data);
    } catch (error) {
      console.error('Ошибка при чтении файла:', error);
      alert('Ошибка при чтении CSV файла. Проверьте кодировку файла (должна быть UTF-8).');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Импорт данных в базу
  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsImporting(true);
    const result: ImportResult = {
      success: 0,
      errors: 0,
      warnings: 0,
      details: []
    };

    try {
      for (const material of previewData) {
        try {
          // Ищем существующий материал по названию или SKU
          let query = supabase.from('materials').select('id');
          
          if (material.sku) {
            query = query.eq('sku', material.sku);
          } else {
            query = query.eq('name', material.name);
          }

          const { data: existingMaterial } = await query.single();

          if (existingMaterial) {
            // Обновляем существующий материал
            const { error } = await supabase
              .from('materials')
              .update({
                stock_quantity: material.stock_quantity,
                min_stock: material.min_stock || 0,
                supplier: material.supplier || null,
                category: material.category || null,
                unit: material.unit || 'шт',
              })
              .eq('id', existingMaterial.id);

            if (error) {
              result.errors++;
              result.details.push(`Ошибка обновления ${material.name}: ${error.message}`);
            } else {
              result.success++;
              result.details.push(`Обновлен: ${material.name} (остаток: ${material.stock_quantity})`);
            }
          } else {
            // Создаем новый материал
            const { error } = await supabase
              .from('materials')
              .insert({
                name: material.name,
                sku: material.sku || null,
                category: material.category || null,
                unit: material.unit || 'шт',
                price_per_unit: 0, // По умолчанию
                stock_quantity: material.stock_quantity,
                min_stock: material.min_stock || 0,
                supplier: material.supplier || null,
                notes: 'Импортирован из CSV',
              });

            if (error) {
              result.errors++;
              result.details.push(`Ошибка создания ${material.name}: ${error.message}`);
            } else {
              result.success++;
              result.details.push(`Создан: ${material.name} (остаток: ${material.stock_quantity})`);
            }
          }
        } catch (error) {
          result.errors++;
          result.details.push(`Ошибка обработки ${material.name}: ${(error as Error).message}`);
        }
      }

      setImportResult(result);
      
      // Перезагружаем страницу для обновления данных
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Ошибка импорта:', error);
      alert('Ошибка при импорте данных');
    } finally {
      setIsImporting(false);
    }
  };

  // Сброс состояния
  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Скачивание шаблона
  const downloadTemplate = () => {
    const csvContent = [
      'name,sku,category,stock_quantity,min_stock,supplier,unit',
      'EGGER H1137 ST9 Дуб Галифакс белый,H1137,ЛДСП EGGER,25.5,10,EGGER,м²',
      'Blum Tandem Plus 563H,563H,Направляющие,15,5,Blum,шт',
      'Hettich InnoTech 35,IT35,Петли,8,3,Hettich,шт'
    ].join('\n');

    // Добавляем BOM для правильной кодировки UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'materials_stock_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Импорт остатков
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Импорт остатков материалов из CSV
            </AlertDialogTitle>
            <AlertDialogDescription>
              Загрузите CSV файл с данными об остатках материалов на складе.
              Система автоматически обновит существующие материалы или создаст новые.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6">
            {/* Загрузка файла */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Загрузка файла</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPreviewing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isPreviewing ? 'Обработка...' : 'Выбрать CSV файл'}
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Скачать шаблон
                  </Button>
                </div>
                
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <Badge variant="outline">{previewData.length} записей</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Предварительный просмотр */}
            {previewData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Предварительный просмотр</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {previewData.slice(0, 10).map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{material.name}</span>
                          {material.sku && <span className="text-sm text-muted-foreground ml-2">({material.sku})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{material.stock_quantity} {material.unit}</Badge>
                          {material.supplier && <Badge variant="secondary">{material.supplier}</Badge>}
                        </div>
                      </div>
                    ))}
                    {previewData.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... и еще {previewData.length - 10} записей
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Результат импорта */}
            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3. Результат импорта</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-600 font-medium">{importResult.success} успешно</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-600 font-medium">{importResult.errors} ошибок</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="text-yellow-600 font-medium">{importResult.warnings} предупреждений</span>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.details.map((detail, index) => (
                      <p key={index} className="text-sm">{detail}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Прогресс импорта */}
            {isImporting && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Импорт данных...</span>
                      <span className="text-sm text-muted-foreground">Пожалуйста, подождите</span>
                    </div>
                    <Progress value={undefined} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleReset}>Отмена</AlertDialogCancel>
            {previewData.length > 0 && !importResult && (
              <AlertDialogAction
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? 'Импорт...' : 'Импортировать данные'}
              </AlertDialogAction>
            )}
            {importResult && (
              <AlertDialogAction onClick={() => setIsOpen(false)}>
                Закрыть
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
