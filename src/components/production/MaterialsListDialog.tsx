import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, AlertTriangle, Building2, Edit, Trash2 } from 'lucide-react';
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

interface Material {
  id: string;
  name: string;
  category?: string;
  unit: string;
  price_per_unit?: number;
  stock_quantity?: number;
  min_stock?: number;
  supplier?: string;
  notes?: string;
  created_at: string;
}

interface MaterialsListDialogProps {
  type: 'all' | 'lowStock' | 'suppliers';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
}

export function MaterialsListDialog({
  type,
  open,
  onOpenChange,
  materials,
}: MaterialsListDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Фильтрация материалов по типу
  const getFilteredMaterials = () => {
    let filtered = materials;

    switch (type) {
      case 'lowStock':
        filtered = materials.filter(material => 
          (material.stock_quantity || 0) <= (material.min_stock || 0)
        );
        break;
      case 'suppliers':
        // Группируем по поставщикам
        const supplierGroups = materials.reduce((acc, material) => {
          const supplier = material.supplier || 'Без поставщика';
          if (!acc[supplier]) {
            acc[supplier] = [];
          }
          acc[supplier].push(material);
          return acc;
        }, {} as Record<string, Material[]>);
        
        // Возвращаем плоский список с информацией о поставщике
        return Object.entries(supplierGroups).flatMap(([supplier, mats]) =>
          mats.map(material => ({ ...material, supplier_group: supplier }))
        );
      default:
        break;
    }

    // Применяем поиск
    if (searchQuery.trim()) {
      filtered = filtered.filter(material =>
        material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredMaterials = getFilteredMaterials();

  const handleDeleteMaterial = async (materialId: string) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('materials')
        .delete()
        .eq('id', materialId);

      if (error) {
        console.error('Error deleting material:', error);
        alert('Ошибка при удалении материала: ' + error.message);
        return;
      }

      alert('Материал успешно удален!');
      setDeleteDialogOpen(false);
      setSelectedMaterial(null);
      // Перезагружаем страницу для обновления данных
      window.location.reload();
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Ошибка при удалении материала: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'all':
        return 'Все материалы';
      case 'lowStock':
        return 'Материалы, требующие закупки';
      case 'suppliers':
        return 'Материалы по поставщикам';
      default:
        return 'Материалы';
    }
  };

  const getDialogIcon = () => {
    switch (type) {
      case 'all':
        return <Package className="h-5 w-5" />;
      case 'lowStock':
        return <AlertTriangle className="h-5 w-5" />;
      case 'suppliers':
        return <Building2 className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStockStatus = (material: Material) => {
    const stock = material.stock_quantity || 0;
    const minStock = material.min_stock || 0;
    
    if (stock <= minStock) {
      return { variant: 'destructive' as const, text: 'Низкий остаток' };
    } else if (stock <= minStock * 1.5) {
      return { variant: 'secondary' as const, text: 'Средний остаток' };
    } else {
      return { variant: 'default' as const, text: 'В наличии' };
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getDialogIcon()}
              {getDialogTitle()}
              <Badge variant="outline">{filteredMaterials.length}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, категории или поставщику..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Список материалов */}
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredMaterials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Материалы не найдены</p>
                  </div>
                ) : (
                  filteredMaterials.map((material) => {
                    const stockStatus = getStockStatus(material);
                    return (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedMaterial(material)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{material.name}</h3>
                            {material.category && (
                              <Badge variant="secondary" className="text-xs">
                                {material.category}
                              </Badge>
                            )}
                            <Badge variant={stockStatus.variant} className="text-xs">
                              {stockStatus.text}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Остаток: {material.stock_quantity || 0} {material.unit}</span>
                            <span>Мин. остаток: {material.min_stock || 0} {material.unit}</span>
                            {material.price_per_unit && (
                              <span>Цена: {material.price_per_unit.toFixed(2)} ₽</span>
                            )}
                            {material.supplier && (
                              <span>Поставщик: {material.supplier}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMaterial(material);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Удалить материал?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить материал "{selectedMaterial?.name}"?
              <br />
              <strong>Это действие нельзя отменить.</strong>
              <br />
              Все связанные данные (использование в изделиях) также будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMaterial && handleDeleteMaterial(selectedMaterial.id)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
