import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';
import * as crypto from 'crypto';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { type, data, signature } = body;
    
    // Проверка подписи (опционально)
    if (process.env.WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');
        
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json({ 
        error: 'Missing or invalid data. Required: type, data (array)' 
      }, { status: 400 });
    }
    
    if (!['materials', 'bom'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Must be materials or bom' 
      }, { status: 400 });
    }
    
    let result = { success: 0, errors: 0, details: [] as string[] };
    
    if (type === 'materials') {
      // Импорт материалов
      for (const item of data) {
        try {
          if (!item.name) {
            result.errors++;
            result.details.push('Материал без названия пропущен');
            continue;
          }
          
          const { error } = await supabase
            .from('materials')
            .upsert({
              name: item.name,
              sku: item.sku || '',
              category: item.category || '',
              stock_quantity: parseFloat(item.stock_quantity || '0'),
              min_stock: parseFloat(item.min_stock || '0'),
              supplier: item.supplier || '',
              unit: item.unit || 'шт',
              price: parseFloat(item.price || '0'),
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
    
    const processingTime = Date.now() - startTime;
    
    // Логируем результат
    await supabase
      .from('webhook_logs')
      .insert({
        endpoint: '/api/webhook/csv',
        method: 'POST',
        status: result.errors === 0 ? 'success' : 'partial',
        request_data: { type, records_count: data.length },
        response_data: result,
        processing_time_ms: processingTime
      });
    
    return NextResponse.json({
      message: `Webhook обработан. Успешно: ${result.success}, Ошибок: ${result.errors}`,
      ...result
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('Webhook Error:', error);
    
    // Логируем ошибку
    await supabase
      .from('webhook_logs')
      .insert({
        endpoint: '/api/webhook/csv',
        method: 'POST',
        status: 'error',
        error_message: (error as Error).message,
        processing_time_ms: processingTime
      });
    
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
