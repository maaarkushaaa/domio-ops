import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

// Типы для импорта материалов
interface MaterialStock {
  name: string;
  sku?: string;
  category?: string;
  stock_quantity: number;
  min_stock?: number;
  supplier?: string;
  unit?: string;
}

interface ProductBOM {
  product_name: string;
  product_sku?: string;
  material_name: string;
  material_sku?: string;
  quantity: number;
  unit?: string;
}

// Функция парсинга CSV
function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim());
  const result: string[][] = [];
  
  for (const line of lines) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/"/g, ''));
    result.push(values);
  }
  
  return result;
}

// Импорт остатков материалов
async function importMaterialStock(csvData: string[][]): Promise<{success: number, errors: number, details: string[]}> {
  const result = { success: 0, errors: 0, details: [] };
  
  if (csvData.length < 2) {
    result.errors++;
    result.details.push('CSV должен содержать заголовки и данные');
    return result;
  }

  const headers = csvData[0].map(h => h.trim().toLowerCase());
  
  for (let i = 1; i < csvData.length; i++) {
    const values = csvData[i];
    if (values.length !== headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    const material: MaterialStock = {
      name: row.name || row['название'] || row['материал'] || '',
      sku: row.sku || row['артикул'] || row['код'] || '',
      category: row.category || row['категория'] || '',
      stock_quantity: parseFloat(row.stock_quantity || row['остаток'] || row['количество'] || '0'),
      min_stock: parseFloat(row.min_stock || row['мин_остаток'] || row['минимальный_остаток'] || '0'),
      supplier: row.supplier || row['поставщик'] || '',
      unit: row.unit || row['единица'] || row['ед_изм'] || 'шт',
    };

    if (!material.name) continue;

    try {
      // Ищем существующий материал
      let query = supabase.from('materials').select('id');
      if (material.sku) {
        query = query.eq('sku', material.sku);
      } else {
        query = query.eq('name', material.name);
      }

      const { data: existingMaterial } = await query.single();

      if (existingMaterial) {
        // Обновляем существующий
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
          result.details.push(`Обновлен: ${material.name}`);
        }
      } else {
        // Создаем новый
        const { error } = await supabase
          .from('materials')
          .insert({
            name: material.name,
            sku: material.sku || null,
            category: material.category || null,
            unit: material.unit || 'шт',
            price_per_unit: 0,
            stock_quantity: material.stock_quantity,
            min_stock: material.min_stock || 0,
            supplier: material.supplier || null,
            notes: 'Импортирован через API',
          });

        if (error) {
          result.errors++;
          result.details.push(`Ошибка создания ${material.name}: ${error.message}`);
        } else {
          result.success++;
          result.details.push(`Создан: ${material.name}`);
        }
      }
    } catch (error) {
      result.errors++;
      result.details.push(`Ошибка обработки ${material.name}: ${(error as Error).message}`);
    }
  }

  return result;
}

// Импорт BOM
async function importProductBOM(csvData: string[][]): Promise<{success: number, errors: number, details: string[]}> {
  const result = { success: 0, errors: 0, details: [] };
  
  if (csvData.length < 2) {
    result.errors++;
    result.details.push('CSV должен содержать заголовки и данные');
    return result;
  }

  const headers = csvData[0].map(h => h.trim().toLowerCase());
  
  // Группируем по изделиям
  const productGroups: Record<string, { product_name: string; product_sku?: string; materials: ProductBOM[] }> = {};
  
  for (let i = 1; i < csvData.length; i++) {
    const values = csvData[i];
    if (values.length !== headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    const bom: ProductBOM = {
      product_name: row.product_name || row['изделие'] || row['продукт'] || '',
      product_sku: row.product_sku || row['артикул_изделия'] || row['код_изделия'] || '',
      material_name: row.material_name || row['материал'] || row['компонент'] || '',
      material_sku: row.material_sku || row['артикул_материала'] || row['код_материала'] || '',
      quantity: parseFloat(row.quantity || row['количество'] || row['кол_во'] || '0'),
      unit: row.unit || row['единица'] || row['ед_изм'] || 'шт',
    };

    if (!bom.product_name || !bom.material_name || bom.quantity <= 0) continue;

    const key = `${bom.product_name}_${bom.product_sku || ''}`;
    if (!productGroups[key]) {
      productGroups[key] = {
        product_name: bom.product_name,
        product_sku: bom.product_sku,
        materials: []
      };
    }
    productGroups[key].materials.push(bom);
  }

  // Обрабатываем каждое изделие
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

      // Удаляем существующие материалы
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
            result.details.push(`Материал не найден: ${bom.material_name}`);
            continue;
          }

          // Добавляем связь
          const { error } = await supabase
            .from('product_materials')
            .insert({
              product_id: product.id,
              material_id: material.id,
              quantity: bom.quantity,
            });

          if (error) {
            result.errors++;
            result.details.push(`Ошибка добавления ${bom.material_name}: ${error.message}`);
          } else {
            result.success++;
            result.details.push(`Добавлен: ${bom.material_name} к ${group.product_name}`);
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

  return result;
}

// API endpoint для импорта материалов
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'materials' или 'bom'
    const apiKey = formData.get('apiKey') as string;

    // Проверка API ключа (можно настроить в переменных окружения)
    if (apiKey !== process.env.CSV_IMPORT_API_KEY) {
      return NextResponse.json({ error: 'Неверный API ключ' }, { status: 401 });
    }

    if (!file || !type) {
      return NextResponse.json({ error: 'Отсутствует файл или тип' }, { status: 400 });
    }

    // Читаем файл
    const arrayBuffer = await file.arrayBuffer();
    let text = '';
    try {
      text = new TextDecoder('utf-8').decode(arrayBuffer);
    } catch {
      try {
        text = new TextDecoder('windows-1251').decode(arrayBuffer);
      } catch {
        text = new TextDecoder('latin1').decode(arrayBuffer);
      }
    }

    // Убираем BOM
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    // Парсим CSV
    const csvData = parseCSV(text);

    // Импортируем данные
    let result;
    if (type === 'materials') {
      result = await importMaterialStock(csvData);
    } else if (type === 'bom') {
      result = await importProductBOM(csvData);
    } else {
      return NextResponse.json({ error: 'Неверный тип импорта' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ошибка импорта CSV:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: (error as Error).message 
    }, { status: 500 });
  }
}
