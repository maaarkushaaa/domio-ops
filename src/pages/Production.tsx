import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, CheckCircle2, Clock, AlertTriangle, Package, ClipboardCheck, ListChecks, Edit, RefreshCw } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { useQualityControl } from "@/hooks/use-quality-control";
import { useProductProgress } from "@/hooks/use-product-progress";
import { ProductDialog } from "@/components/production/ProductDialog";
import { ProductionDetailsDialog } from "@/components/production/ProductionDetailsDialog";
import { QualityInspectionDialog } from "@/components/production/QualityInspectionDialog";
import { ProductMaterialsDialog } from "@/components/production/ProductMaterialsDialog";
import { ProductEditDialog } from "@/components/production/ProductEditDialog";
import { useState, useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function Production() {
  const { products, isLoading } = useProducts();
  const { checklists, inspections, createInspection } = useQualityControl();
  const { updateAllProductsProgress, isUpdating } = useProductProgress();
  const [detailsType, setDetailsType] = useState<'inProgress' | 'completed' | 'needsMaterials' | 'warehouse' | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedProductForInspection, setSelectedProductForInspection] = useState<string | null>(null);
  const [selectedChecklistForNew, setSelectedChecklistForNew] = useState<string | null>(null);
  const [selectedProductForMaterials, setSelectedProductForMaterials] = useState<{ id: string; name: string } | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any>(null);
  
  // Состояние для материалов и их остатков
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [productMaterialsData, setProductMaterialsData] = useState<any[]>([]);

  // Загрузка данных о материалах
  useEffect(() => {
    const loadMaterialsData = async () => {
      try {
        // Загружаем справочник материалов
        const { data: materials } = await (supabase as any)
          .from('materials')
          .select('id, name, stock_quantity, min_stock');

        // Загружаем связи изделий с материалами
        const { data: productMaterials } = await (supabase as any)
          .from('product_materials')
          .select('product_id, material_id, quantity, material:materials(id, name, stock_quantity, min_stock)');

        setMaterialsData(materials || []);
        setProductMaterialsData(productMaterials || []);
      } catch (error) {
        console.error('Error loading materials data:', error);
      }
    };

    loadMaterialsData();
  }, []);

  // Вычисление статистики на основе реальных данных
  const stats = useMemo(() => {
    const inProgress = products.filter(p => p.status === 'in_progress').length;
    const qualityCheck = products.filter(p => p.status === 'quality_check').length;
    const completed = products.filter(p => p.status === 'completed').length;
    
    // Подсчёт изделий, которым не хватает материалов
    const needsMaterials = products.filter(product => {
      const productMaterials = productMaterialsData.filter(pm => pm.product_id === product.id);
      
      // Если у изделия нет материалов, считаем что материалы нужны
      if (productMaterials.length === 0) return true;
      
      // Проверяем, хватает ли материалов для каждого
      return productMaterials.some(pm => {
        const material = pm.material;
        if (!material) return true; // Если материал не найден, считаем что нужен
        
        const required = pm.quantity;
        const available = material.stock_quantity || 0;
        
        return available < required;
      });
    }).length;
    
    // Подсчёт готовых изделий на складе (статус completed с quantity_in_stock > 0)
    const warehouse = products.filter(p => 
      p.status === 'completed' && 
      (p.quantity_in_stock || 0) > 0
    ).length;
    
    return { inProgress: inProgress + qualityCheck, completed, needsMaterials, warehouse };
  }, [products, productMaterialsData]);

  const handleStartInspection = async () => {
    if (!selectedProductForInspection || !selectedChecklistForNew) return;
    
    try {
      console.log('Starting inspection for product:', selectedProductForInspection, 'with checklist:', selectedChecklistForNew);
      const inspection = await createInspection(selectedProductForInspection, selectedChecklistForNew);
      console.log('Inspection created:', inspection);
      
      if (inspection) {
        setSelectedInspectionId(inspection.id);
        setSelectedProductForInspection(null);
        setSelectedChecklistForNew(null);
      } else {
        console.error('Failed to create inspection - returned null');
        alert('Не удалось создать проверку. Проверьте, что таблицы контроля качества созданы в Supabase.');
      }
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('Ошибка при создании проверки: ' + (error as Error).message);
    }
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

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Производство</h1>
          <p className="text-muted-foreground">Управление производственными процессами</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={updateAllProductsProgress}
            disabled={isUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Обновление...' : 'Обновить прогресс'}
          </Button>
        <ProductDialog trigger={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Новое изделие
          </Button>
        } />
        </div>
      </div>

      {/* Статистика (реальные данные из БД) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover-lift"
          onClick={() => setDetailsType('inProgress')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">изделий</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover-lift"
          onClick={() => setDetailsType('completed')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Завершено</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">изделий</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover-lift"
          onClick={() => setDetailsType('needsMaterials')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Требуют материалов</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.needsMaterials}</div>
            <p className="text-xs text-muted-foreground">{stats.needsMaterials > 0 ? 'ожидают закупки' : 'все обеспечены'}</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover-lift"
          onClick={() => setDetailsType('warehouse')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">На складе</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warehouse}</div>
            <p className="text-xs text-muted-foreground">позиций</p>
          </CardContent>
        </Card>
      </div>

      <ProductionDetailsDialog
        type={detailsType || 'inProgress'}
        open={!!detailsType}
        onOpenChange={(open) => !open && setDetailsType(null)}
        products={products}
        productMaterials={productMaterialsData}
        materials={materialsData}
      />

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Изделия</TabsTrigger>
          <TabsTrigger value="bom">BOM / Материалы</TabsTrigger>
          <TabsTrigger value="quality">Контроль качества</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedProductForEdit(product)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle>{product.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getStatusLabel(product.status)}</Badge>
                      {product.assignee && (
                        <span className="text-sm text-muted-foreground">• {product.assignee.full_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductForMaterials({ id: product.id, name: product.name });
                      }}
                    >
                      <ListChecks className="h-4 w-4 mr-2" />
                      Материалы
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductForEdit(product);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Прогресс</span>
                    <span className="font-medium">{product.progress}%</span>
                  </div>
                  <Progress value={product.progress} />
                </div>
                {product.deadline && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Дедлайн</span>
                    <span className="font-medium">{new Date(product.deadline).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>BOM / Материалы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Спецификации материалов (BOM) будут отображаться здесь</p>
                <p className="text-xs mt-2">Для подключения требуется таблица материалов и складских остатков в БД</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          {/* Начать новую проверку */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Начать новую проверку
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Изделие</label>
                  <Select value={selectedProductForInspection || ""} onValueChange={setSelectedProductForInspection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите изделие" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Чек-лист</label>
                  <Select value={selectedChecklistForNew || ""} onValueChange={setSelectedChecklistForNew}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите чек-лист" />
                    </SelectTrigger>
                    <SelectContent>
                      {checklists.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleStartInspection}
                    disabled={!selectedProductForInspection || !selectedChecklistForNew}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Начать проверку
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* История проверок */}
          <Card>
            <CardHeader>
              <CardTitle>История проверок</CardTitle>
            </CardHeader>
            <CardContent>
              {inspections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Проверок пока нет</p>
                  <p className="text-xs mt-2">Начните первую проверку выше</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedInspectionId(inspection.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{inspection.product?.name || 'Изделие'}</p>
                          <Badge variant={
                            inspection.status === 'passed' ? 'default' :
                            inspection.status === 'failed' ? 'destructive' :
                            'outline'
                          }>
                            {inspection.status === 'passed' ? 'Принято' :
                             inspection.status === 'failed' ? 'Отклонено' :
                             inspection.status === 'in_progress' ? 'В работе' : 'Ожидает'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {inspection.checklist?.name} • {inspection.inspector?.full_name || 'Инспектор'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inspection.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      {inspection.score !== undefined && (
                        <div className="text-right">
                          <p className="text-2xl font-bold">{inspection.score}%</p>
                          <p className="text-xs text-muted-foreground">Оценка</p>
                  </div>
                      )}
                </div>
              ))}
                </div>
              )}
            </CardContent>
          </Card>

          <QualityInspectionDialog
            inspectionId={selectedInspectionId}
            open={!!selectedInspectionId}
            onOpenChange={(open) => !open && setSelectedInspectionId(null)}
          />
        </TabsContent>
      </Tabs>

      {/* Диалог материалов */}
      <ProductMaterialsDialog
        productId={selectedProductForMaterials?.id || null}
        productName={selectedProductForMaterials?.name}
        open={!!selectedProductForMaterials}
        onOpenChange={(open) => !open && setSelectedProductForMaterials(null)}
      />

      {/* Диалог редактирования изделия */}
      <ProductEditDialog
        product={selectedProductForEdit}
        open={!!selectedProductForEdit}
        onOpenChange={(open) => !open && setSelectedProductForEdit(null)}
        onProductUpdated={() => {
          // Перезагружаем данные
          window.location.reload();
        }}
        onProductDeleted={() => {
          // Перезагружаем данные
          window.location.reload();
        }}
      />
    </div>
  );
}
