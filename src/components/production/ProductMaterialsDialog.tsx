import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Material {
  id: string;
  name: string;
  category?: string;
  unit: string;
  price_per_unit?: number;
  stock_quantity?: number;
}

interface ProductMaterial {
  id: string;
  material_id: string;
  quantity: number;
  notes?: string;
  material?: Material;
}

interface ProductMaterialsDialogProps {
  productId: string | null;
  productName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductMaterialsDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: ProductMaterialsDialogProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [productMaterials, setProductMaterials] = useState<ProductMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Загрузка справочника материалов
  useEffect(() => {
    if (open) {
      loadMaterials();
      if (productId) {
        loadProductMaterials();
      }
    }
  }, [open, productId]);

  const loadMaterials = async () => {
    const { data, error } = await (supabase as any)
      .from('materials')
      .select('*')
      .order('name', { ascending: true });
    
    if (!error && data) {
      setMaterials(data);
    }
  };

  const loadProductMaterials = async () => {
    if (!productId) return;
    
    const { data, error } = await (supabase as any)
      .from('product_materials')
      .select(`
        id,
        material_id,
        quantity,
        notes,
        material:materials(id, name, category, unit, price_per_unit, stock_quantity)
      `)
      .eq('product_id', productId);
    
    if (!error && data) {
      setProductMaterials(data);
    }
  };

  const handleAddMaterial = async () => {
    if (!productId || !selectedMaterialId || !quantity) return;
    
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Введите корректное количество');
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('product_materials')
        .insert({
          product_id: productId,
          material_id: selectedMaterialId,
          quantity: qty,
        });
      
      if (error) {
        if (error.code === '23505') {
          alert('Этот материал уже добавлен к изделию');
        } else {
          throw error;
        }
      } else {
        await loadProductMaterials();
        setSelectedMaterialId('');
        setQuantity('');
      }
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Ошибка при добавлении материала');
    }
    setLoading(false);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Удалить материал из списка?')) return;
    
    setLoading(true);
    const { error } = await (supabase as any)
      .from('product_materials')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await loadProductMaterials();
    }
    setLoading(false);
  };

  const getTotalCost = () => {
    return productMaterials.reduce((sum, pm) => {
      const price = pm.material?.price_per_unit || 0;
      return sum + (price * pm.quantity);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Материалы: {productName || 'Изделие'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Форма добавления материала */}
          <div className="p-4 rounded-lg border border-border bg-muted/20">
            <h3 className="font-medium mb-3">Добавить материал</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Материал</Label>
                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите материал" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Количество</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <div className="flex items-center px-3 rounded-md bg-muted text-sm whitespace-nowrap">
                    {materials.find(m => m.id === selectedMaterialId)?.unit || '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddMaterial}
                  disabled={!selectedMaterialId || !quantity || loading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
            </div>
          </div>

          {/* Список материалов */}
          <div>
            <h3 className="font-medium mb-2">Список материалов (BOM)</h3>
            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {productMaterials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Материалы не добавлены</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {productMaterials.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{pm.material?.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Категория: {pm.material?.category || '—'}</span>
                          <span>•</span>
                          <span>Требуется: {pm.quantity} {pm.material?.unit}</span>
                          {pm.material?.stock_quantity !== undefined && (
                            <>
                              <span>•</span>
                              <span className={pm.material.stock_quantity >= pm.quantity ? 'text-success' : 'text-destructive'}>
                                На складе: {pm.material.stock_quantity} {pm.material.unit}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {pm.material?.price_per_unit && (
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {(pm.material.price_per_unit * pm.quantity).toFixed(2)} ₽
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pm.material.price_per_unit} ₽/{pm.material.unit}
                            </p>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMaterial(pm.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Итого */}
          {productMaterials.length > 0 && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-medium">Итоговая стоимость материалов:</span>
                <span className="text-2xl font-bold text-primary">{getTotalCost().toFixed(2)} ₽</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

