import { useState, useEffect } from 'react';
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
import { Search, Building2, Package, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddMaterialDialog } from './AddMaterialDialog';

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

interface SuppliersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
}

export function SuppliersDialog({
  open,
  onOpenChange,
  materials,
}: SuppliersDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [supplierMaterials, setSupplierMaterials] = useState<Material[]>([]);
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<string[]>([]);

  // Получаем список всех поставщиков
  useEffect(() => {
    if (materials.length > 0) {
      const uniqueSuppliers = Array.from(
        new Set(
          materials
            .map(m => m.supplier)
            .filter(Boolean)
            .sort()
        )
      );
      setSuppliers(uniqueSuppliers);
    }
  }, [materials]);

  // Фильтрация поставщиков по поиску
  const getFilteredSuppliers = () => {
    if (!searchQuery.trim()) return suppliers;
    
    return suppliers.filter(supplier =>
      supplier.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Получение материалов конкретного поставщика
  const getSupplierMaterials = (supplier: string) => {
    return materials.filter(material => material.supplier === supplier);
  };

  // Обработка клика на поставщика
  const handleSupplierClick = (supplier: string) => {
    setSelectedSupplier(supplier);
    setSupplierMaterials(getSupplierMaterials(supplier));
  };

  // Возврат к списку поставщиков
  const handleBackToSuppliers = () => {
    setSelectedSupplier(null);
    setSupplierMaterials([]);
  };

  // Получение статистики поставщика
  const getSupplierStats = (supplier: string) => {
    const supplierMats = getSupplierMaterials(supplier);
    const totalMaterials = supplierMats.length;
    const lowStockMaterials = supplierMats.filter(m => 
      (m.stock_quantity || 0) <= (m.min_stock || 0)
    ).length;
    const totalValue = supplierMats.reduce((sum, m) => 
      sum + ((m.stock_quantity || 0) * (m.price_per_unit || 0)), 0
    );

    return { totalMaterials, lowStockMaterials, totalValue };
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

  const loadMaterials = async () => {
    // Перезагружаем страницу для обновления данных
    window.location.reload();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedSupplier ? `Материалы поставщика: ${selectedSupplier}` : 'Поставщики'}
              <Badge variant="outline">
                {selectedSupplier ? supplierMaterials.length : suppliers.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={selectedSupplier ? "Поиск материалов поставщика..." : "Поиск поставщиков..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Кнопка "Назад" для материалов поставщика */}
            {selectedSupplier && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToSuppliers}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к поставщикам
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddMaterialDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить материал
                </Button>
              </div>
            )}

            {/* Список поставщиков или материалов */}
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {selectedSupplier ? (
                  // Список материалов поставщика
                  supplierMaterials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Материалы поставщика не найдены</p>
                    </div>
                  ) : (
                    supplierMaterials.map((material) => {
                      const stockStatus = getStockStatus(material);
                      return (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
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
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  // Список поставщиков
                  getFilteredSuppliers().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Поставщики не найдены</p>
                    </div>
                  ) : (
                    getFilteredSuppliers().map((supplier) => {
                      const stats = getSupplierStats(supplier);
                      return (
                        <div
                          key={supplier}
                          className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSupplierClick(supplier)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{supplier}</h3>
                              <Badge variant="outline" className="text-xs">
                                {stats.totalMaterials} материалов
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Требуют закупки: {stats.lowStockMaterials}</span>
                              <span>Стоимость на складе: {stats.totalValue.toLocaleString('ru-RU')} ₽</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Нажмите для просмотра</p>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог добавления материала */}
      <AddMaterialDialog
        open={addMaterialDialogOpen}
        onOpenChange={setAddMaterialDialogOpen}
        onMaterialAdded={loadMaterials}
        defaultSupplier={selectedSupplier || undefined}
        suppliersList={suppliers}
      />
    </>
  );
}
