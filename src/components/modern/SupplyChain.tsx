import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Truck, CheckCircle, AlertCircle, MapPin } from 'lucide-react';

interface ShipmentStatus {
  id: string;
  orderId: string;
  product: string;
  status: 'ordered' | 'in_transit' | 'customs' | 'delivered';
  location: string;
  estimatedDelivery: string;
  supplier: string;
}

export function SupplyChain() {
  const [shipments] = useState<ShipmentStatus[]>([
    {
      id: '1',
      orderId: 'ORD-2025-001',
      product: 'Фурнитура премиум',
      status: 'in_transit',
      location: 'Москва',
      estimatedDelivery: '2025-10-15',
      supplier: 'Global Supply Co',
    },
    {
      id: '2',
      orderId: 'ORD-2025-002',
      product: 'МДФ панели',
      status: 'customs',
      location: 'Таможня',
      estimatedDelivery: '2025-10-18',
      supplier: 'Euro Materials',
    },
    {
      id: '3',
      orderId: 'ORD-2025-003',
      product: 'Лак водный',
      status: 'delivered',
      location: 'Склад',
      estimatedDelivery: '2025-10-10',
      supplier: 'ChemPro',
    },
  ]);

  const getStatusIcon = (status: ShipmentStatus['status']) => {
    switch (status) {
      case 'ordered':
        return <Package className="h-4 w-4 text-muted-foreground" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-primary animate-pulse" />;
      case 'customs':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getStatusText = (status: ShipmentStatus['status']) => {
    switch (status) {
      case 'ordered':
        return 'Заказан';
      case 'in_transit':
        return 'В пути';
      case 'customs':
        return 'На таможне';
      case 'delivered':
        return 'Доставлен';
    }
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Цепочка поставок
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{shipment.product}</p>
                    <p className="text-xs text-muted-foreground">
                      {shipment.orderId}
                    </p>
                  </div>
                  <Badge
                    variant={
                      shipment.status === 'delivered'
                        ? 'default'
                        : shipment.status === 'customs'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(shipment.status)}
                    {getStatusText(shipment.status)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{shipment.location}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Поставщик:</span>
                  <span className="font-medium">{shipment.supplier}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ожидается:</span>
                  <span className="font-medium">
                    {new Date(shipment.estimatedDelivery).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
