import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

interface WebhookPayload {
  type: 'materials' | 'bom';
  data: any[];
  source: string;
  timestamp: string;
  webhookId?: string;
}

// Функция для обработки данных из веб-хука
async function processWebhookData(payload: WebhookPayload) {
  const result = { success: 0, errors: 0, details: [] };

  try {
    if (payload.type === 'materials') {
      // Обрабатываем данные материалов
      for (const item of payload.data) {
        try {
          // Ищем существующий материал
          let query = supabase.from('materials').select('id');
          if (item.sku) {
            query = query.eq('sku', item.sku);
          } else {
            query = query.eq('name', item.name);
          }

          const { data: existingMaterial } = await query.single();

          if (existingMaterial) {
            // Обновляем существующий
            const { error } = await supabase
              .from('materials')
              .update({
                stock_quantity: item.stock_quantity || 0,
                min_stock: item.min_stock || 0,
                supplier: item.supplier || null,
                category: item.category || null,
                unit: item.unit || 'шт',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingMaterial.id);

            if (error) {
              result.errors++;
              result.details.push(`Ошибка обновления ${item.name}: ${error.message}`);
            } else {
              result.success++;
              result.details.push(`Обновлен: ${item.name}`);
            }
          } else {
            // Создаем новый
            const { error } = await supabase
              .from('materials')
              .insert({
                name: item.name,
                sku: item.sku || null,
                category: item.category || null,
                unit: item.unit || 'шт',
                price_per_unit: item.price_per_unit || 0,
                stock_quantity: item.stock_quantity || 0,
                min_stock: item.min_stock || 0,
                supplier: item.supplier || null,
                notes: `Импортирован через веб-хук от ${payload.source}`,
              });

            if (error) {
              result.errors++;
              result.details.push(`Ошибка создания ${item.name}: ${error.message}`);
            } else {
              result.success++;
              result.details.push(`Создан: ${item.name}`);
            }
          }
        } catch (error) {
          result.errors++;
          result.details.push(`Ошибка обработки ${item.name}: ${(error as Error).message}`);
        }
      }
    } else if (payload.type === 'bom') {
      // Обрабатываем данные BOM
      const productGroups: Record<string, { product_name: string; product_sku?: string; materials: any[] }> = {};
      
      // Группируем по изделиям
      for (const item of payload.data) {
        const key = `${item.product_name}_${item.product_sku || ''}`;
        if (!productGroups[key]) {
          productGroups[key] = {
            product_name: item.product_name,
            product_sku: item.product_sku,
            materials: []
          };
        }
        productGroups[key].materials.push(item);
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
          for (const material of group.materials) {
            try {
              // Находим материал
              let materialQuery = supabase.from('materials').select('id');
              if (material.material_sku) {
                materialQuery = materialQuery.eq('sku', material.material_sku);
              } else {
                materialQuery = materialQuery.eq('name', material.material_name);
              }

              const { data: materialData } = await materialQuery.single();
              if (!materialData) {
                result.errors++;
                result.details.push(`Материал не найден: ${material.material_name}`);
                continue;
              }

              // Добавляем связь
              const { error } = await supabase
                .from('product_materials')
                .insert({
                  product_id: product.id,
                  material_id: materialData.id,
                  quantity: material.quantity,
                });

              if (error) {
                result.errors++;
                result.details.push(`Ошибка добавления ${material.material_name}: ${error.message}`);
              } else {
                result.success++;
                result.details.push(`Добавлен: ${material.material_name} к ${group.product_name}`);
              }
            } catch (error) {
              result.errors++;
              result.details.push(`Ошибка обработки материала ${material.material_name}: ${(error as Error).message}`);
            }
          }
        } catch (error) {
          result.errors++;
          result.details.push(`Ошибка обработки изделия ${group.product_name}: ${(error as Error).message}`);
        }
      }
    }

    return result;
  } catch (error) {
    result.errors++;
    result.details.push(`Общая ошибка: ${(error as Error).message}`);
    return result;
  }
}

// API endpoint для веб-хуков
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Проверяем подпись веб-хука (если настроена)
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // Здесь можно добавить проверку подписи HMAC
      // const expectedSignature = crypto
      //   .createHmac('sha256', webhookSecret)
      //   .update(JSON.stringify(body))
      //   .digest('hex');
      // 
      // if (signature !== `sha256=${expectedSignature}`) {
      //   return NextResponse.json({ error: 'Неверная подпись' }, { status: 401 });
      // }
    }

    // Валидация payload
    if (!body.type || !body.data || !Array.isArray(body.data)) {
      return NextResponse.json({ 
        error: 'Неверный формат данных. Ожидается: {type, data[]}' 
      }, { status: 400 });
    }

    if (!['materials', 'bom'].includes(body.type)) {
      return NextResponse.json({ 
        error: 'Неверный тип. Поддерживаются: materials, bom' 
      }, { status: 400 });
    }

    // Обрабатываем данные
    const result = await processWebhookData({
      type: body.type,
      data: body.data,
      source: body.source || 'unknown',
      timestamp: body.timestamp || new Date().toISOString(),
      webhookId: body.webhookId
    });

    // Логируем результат
    console.log(`📊 Веб-хук ${body.type}: ${result.success} успешно, ${result.errors} ошибок`);

    // Сохраняем лог веб-хука
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: body.webhookId,
        type: body.type,
        source: body.source || 'unknown',
        success_count: result.success,
        error_count: result.errors,
        details: result.details,
        payload: body,
        processed_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ошибка обработки веб-хука:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

// GET endpoint для проверки статуса
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoints: {
      materials: 'POST /api/webhook/csv - импорт материалов',
      bom: 'POST /api/webhook/csv - импорт BOM'
    },
    format: {
      type: 'materials | bom',
      data: 'array of objects',
      source: 'string (optional)',
      timestamp: 'ISO string (optional)',
      webhookId: 'string (optional)'
    },
    examples: {
      materials: {
        type: 'materials',
        data: [
          {
            name: 'EGGER H1137 ST9 Дуб Галифакс белый',
            sku: 'H1137',
            category: 'ЛДСП EGGER',
            stock_quantity: 25.5,
            min_stock: 10,
            supplier: 'EGGER',
            unit: 'м²'
          }
        ],
        source: 'warehouse_system',
        timestamp: new Date().toISOString()
      },
      bom: {
        type: 'bom',
        data: [
          {
            product_name: 'Стол письменный Лофт',
            product_sku: 'STL-004',
            material_name: 'EGGER H1137 ST9 Дуб Галифакс белый',
            material_sku: 'H1137',
            quantity: 2.5,
            unit: 'м²'
          }
        ],
        source: 'cad_system',
        timestamp: new Date().toISOString()
      }
    }
  });
}
