import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, Package, TrendingUp, AlertTriangle } from "lucide-react";

export default function Procurement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Закупки</h1>
          <p className="text-muted-foreground">Поставщики, заказы и склад</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Поставщики
          </Button>
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
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">в процессе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Сумма заказов</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245 600 ₽</div>
            <p className="text-xs text-muted-foreground">за месяц</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ожидают доставки</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">заказов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Критичные остатки</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">8</div>
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
                {[
                  {
                    number: "PO-2024-087",
                    supplier: "Мебель Плюс",
                    items: "ЛДСП, кромка",
                    amount: 45000,
                    status: "delivered",
                    date: "15 Окт",
                  },
                  {
                    number: "PO-2024-088",
                    supplier: "Фурнитура Про",
                    items: "Петли, направляющие",
                    amount: 28500,
                    status: "in_transit",
                    date: "12 Окт",
                  },
                  {
                    number: "PO-2024-089",
                    supplier: "Крепеж Мастер",
                    items: "Конфирматы, саморезы",
                    amount: 8900,
                    status: "pending",
                    date: "10 Окт",
                  },
                  {
                    number: "PO-2024-090",
                    supplier: "Мебель Плюс",
                    items: "Плиты МДФ",
                    amount: 52000,
                    status: "in_transit",
                    date: "8 Окт",
                  },
                ].map((order, i) => (
                  <div
                    key={i}
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
                          {order.status === "delivered"
                            ? "Доставлен"
                            : order.status === "in_transit"
                            ? "В пути"
                            : "Ожидание"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{order.supplier}</p>
                      <p className="text-sm text-muted-foreground">{order.items}</p>
                      <p className="text-xs text-muted-foreground">Создан: {order.date}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold">{order.amount.toLocaleString('ru-RU')} ₽</p>
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
                {[
                  {
                    name: "Мебель Плюс",
                    category: "ЛДСП, плиты",
                    rating: 4.8,
                    orders: 24,
                    totalAmount: 1250000,
                    deliveryTime: "3-5 дней",
                  },
                  {
                    name: "Фурнитура Про",
                    category: "Петли, направляющие",
                    rating: 4.5,
                    orders: 18,
                    totalAmount: 450000,
                    deliveryTime: "2-3 дня",
                  },
                  {
                    name: "Крепеж Мастер",
                    category: "Метизы",
                    rating: 4.7,
                    orders: 32,
                    totalAmount: 180000,
                    deliveryTime: "1-2 дня",
                  },
                  {
                    name: "Кромка Профи",
                    category: "Кромочные материалы",
                    rating: 4.6,
                    orders: 15,
                    totalAmount: 320000,
                    deliveryTime: "3-4 дня",
                  },
                ].map((supplier, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{supplier.name}</p>
                        <Badge variant="outline">
                          ⭐ {supplier.rating}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{supplier.category}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>Заказов: {supplier.orders}</span>
                        <span>•</span>
                        <span>Сумма: {supplier.totalAmount.toLocaleString('ru-RU')} ₽</span>
                        <span>•</span>
                        <span>Доставка: {supplier.deliveryTime}</span>
                      </div>
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
                {[
                  { name: "ЛДСП 16мм белый", inStock: 12, min: 8, unit: "м²", status: "ok" },
                  { name: "ЛДСП 16мм дуб", inStock: 5, min: 8, unit: "м²", status: "low" },
                  { name: "Кромка ПВХ 2мм белая", inStock: 30, min: 40, unit: "м", status: "low" },
                  { name: "Петли Blum", inStock: 8, min: 10, unit: "шт", status: "critical" },
                  { name: "Направляющие 500мм", inStock: 2, min: 6, unit: "пар", status: "critical" },
                  { name: "Конфирматы 5x70", inStock: 100, min: 50, unit: "шт", status: "ok" },
                  { name: "МДФ 18мм", inStock: 15, min: 10, unit: "м²", status: "ok" },
                  { name: "Кромка ПВХ 2мм венге", inStock: 8, min: 30, unit: "м", status: "critical" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Минимум: {item.min} {item.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {item.inStock} {item.unit}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === "ok"
                            ? "default"
                            : item.status === "low"
                            ? "outline"
                            : "destructive"
                        }
                        className="min-w-[90px] justify-center"
                      >
                        {item.status === "ok"
                          ? "В наличии"
                          : item.status === "low"
                          ? "Мало"
                          : "Критично"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
