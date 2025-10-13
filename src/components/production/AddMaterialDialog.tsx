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
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMaterialAdded?: () => void;
  defaultSupplier?: string;
  suppliersList?: string[];
}

// Популярные категории материалов
const MATERIAL_CATEGORIES = [
  'ЛДСП EGGER',
  'ЛДСП',
  'Кромка EGGER',
  'Кромка',
  'Фурнитура Blum',
  'Фурнитура Hettich',
  'Фурнитура GTV',
  'Фурнитура',
  'Ручки',
  'Крепеж',
  'Освещение',
  'Системы хранения',
  'Покрытие',
  'Клеи',
  'Ткань',
  'Наполнитель',
  'Упаковка',
  'Другое',
];

// Популярные единицы измерения
const UNITS = [
  { value: 'шт', label: 'шт (штуки)' },
  { value: 'м', label: 'м (метры)' },
  { value: 'м²', label: 'м² (квадратные метры)' },
  { value: 'м³', label: 'м³ (кубические метры)' },
  { value: 'кг', label: 'кг (килограммы)' },
  { value: 'л', label: 'л (литры)' },
  { value: 'пара', label: 'пара' },
  { value: 'компл', label: 'компл (комплект)' },
  { value: 'рулон', label: 'рулон' },
  { value: 'лист', label: 'лист' },
  { value: 'уп', label: 'уп (упаковка)' },
];

export function AddMaterialDialog({
  open,
  onOpenChange,
  onMaterialAdded,
  defaultSupplier,
  suppliersList = [],
}: AddMaterialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    article: '',
    category: '',
    unit: 'шт',
    price_per_unit: '',
    stock_quantity: '',
    min_stock: '',
    supplier: defaultSupplier || '',
    notes: '',
  });

  // Обновляем поставщика при изменении defaultSupplier
  useEffect(() => {
    if (defaultSupplier) {
      setFormData(prev => ({ ...prev, supplier: defaultSupplier }));
    }
  }, [defaultSupplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.unit) {
      alert('Заполните обязательные поля: Название и Единица измерения');
      return;
    }

    setLoading(true);
    try {
      const materialData: any = {
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        unit: formData.unit,
        supplier: formData.supplier.trim() || null,
        notes: formData.notes.trim() || null,
      };

      // Добавляем артикул в название если указан
      if (formData.article.trim()) {
        materialData.name = `${formData.name.trim()} [${formData.article.trim()}]`;
      }

      // Добавляем числовые поля если указаны
      if (formData.price_per_unit) {
        const price = parseFloat(formData.price_per_unit);
        if (!isNaN(price) && price >= 0) {
          materialData.price_per_unit = price;
        }
      }

      if (formData.stock_quantity) {
        const stock = parseFloat(formData.stock_quantity);
        if (!isNaN(stock) && stock >= 0) {
          materialData.stock_quantity = stock;
        }
      }

      if (formData.min_stock) {
        const minStock = parseFloat(formData.min_stock);
        if (!isNaN(minStock) && minStock >= 0) {
          materialData.min_stock = minStock;
        }
      }

      const { error } = await (supabase as any)
        .from('materials')
        .insert(materialData);

      if (error) throw error;

      // Сброс формы
      setFormData({
        name: '',
        article: '',
        category: '',
        unit: 'шт',
        price_per_unit: '',
        stock_quantity: '',
        min_stock: '',
        supplier: '',
        notes: '',
      });

      alert('Материал успешно добавлен в справочник!');
      onOpenChange(false);
      if (onMaterialAdded) onMaterialAdded();
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Ошибка при добавлении материала: ' + (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добавить материал в справочник
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Название (обязательно) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Название материала <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Например: ЛДСП 16мм дуб натуральный"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Артикул */}
          <div className="space-y-2">
            <Label htmlFor="article">Артикул / Код</Label>
            <Input
              id="article"
              placeholder="Например: H1137 ST9"
              value={formData.article}
              onChange={(e) => setFormData({ ...formData, article: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Будет добавлен к названию в квадратных скобках
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Категория */}
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Единица измерения (обязательно) */}
            <div className="space-y-2">
              <Label htmlFor="unit">
                Единица измерения <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Цена за единицу */}
            <div className="space-y-2">
              <Label htmlFor="price">Цена за единицу (₽)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
              />
            </div>

            {/* Количество на складе */}
            <div className="space-y-2">
              <Label htmlFor="stock">Количество на складе</Label>
              <Input
                id="stock"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />
            </div>

            {/* Минимальный остаток */}
            <div className="space-y-2">
              <Label htmlFor="minStock">Минимальный остаток</Label>
              <Input
                id="minStock"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Для уведомлений о закупке
              </p>
            </div>
          </div>

          {/* Поставщик */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Поставщик / Производитель</Label>
            <Select
              value={formData.supplier}
              onValueChange={(value) => setFormData({ ...formData, supplier: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите поставщика или введите нового" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Новый поставщик</SelectItem>
                {suppliersList.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.supplier === '' && (
              <Input
                placeholder="Введите название нового поставщика..."
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            )}
          </div>

          {/* Заметки */}
          <div className="space-y-2">
            <Label htmlFor="notes">Заметки / Описание</Label>
            <Textarea
              id="notes"
              placeholder="Дополнительная информация: размеры, цвет, особенности..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить материал
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

