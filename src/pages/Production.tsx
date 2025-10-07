import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, CheckCircle2, Clock, AlertTriangle, Package } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { ProductDialog } from "@/components/production/ProductDialog";

const bomItemsStatic = [
  { name: "ЛДСП 16мм белый", quantity: 8, unit: "м²", inStock: 12, status: "В наличии" },
  { name: "Кромка ПВХ 2мм", quantity: 45, unit: "м", inStock: 30, status: "Недостаточно" },
  { name: "Петли Blum", quantity: 6, unit: "шт", inStock: 8, status: "В наличии" },
  { name: "Направляющие 500мм", quantity: 4, unit: "пар", inStock: 2, status: "Недостаточно" },
  { name: "Конфирматы 5x70", quantity: 24, unit: "шт", inStock: 100, status: "В наличии" },
];

export default function Production() {
  const { products, isLoading } = useProducts();

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

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">изделий</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Завершено за месяц</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+8% к прошлому</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Требуют материалов</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">3</div>
            <p className="text-xs text-muted-foreground">ожидают закупки</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">На складе</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">позиций</p>
          </CardContent>
        </Card>
      </div>

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
              <CardTitle>BOM: Шкаф Версаль</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bomItemsStatic.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Требуется: {item.quantity} {item.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          На складе: {item.inStock} {item.unit}
                        </p>
                      </div>
                      <Badge
                        variant={item.status === "В наличии" ? "default" : "destructive"}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать заказ недостающих материалов
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Чек-лист качества: Шкаф Версаль</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { item: "Поликаунт в пределах нормы (< 100K)", checked: true },
                { item: "PBR-карты созданы и оптимизированы", checked: true },
                { item: "Вес GLB файла < 10MB", checked: true },
                { item: "Пройдена glTF-валидация", checked: false },
                { item: "Превью-рендер создан", checked: false },
                { item: "UV-развертка без наложений", checked: true },
              ].map((check, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center ${
                      check.checked ? "bg-success" : "bg-muted"
                    }`}
                  >
                    {check.checked && <CheckCircle2 className="h-4 w-4 text-success-foreground" />}
                  </div>
                  <span className={check.checked ? "line-through text-muted-foreground" : ""}>
                    {check.item}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
