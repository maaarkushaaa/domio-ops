import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, AlertCircle, TrendingUp, TrendingDown, Search } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
}

export function InventoryTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [items] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'МДФ панели 18мм',
      sku: 'MDF-18-2440',
      quantity: 450,
      minStock: 200,
      maxStock: 800,
      unit: 'шт',
      location: 'Склад А-1',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Петли Blum',
      sku: 'HINGE-BLUM-01',
      quantity: 85,
      minStock: 100,
      maxStock: 500,
      unit: 'шт',
      location: 'Склад Б-3',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Лак водный матовый',
      sku: 'LAC-MAT-5L',
      quantity: 320,
      minStock: 150,
      maxStock: 400,
      unit: 'л',
      location: 'Склад В-2',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Ручки мебельные хром',
      sku: 'HAND-CHR-128',
      quantity: 1250,
      minStock: 500,
      maxStock: 2000,
      unit: 'шт',
      location: 'Склад Б-1',
      lastUpdated: new Date().toISOString(),
    },
  ]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity < item.minStock) {
      return { status: 'low', color: 'destructive', icon: AlertCircle };
    }
    if (item.quantity > item.maxStock) {
      return { status: 'high', color: 'warning', icon: TrendingUp };
    }
    return { status: 'normal', color: 'default', icon: TrendingUp };
  };

  const getStockPercentage = (item: InventoryItem) => {
    return Math.round((item.quantity / item.maxStock) * 100);
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Учет склада
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или артикулу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-80">
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const status = getStockStatus(item);
              const percentage = getStockPercentage(item);
              const StatusIcon = status.icon;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3 animate-fade-in"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <Badge variant={status.color as any} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.status === 'low' ? 'Мало' : status.status === 'high' ? 'Много' : 'Норма'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">На складе</p>
                      <p className="font-medium">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Расположение</p>
                      <p className="font-medium">{item.location}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Заполнение</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          status.status === 'low'
                            ? 'bg-destructive'
                            : status.status === 'high'
                            ? 'bg-warning'
                            : 'bg-success'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Мин: {item.minStock}</span>
                      <span>Макс: {item.maxStock}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Button className="flex-1 hover-lift" variant="outline">
            Заказать пополнение
          </Button>
          <Button className="flex-1 hover-lift">Экспорт отчета</Button>
        </div>
      </CardContent>
    </Card>
  );
}
