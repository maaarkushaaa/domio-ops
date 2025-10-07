import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { useProcurement } from "@/hooks/use-procurement";
import { SupplierDialog } from "@/components/procurement/SupplierDialog";

export default function Procurement() {
  const { suppliers, orders, warehouseItems } = useProcurement();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'sent': return 'Отправлен';
      case 'confirmed': return 'Подтвержден';
      case 'in_transit': return 'В пути';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const criticalItems = warehouseItems.filter(
    item => item.min_quantity && item.quantity < item.min_quantity
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Закупки</h1>
          <p className="text-muted-foreground">Поставщики, заказы и склад</p>
        </div>
        <div className="flex gap-2">
          <SupplierDialog trigger={
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Поставщики
            </Button>
          } />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Новый заказ
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Активные заказы</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</div>
            <p className="text-xs text-muted-foreground">в процессе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Сумма заказов</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString('ru-RU')} ₽</div>
            <p className="text-xs text-muted-foreground">за месяц</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ожидают доставки</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'in_transit').length}</div>
            <p className="text-xs text-muted-foreground">заказов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Критичные остатки</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalItems.length}</div>
            <p className="text-xs text-muted-foreground">позиций</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="suppliers">Поставщики</TabsTrigger>
          <TabsTrigger value="warehouse">Склад</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Активные заказы поставщикам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.number}</p>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "in_transit"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{order.supplier?.name || 'Поставщик не указан'}</p>
                      <p className="text-xs text-muted-foreground">
                        Создан: {new Date(order.order_date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold">{order.total_amount.toLocaleString('ru-RU')} ₽</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Детали
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Поставщики</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.rating && (
                          <Badge variant="outline">
                            ⭐ {supplier.rating}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{supplier.category || 'Без категории'}</p>
                      {supplier.delivery_time && (
                        <p className="text-xs text-muted-foreground">
                          Доставка: {supplier.delivery_time}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Создать заказ
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Складские остатки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {warehouseItems.map((item) => {
                  const isLow = item.min_quantity && item.quantity < item.min_quantity;
                  const isCritical = item.min_quantity && item.quantity < (item.min_quantity * 0.5);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.min_quantity && (
                          <p className="text-sm text-muted-foreground">
                            Минимум: {item.min_quantity} {item.unit}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <Badge
                          variant={
                            isCritical
                              ? "destructive"
                              : isLow
                              ? "outline"
                              : "default"
                          }
                          className="min-w-[90px] justify-center"
                        >
                          {isCritical ? "Критично" : isLow ? "Мало" : "В наличии"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
