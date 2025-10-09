import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';

interface Contract {
  id: string;
  name: string;
  counterparty: string;
  amount: number;
  status: 'draft' | 'active' | 'expiring' | 'expired';
  startDate: string;
  endDate: string;
}

export function ContractManagement() {
  const [contracts] = useState<Contract[]>([
    { id: '1', name: 'Поставка материалов', counterparty: 'ООО "МебельКомплект"', amount: 500000, status: 'active', startDate: '2025-01-01', endDate: '2025-12-31' },
    { id: '2', name: 'Аренда помещения', counterparty: 'ИП Иванов', amount: 150000, status: 'expiring', startDate: '2024-01-01', endDate: '2025-11-30' },
    { id: '3', name: 'Обслуживание оборудования', counterparty: 'ООО "ТехСервис"', amount: 80000, status: 'active', startDate: '2025-06-01', endDate: '2026-06-01' },
  ]);

  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Активен</Badge>;
      case 'expiring':
        return <Badge variant="outline" className="text-warning"><Clock className="h-3 w-3 mr-1" /> Истекает</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Истёк</Badge>;
      default:
        return <Badge variant="secondary">Черновик</Badge>;
    }
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Управление договорами
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Поиск договоров..." className="focus-elegant" />
          <Button className="hover-lift">
            <Plus className="h-4 w-4 mr-2" />
            Новый
          </Button>
        </div>

        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-all animate-fade-in cursor-pointer interactive hover-lift"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{contract.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{contract.counterparty}</p>
                </div>
                {getStatusBadge(contract.status)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(contract.startDate).toLocaleDateString('ru-RU')} - {new Date(contract.endDate).toLocaleDateString('ru-RU')}</span>
                <span className="font-medium text-foreground">{contract.amount.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="text-center">
            <p className="text-xl font-bold text-success">{contracts.filter(c => c.status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">Активных</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-warning">{contracts.filter(c => c.status === 'expiring').length}</p>
            <p className="text-xs text-muted-foreground">Истекают</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{contracts.reduce((sum, c) => sum + c.amount, 0).toLocaleString('ru-RU')} ₽</p>
            <p className="text-xs text-muted-foreground">Сумма</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
