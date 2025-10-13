import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Download, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppNotifications } from '@/components/NotificationIntegration';
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

interface ProductBOM {
  product_name: string;
  product_sku?: string;
  material_name: string;
  material_sku?: string;
  quantity: number;
  unit?: string;
}

interface ImportResult {
  success: number;
  errors: number;
  warnings: number;
  details: string[];
}

export function ProductBOMImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ProductBOM[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notifyCSVImport } = useAppNotifications();

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
      const data: ProductBOM[] = [];

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
        const bom: ProductBOM = {
          product_name: row.product_name || row['изделие'] || row['продукт'] || '',
          product_sku: row.product_sku || row['артикул_изделия'] || row['код_изделия'] || '',
          material_name: row.material_name || row['материал'] || row['компонент'] || '',
          material_sku: row.material_sku || row['артикул_материала'] || row['код_материала'] || '',
          quantity: parseFloat(row.quantity || row['количество'] || row['кол_во'] || '0'),
          unit: row.unit || row['единица'] || row['ед_изм'] || 'шт',
        };

        if (bom.product_name && bom.material_name && bom.quantity > 0) {
          data.push(bom);
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
      // Группируем данные по изделиям
      const productGroups = previewData.reduce((acc, bom) => {
        const key = `${bom.product_name}_${bom.product_sku || ''}`;
        if (!acc[key]) {
          acc[key] = {
            product_name: bom.product_name,
            product_sku: bom.product_sku,
            materials: []
          };
        }
        acc[key].materials.push(bom);
        return acc;
      }, {} as Record<string, { product_name: string; product_sku?: string; materials: ProductBOM[] }>);

      for (const [key, group] of Object.entries(productGroups)) {
        try {
          // Находим изделие
          let productQuery = supabase.from('products').select('id');
          
          if (group.product_sku) {
            productQuery = productQuery.eq('sku', group.product_sku);
          } else {
            productQuery = productQuery.eq('name', group.product_name);
          }

          const { data: product } = await productQuery.single();

          if (!product) {
            result.errors++;
            result.details.push(`Изделие не найдено: ${group.product_name}`);
            continue;
          }

          // Удаляем существующие материалы для этого изделия
          await supabase
            .from('product_materials')
            .delete()
            .eq('product_id', product.id);

          // Добавляем новые материалы
          for (const bom of group.materials) {
            try {
              // Находим материал
              let materialQuery = supabase.from('materials').select('id');
              
              if (bom.material_sku) {
                materialQuery = materialQuery.eq('sku', bom.material_sku);
              } else {
                materialQuery = materialQuery.eq('name', bom.material_name);
              }

              const { data: material } = await materialQuery.single();

              if (!material) {
                result.warnings++;
                result.details.push(`Материал не найден: ${bom.material_name} (для изделия ${group.product_name})`);
                continue;
              }

              // Добавляем связь изделие-материал
              const { error } = await supabase
                .from('product_materials')
                .insert({
                  product_id: product.id,
                  material_id: material.id,
                  quantity: bom.quantity,
                });

              if (error) {
                result.errors++;
                result.details.push(`Ошибка добавления материала ${bom.material_name}: ${error.message}`);
              } else {
                result.success++;
                result.details.push(`Добавлен: ${bom.material_name} (${bom.quantity} ${bom.unit}) к ${group.product_name}`);
              }
            } catch (error) {
              result.errors++;
              result.details.push(`Ошибка обработки материала ${bom.material_name}: ${(error as Error).message}`);
            }
          }
        } catch (error) {
          result.errors++;
          result.details.push(`Ошибка обработки изделия ${group.product_name}: ${(error as Error).message}`);
        }
      }

      setImportResult(result);
      
      // Показываем оповещение о результате импорта
      notifyCSVImport('bom', result.success, result.errors);
      
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
      'product_name,product_sku,material_name,material_sku,quantity,unit',
      'Стол письменный Лофт,STL-004,EGGER H1137 ST9 Дуб Галифакс белый,H1137,2.5,м²',
      'Стол письменный Лофт,STL-004,Blum Tandem Plus 563H,563H,2,шт',
      'Стол письменный Лофт,STL-004,Hettich InnoTech 35,IT35,4,шт',
      'Шкаф-купе Бергамо,SHK-001,EGGER H1176 ST9 Дуб Галифакс натуральный,H1176,8.2,м²',
      'Шкаф-купе Бергамо,SHK-001,Blum Tandem Plus 563H,563H,6,шт'
    ].join('\n');

    // Добавляем BOM для правильной кодировки UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_bom_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Package className="h-4 w-4 mr-2" />
        Импорт BOM
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Импорт BOM (Bill of Materials) из CSV
            </AlertDialogTitle>
            <AlertDialogDescription>
              Загрузите CSV файл с данными о количестве материалов для каждого изделия.
              Система автоматически создаст связи между изделиями и материалами.
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
                    {previewData.slice(0, 10).map((bom, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{bom.product_name}</span>
                          {bom.product_sku && <span className="text-sm text-muted-foreground ml-2">({bom.product_sku})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">→</span>
                          <span className="font-medium">{bom.material_name}</span>
                          <Badge variant="outline">{bom.quantity} {bom.unit}</Badge>
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
