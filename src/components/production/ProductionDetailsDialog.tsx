import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface Product {
  id: string;
  name: string;
  status: string;
  progress: number;
  assignee?: { full_name: string };
  created_at: string;
  quantity_in_stock?: number;
}

interface ProductMaterial {
  product_id: string;
  material_id: string;
  quantity: number;
  material: {
    id: string;
    name: string;
    stock_quantity?: number;
    min_stock?: number;
  };
}

interface Material {
  id: string;
  name: string;
  stock_quantity?: number;
  min_stock?: number;
  unit: string;
}

interface ProductionDetailsDialogProps {
  type: 'inProgress' | 'completed' | 'needsMaterials' | 'warehouse';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products?: Product[];
  productMaterials?: ProductMaterial[];
  materials?: Material[];
}

const titles = {
  inProgress: 'Изделия в работе',
  completed: 'Завершенные изделия',
  needsMaterials: 'Изделия, ожидающие материалов',
  warehouse: 'Остатки на складе',
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'planning': return 'Планирование';
    case 'in_progress': return 'В работе';
    case 'quality_check': return 'Контроль качества';
    case 'completed': return 'Завершено';
    case 'on_hold': return 'На паузе';
    default: return status;
  }
};

export function ProductionDetailsDialog({ 
  type, 
  open, 
  onOpenChange, 
  products = [], 
  productMaterials = [], 
  materials = [] 
}: ProductionDetailsDialogProps) {
  const title = titles[type];

  // Фильтрация данных в зависимости от типа
  const getFilteredData = () => {
    switch (type) {
      case 'inProgress':
        return products.filter(p => p.status === 'in_progress' || p.status === 'quality_check');
      
      case 'completed':
        return products.filter(p => p.status === 'completed');
      
      case 'needsMaterials':
        return products.filter(product => {
          const productMaterialsForProduct = productMaterials.filter(pm => pm.product_id === product.id);
          
          if (productMaterialsForProduct.length === 0) return true;
          
          return productMaterialsForProduct.some(pm => {
            const material = pm.material;
            if (!material) return true;
            
            const required = pm.quantity;
            const available = material.stock_quantity || 0;
            
            return available < required;
          });
        });
      
      case 'warehouse':
        return materials.filter(m => (m.stock_quantity || 0) > 0);
      
      default:
        return [];
    }
  };

  const data = getFilteredData();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3">
            {data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Нет данных для отображения</p>
              </div>
            ) : (
              <>
                {type === 'inProgress' && data.map((product: Product) => (
                  <div key={product.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.assignee?.full_name || 'Не назначен'}
                        </p>
                      </div>
                      <Badge variant="outline">{product.progress}%</Badge>
                    </div>
                    <div className="space-y-1">
                      <Progress value={product.progress} className="h-2" />
                      <p className="text-sm text-muted-foreground">{getStatusLabel(product.status)}</p>
                    </div>
                  </div>
                ))}

                {type === 'completed' && data.map((product: Product) => (
                  <div key={product.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.assignee?.full_name || 'Не назначен'}
                      </p>
                      {product.quantity_in_stock && product.quantity_in_stock > 0 && (
                        <p className="text-sm text-green-600">
                          На складе: {product.quantity_in_stock} шт
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                ))}

                {type === 'needsMaterials' && data.map((product: Product) => {
                  const productMaterialsForProduct = productMaterials.filter(pm => pm.product_id === product.id);
                  const missingMaterials = productMaterialsForProduct.filter(pm => {
                    const material = pm.material;
                    if (!material) return true;
                    const required = pm.quantity;
                    const available = material.stock_quantity || 0;
                    return available < required;
                  });

                  return (
                    <div key={product.id} className="p-4 border rounded-lg space-y-2">
                      <p className="font-medium">{product.name}</p>
                      <div className="space-y-1">
                        {missingMaterials.map((pm, i) => (
                          <div key={i} className="text-sm text-muted-foreground">
                            Требуется: {pm.material?.name} - {pm.quantity} шт
                            {pm.material?.stock_quantity !== undefined && (
                              <span className="text-red-600 ml-2">
                                (на складе: {pm.material.stock_quantity})
                              </span>
                            )}
                          </div>
                        ))}
                        {missingMaterials.length === 0 && productMaterialsForProduct.length === 0 && (
                          <p className="text-sm text-muted-foreground">Материалы не указаны</p>
                        )}
                      </div>
                      <Badge variant="destructive">Ожидает закупки</Badge>
                    </div>
                  );
                })}

                {type === 'warehouse' && data.map((material: Material) => {
                  const stock = material.stock_quantity || 0;
                  const minStock = material.min_stock || 0;
                  const isLowStock = stock <= minStock;

                  return (
                    <div key={material.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Количество: {stock} {material.unit}
                        </p>
                        {minStock > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Минимум: {minStock} {material.unit}
                          </p>
                        )}
                      </div>
                      <Badge variant={isLowStock ? 'destructive' : 'default'}>
                        {isLowStock ? 'Низкий остаток' : 'В наличии'}
                      </Badge>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
