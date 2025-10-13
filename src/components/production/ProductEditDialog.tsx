import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Save, Edit, BarChart3 } from 'lucide-react';
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
import { ProductProgressAnalysis } from './ProductProgressAnalysis';

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

interface ProductEditDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated?: () => void;
  onProductDeleted?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Планирование', color: 'secondary' },
  { value: 'in_progress', label: 'В работе', color: 'default' },
  { value: 'quality_check', label: 'Контроль качества', color: 'outline' },
  { value: 'completed', label: 'Завершено', color: 'default' },
  { value: 'on_hold', label: 'На паузе', color: 'destructive' },
];

export function ProductEditDialog({
  product,
  open,
  onOpenChange,
  onProductUpdated,
  onProductDeleted,
}: ProductEditDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    status: 'planning' as Product['status'],
    progress: 0,
    deadline: '',
    unit_price: '',
    quantity_in_stock: '',
  });
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [progressAnalysisOpen, setProgressAnalysisOpen] = useState(false);

  // Заполняем форму данными изделия
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        status: product.status,
        progress: product.progress || 0,
        deadline: product.deadline ? new Date(product.deadline).toISOString().split('T')[0] : '',
        unit_price: product.unit_price?.toString() || '',
        quantity_in_stock: product.quantity_in_stock?.toString() || '',
      });
    }
  }, [product]);

  const handleSave = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        description: formData.description.trim() || null,
        status: formData.status,
        progress: Math.max(0, Math.min(100, formData.progress)),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        quantity_in_stock: formData.quantity_in_stock ? parseFloat(formData.quantity_in_stock) : null,
      };

      const { error } = await (supabase as any)
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (error) {
        console.error('Error updating product:', error);
        alert('Ошибка при обновлении изделия: ' + error.message);
        return;
      }

      alert('Изделие успешно обновлено!');
      onOpenChange(false);
      if (onProductUpdated) onProductUpdated();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Ошибка при обновлении изделия: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Ошибка при удалении изделия: ' + error.message);
        return;
      }

      alert('Изделие успешно удалено!');
      setDeleteDialogOpen(false);
      onOpenChange(false);
      if (onProductDeleted) onProductDeleted();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Ошибка при удалении изделия: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  if (!product) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Редактирование изделия
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Основная информация */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Основная информация</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Название изделия"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">Артикул / SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Артикул изделия"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание изделия"
                  rows={3}
                />
              </div>
            </div>

            {/* Статус и прогресс */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Статус производства</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Product['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Badge variant={option.color as any} className="text-xs">
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progress">Прогресс (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Прогресс выполнения</span>
                  <span className="font-medium">{formData.progress}%</span>
                </div>
                <Progress value={formData.progress} className="h-2" />
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Дополнительная информация</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Срок выполнения</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">Цена за единицу (₽)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_in_stock">Количество на складе</Label>
                <Input
                  id="quantity_in_stock"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.quantity_in_stock}
                  onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Информация о создании */}
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium">Информация о создании</h4>
              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <div>Создано: {new Date(product.created_at).toLocaleDateString('ru-RU')}</div>
                <div>Обновлено: {new Date(product.updated_at).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
            <Button
              variant="outline"
              onClick={() => setProgressAnalysisOpen(true)}
              disabled={loading}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Анализ прогресса
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !formData.name.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Удалить изделие?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить изделие "{product.name}"?
              <br />
              <strong>Это действие нельзя отменить.</strong>
              <br />
              Все связанные данные (материалы, проверки качества) также будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог анализа прогресса */}
      <Dialog open={progressAnalysisOpen} onOpenChange={setProgressAnalysisOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Анализ прогресса изделия</DialogTitle>
          </DialogHeader>
          <ProductProgressAnalysis
            productId={product?.id || ''}
            productName={product?.name || ''}
            open={progressAnalysisOpen}
            onOpenChange={setProgressAnalysisOpen}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
