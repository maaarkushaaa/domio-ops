import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;
    const apiKey = formData.get('api_key') as string;

    // Проверка API ключа (опционально)
    if (apiKey && apiKey !== process.env.CSV_IMPORT_API_KEY) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    if (!type || !file) {
      return NextResponse.json({ error: 'Missing type or file' }, { status: 400 });
    }

    if (!['materials', 'bom'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be materials or bom' }, { status: 400 });
    }

    // Читаем файл
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must contain headers and at least one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length !== headers.length) {
        continue; // Пропускаем строки с неправильным количеством колонок
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }

    let result = { success: 0, errors: 0, details: [] as string[] };

    if (type === 'materials') {
      // Импорт материалов
      for (const item of data) {
        try {
          const { error } = await supabase
            .from('materials')
            .upsert({
              name: item.name || item['название'] || '',
              sku: item.sku || item['артикул'] || '',
              category: item.category || item['категория'] || '',
              stock_quantity: parseFloat(item.stock_quantity || item['остаток'] || '0'),
              min_stock: parseFloat(item.min_stock || item['мин_остаток'] || '0'),
              supplier: item.supplier || item['поставщик'] || '',
              unit: item.unit || item['единица'] || 'шт',
              price: parseFloat(item.price || item['цена'] || '0'),
            }, { onConflict: 'sku' });

          if (error) {
            result.errors++;
            result.details.push(`Ошибка материала ${item.name}: ${error.message}`);
          } else {
            result.success++;
          }
        } catch (error) {
          result.errors++;
          result.details.push(`Ошибка обработки ${item.name}: ${(error as Error).message}`);
        }
      }
    } else if (type === 'bom') {
      // Импорт BOM
      const productGroups = data.reduce((groups: any, item: any) => {
        const productKey = `${item.product_name}_${item.product_sku}`;
        if (!groups[productKey]) {
          groups[productKey] = {
            product_name: item.product_name,
            product_sku: item.product_sku,
            materials: []
          };
        }
        groups[productKey].materials.push({
          material_name: item.material_name,
          material_sku: item.material_sku,
          quantity: parseFloat(item.quantity || '0'),
          unit: item.unit || 'шт'
        });
        return groups;
      }, {});

      for (const [key, group] of Object.entries(productGroups)) {
        try {
          const productGroup = group as any;
          
          // Получаем или создаем продукт
          let { data: product, error: productError } = await supabase
            .from('products')
            .select('id')
            .eq('sku', productGroup.product_sku)
            .single();

          if (productError && productError.code === 'PGRST116') {
            // Продукт не найден, создаем новый
            const { data: newProduct, error: createError } = await supabase
              .from('products')
              .insert({
                name: productGroup.product_name,
                sku: productGroup.product_sku,
                status: 'planning',
                progress: 0
              })
              .select('id')
              .single();

            if (createError) {
              result.errors++;
              result.details.push(`Ошибка создания продукта ${productGroup.product_name}: ${createError.message}`);
              continue;
            }
            product = newProduct;
          } else if (productError) {
            result.errors++;
            result.details.push(`Ошибка поиска продукта ${productGroup.product_name}: ${productError.message}`);
            continue;
          }

          // Удаляем старые материалы продукта
          await supabase
            .from('product_materials')
            .delete()
            .eq('product_id', product.id);

          // Добавляем новые материалы
          for (const material of productGroup.materials) {
            const { error: materialError } = await supabase
              .from('product_materials')
              .insert({
                product_id: product.id,
                material_name: material.material_name,
                material_sku: material.material_sku,
                quantity: material.quantity,
                unit: material.unit
              });

            if (materialError) {
              result.errors++;
              result.details.push(`Ошибка материала ${material.material_name}: ${materialError.message}`);
            } else {
              result.success++;
            }
          }
        } catch (error) {
          result.errors++;
          result.details.push(`Ошибка обработки продукта ${productGroup.product_name}: ${(error as Error).message}`);
        }
      }
    }

    // Логируем результат
    await supabase
      .from('webhook_logs')
      .insert({
        endpoint: '/api/csv-import',
        method: 'POST',
        status: result.errors === 0 ? 'success' : 'partial',
        request_data: { type, filename: file.name, rows: data.length },
        response_data: result,
        processing_time_ms: 0
      });

    return NextResponse.json({
      message: `Импорт завершен. Успешно: ${result.success}, Ошибок: ${result.errors}`,
      ...result
    });

  } catch (error) {
    console.error('CSV Import Error:', error);
    
    // Логируем ошибку
    await supabase
      .from('webhook_logs')
      .insert({
        endpoint: '/api/csv-import',
        method: 'POST',
        status: 'error',
        error_message: (error as Error).message,
        processing_time_ms: 0
      });

    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
