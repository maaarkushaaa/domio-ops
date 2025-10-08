import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contract {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  date: string;
}

export function BlockchainContracts() {
  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: '0x1a2b3c',
      name: 'Контракт на производство мебели',
      status: 'active',
      date: '2025-10-01',
    },
  ]);
  const { toast } = useToast();

  const createContract = () => {
    const newContract: Contract = {
      id: '0x' + Math.random().toString(36).substring(7),
      name: 'Новый смарт-контракт',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };
    setContracts([...contracts, newContract]);
    toast({
      title: 'Контракт создан',
      description: 'Смарт-контракт развернут в блокчейне',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'active':
        return Link2;
      case 'completed':
        return CheckCircle2;
      default:
        return FileText;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Блокчейн-контракты
        </CardTitle>
        <CardDescription>
          Неизменяемые смарт-контракты для бизнеса
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {contracts.map((contract) => {
            const StatusIcon = getStatusIcon(contract.status);
            return (
              <div
                key={contract.id}
                className="p-3 bg-muted rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{contract.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{contract.id}</p>
                  </div>
                  <Badge variant={getStatusColor(contract.status)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {contract.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Дата: {new Date(contract.date).toLocaleDateString('ru-RU')}
                </p>
              </div>
            );
          })}
        </div>
        <Button onClick={createContract} className="w-full">
          <Link2 className="h-4 w-4 mr-2" />
          Создать смарт-контракт
        </Button>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Неизменяемая история операций</p>
          <p>• Автоматическое исполнение условий</p>
          <p>• Прозрачность для всех участников</p>
        </div>
      </CardContent>
    </Card>
  );
}
