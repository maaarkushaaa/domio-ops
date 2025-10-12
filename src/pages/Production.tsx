import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, CheckCircle2, Clock, AlertTriangle, Package } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { ProductDialog } from "@/components/production/ProductDialog";
import { ProductionDetailsDialog } from "@/components/production/ProductionDetailsDialog";
import { useState, useMemo } from "react";

export default function Production() {
  const { products, isLoading } = useProducts();
  const [detailsType, setDetailsType] = useState<'inProgress' | 'completed' | 'needsMaterials' | 'warehouse' | null>(null);

  // Вычисление статистики на основе реальных данных
  const stats = useMemo(() => {
    const inProgress = products.filter(p => p.status === 'in_progress').length;
    const qualityCheck = products.filter(p => p.status === 'quality_check').length;
    const completed = products.filter(p => p.status === 'completed').length;
    // Для "требуют материалов" и "на складе" нужны будут дополнительные данные из БД материалов
    const needsMaterials = 0; // TODO: подключить таблицу материалов
    const warehouse = 0; // TODO: подключить склад
    
    return { inProgress: inProgress + qualityCheck, completed, needsMaterials, warehouse };
  }, [products]);

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
        <ProductDialog trigger={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Новое изделие
          </Button>
        } />
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
      />

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Изделия</TabsTrigger>
          <TabsTrigger value="bom">BOM / Материалы</TabsTrigger>
          <TabsTrigger value="quality">Контроль качества</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{product.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getStatusLabel(product.status)}</Badge>
                      {product.assignee && (
                        <span className="text-sm text-muted-foreground">• {product.assignee.full_name}</span>
                      )}
                    </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Контроль качества</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Чек-листы контроля качества будут отображаться здесь</p>
                <p className="text-xs mt-2">Выберите изделие для проверки или создайте новый чек-лист</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
