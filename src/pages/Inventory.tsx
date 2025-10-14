import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, AlertTriangle, TrendingDown, TrendingUp, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity: number;
  unit_price: number;
  location: string;
  category: { name: string };
}

interface InventoryAlert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  created_at: string;
  item: { name: string };
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
    loadAlerts();

    // Realtime подписка на изменения
    const itemsChannel = supabase
      .channel('inventory_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        loadInventory();
      })
      .subscribe();

    const alertsChannel = supabase
      .channel('inventory_alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_alerts' }, () => {
        loadAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const loadInventory = async () => {
    const { data, error } = await (supabase as any)
      .from('inventory_items')
      .select('*, category:material_categories(name)')
      .order('name');
    
    if (error) {
      console.error('Error loading inventory:', error);
      return;
    }
    setItems(data || []);
  };

  const loadAlerts = async () => {
    const { data, error } = await (supabase as any)
      .from('inventory_alerts')
      .select('*, item:inventory_items(name)')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading alerts:', error);
      return;
    }
    setAlerts(data || []);
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await (supabase as any)
      .from('inventory_alerts')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString(), acknowledged_by: (await supabase.auth.getUser()).data.user?.id })
      .eq('id', alertId);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось подтвердить алерт', variant: 'destructive' });
      return;
    }

    loadAlerts();
    toast({ title: 'Алерт подтверждён', description: 'Уведомление отмечено как прочитанное' });
  };

  const getStockPercentage = (item: InventoryItem) => {
    if (item.max_quantity) {
      return (item.current_quantity / item.max_quantity) * 100;
    }
    return (item.current_quantity / (item.min_quantity * 3)) * 100;
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_quantity <= 0) return { label: 'Нет в наличии', color: 'destructive' };
    if (item.current_quantity <= item.min_quantity) return { label: 'Низкий остаток', color: 'warning' };
    if (item.max_quantity && item.current_quantity > item.max_quantity) return { label: 'Переполнение', color: 'secondary' };
    return { label: 'В наличии', color: 'success' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = items.filter(item => item.current_quantity <= item.min_quantity);
  const outOfStockItems = items.filter(item => item.current_quantity <= 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Учёт запасов
          </h1>
          <p className="text-muted-foreground mt-1">Realtime мониторинг материалов и алерты</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Добавить материал
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Всего позиций</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground mt-1">На складе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Критичные
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Нет в наличии</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-warning" />
              Низкий остаток
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Требуют закупки</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Активные алерты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Непрочитанные</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Все материалы</TabsTrigger>
          <TabsTrigger value="alerts">Алерты ({alerts.length})</TabsTrigger>
          <TabsTrigger value="low">Низкий остаток</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или артикулу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const status = getStockStatus(item);
              const percentage = getStockPercentage(item);
              
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        {item.sku && (
                          <p className="text-xs text-muted-foreground mt-1">Арт: {item.sku}</p>
                        )}
                      </div>
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Остаток</span>
                        <span className="font-medium">
                          {item.current_quantity} {item.unit}
                        </span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>Мин: {item.min_quantity}</span>
                        {item.max_quantity && <span>Макс: {item.max_quantity}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Категория</span>
                      <Badge variant="outline">{item.category?.name || 'Без категории'}</Badge>
                    </div>

                    {item.location && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Местоположение</span>
                        <span className="text-xs">{item.location}</span>
                      </div>
                    )}

                    {item.unit_price && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Стоимость</span>
                        <span className="font-medium">{(item.current_quantity * item.unit_price).toLocaleString('ru-RU')} ₽</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Нет активных алертов</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity}
                          </Badge>
                          <span className="text-sm font-medium">{alert.item?.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Подтвердить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="low" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lowStockItems.map((item) => {
              const status = getStockStatus(item);
              
              return (
                <Card key={item.id} className="border-warning">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <Badge variant="warning">{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Текущий остаток</span>
                        <span className="font-medium text-warning">
                          {item.current_quantity} {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Минимум</span>
                        <span>{item.min_quantity} {item.unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Требуется закупить</span>
                        <span className="font-medium">
                          {Math.max(0, (item.max_quantity || item.min_quantity * 3) - item.current_quantity)} {item.unit}
                        </span>
                      </div>
                      <Button className="w-full mt-2" size="sm">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Создать заказ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
