import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateProductProgress, ProductProgressData } from '@/utils/progressCalculator';

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'quality_check' | 'completed' | 'on_hold';
  progress: number;
  assignee_id?: string;
  deadline?: string;
  unit_price?: number;
  quantity_in_stock?: number;
  created_at: string;
  updated_at: string;
}

interface QualityInspection {
  id: string;
  product_id: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed';
  score?: number;
}

interface ProductMaterial {
  id: string;
  product_id: string;
  material_id: string;
  quantity: number;
  material?: {
    stock_quantity?: number;
  };
}

export function useProductProgress() {
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Получение данных для расчета прогресса конкретного изделия
   */
  const getProductProgressData = async (productId: string): Promise<ProductProgressData> => {
    try {
      // Получаем проверки качества для изделия
      const { data: inspections } = await (supabase as any)
        .from('quality_inspections')
        .select('status')
        .eq('product_id', productId);

      const qualityInspections = inspections ? {
        total: inspections.length,
        passed: inspections.filter((i: QualityInspection) => i.status === 'passed').length,
        failed: inspections.filter((i: QualityInspection) => i.status === 'failed').length,
        inProgress: inspections.filter((i: QualityInspection) => i.status === 'in_progress').length,
      } : { total: 0, passed: 0, failed: 0, inProgress: 0 };

      // Получаем материалы для изделия
      const { data: productMaterials } = await (supabase as any)
        .from('product_materials')
        .select(`
          quantity,
          material:material_id (
            stock_quantity
          )
        `)
        .eq('product_id', productId);

      let materials = undefined;
      if (productMaterials && productMaterials.length > 0) {
        const totalRequired = productMaterials.reduce((sum: number, pm: any) => sum + pm.quantity, 0);
        const available = productMaterials.reduce((sum: number, pm: any) => {
          const stock = pm.material?.stock_quantity || 0;
          return sum + Math.min(pm.quantity, stock);
        }, 0);
        const missing = totalRequired - available;

        materials = {
          totalRequired,
          available,
          missing,
        };
      }

      // Получаем информацию о сроке выполнения
      const { data: product } = await (supabase as any)
        .from('products')
        .select('status, deadline')
        .eq('id', productId)
        .single();

      const hasDeadline = !!product?.deadline;
      const isOverdue = hasDeadline && new Date(product.deadline) < new Date();

      return {
        status: product?.status || 'planning',
        qualityInspections,
        materials,
        hasDeadline,
        isOverdue,
      };
    } catch (error) {
      console.error('Error getting product progress data:', error);
      return {
        status: 'planning',
        qualityInspections: { total: 0, passed: 0, failed: 0, inProgress: 0 },
        materials: undefined,
        hasDeadline: false,
        isOverdue: false,
      };
    }
  };

  /**
   * Обновление прогресса конкретного изделия
   */
  const updateProductProgress = async (productId: string): Promise<number | null> => {
    try {
      const progressData = await getProductProgressData(productId);
      const newProgress = calculateProductProgress(progressData);

      // Обновляем прогресс в базе данных
      const { error } = await (supabase as any)
        .from('products')
        .update({ progress: newProgress })
        .eq('id', productId);

      if (error) {
        console.error('Error updating product progress:', error);
        return null;
      }

      return newProgress;
    } catch (error) {
      console.error('Error updating product progress:', error);
      return null;
    }
  };

  /**
   * Обновление прогресса всех изделий
   */
  const updateAllProductsProgress = async (): Promise<void> => {
    setIsUpdating(true);
    try {
      // Получаем все изделия
      const { data: products, error } = await (supabase as any)
        .from('products')
        .select('id');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      if (!products || products.length === 0) {
        return;
      }

      // Обновляем прогресс для каждого изделия
      const updatePromises = products.map((product: Product) => 
        updateProductProgress(product.id)
      );

      const results = await Promise.allSettled(updatePromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Progress updated: ${successful} successful, ${failed} failed`);
    } catch (error) {
      console.error('Error updating all products progress:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Автоматическое обновление прогресса при изменении связанных данных
   */
  const setupProgressAutoUpdate = useCallback(() => {
    // Подписка на изменения проверок качества
    const qualityChannel = supabase
      .channel('quality_inspections_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quality_inspections' },
        async (payload) => {
          console.log('Quality inspection changed, updating progress...');
          if (payload.new && 'product_id' in payload.new) {
            await updateProductProgress(payload.new.product_id as string);
          }
        }
      )
      .subscribe();

    // Подписка на изменения материалов изделий
    const materialsChannel = supabase
      .channel('product_materials_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'product_materials' },
        async (payload) => {
          console.log('Product materials changed, updating progress...');
          if (payload.new && 'product_id' in payload.new) {
            await updateProductProgress(payload.new.product_id as string);
          }
        }
      )
      .subscribe();

    // Подписка на изменения остатков материалов
    const stockChannel = supabase
      .channel('materials_stock_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'materials' },
        async () => {
          console.log('Material stock changed, updating all products progress...');
          await updateAllProductsProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(qualityChannel);
      supabase.removeChannel(materialsChannel);
      supabase.removeChannel(stockChannel);
    };
  }, []);

  /**
   * Инициализация автоматического обновления прогресса
   */
  useEffect(() => {
    const cleanup = setupProgressAutoUpdate();
    return cleanup;
  }, [setupProgressAutoUpdate]);

  return {
    updateProductProgress,
    updateAllProductsProgress,
    getProductProgressData,
    isUpdating,
  };
}
