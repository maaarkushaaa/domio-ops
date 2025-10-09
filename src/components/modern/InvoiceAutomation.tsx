import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export function InvoiceAutomation() {
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      number: 'INV-2025-001',
      client: 'ООО "Дизайн Плюс"',
      amount: 350000,
      status: 'sent',
      dueDate: '2025-10-20',
      createdAt: '2025-10-01',
    },
    {
      id: '2',
      number: 'INV-2025-002',
      client: 'ИП Петров',
      amount: 125000,
      status: 'paid',
      dueDate: '2025-10-15',
      createdAt: '2025-10-03',
    },
    {
      id: '3',
      number: 'INV-2025-003',
      client: 'Мебель Холдинг',
      amount: 780000,
      status: 'overdue',
      dueDate: '2025-10-05',
      createdAt: '2025-09-25',
    },
    {
      id: '4',
      number: 'INV-2025-004',
      client: 'Строй Альянс',
      amount: 425000,
      status: 'draft',
      dueDate: '2025-10-25',
      createdAt: '2025-10-08',
    },
  ]);

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'sent': return <Send className="h-4 w-4 text-primary" />;
      case 'paid': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'sent': return 'Отправлен';
      case 'paid': return 'Оплачен';
      case 'overdue': return 'Просрочен';
    }
  };

  const getStatusVariant = (status: Invoice['status']): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Автоматизация счетов
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Всего</p>
            <p className="text-lg font-bold text-primary">
              {(totalAmount / 1000).toFixed(0)}к
            </p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">Оплачено</p>
            <p className="text-lg font-bold text-success">
              {(paidAmount / 1000).toFixed(0)}к
            </p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground">Просрочено</p>
            <p className="text-lg font-bold text-destructive">
              {(overdueAmount / 1000).toFixed(0)}к
            </p>
          </div>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{invoice.number}</p>
                    <p className="text-xs text-muted-foreground">{invoice.client}</p>
                  </div>
                  <Badge variant={getStatusVariant(invoice.status)} className="flex items-center gap-1">
                    {getStatusIcon(invoice.status)}
                    {getStatusText(invoice.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {invoice.amount.toLocaleString('ru-RU')} ₽
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>До: {new Date(invoice.dueDate).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>

                {invoice.status === 'draft' && (
                  <Button size="sm" className="w-full" variant="outline">
                    <Send className="h-3 w-3 mr-2" />
                    Отправить
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button className="w-full hover-lift">
          <FileText className="h-4 w-4 mr-2" />
          Создать счет
        </Button>
      </CardContent>
    </Card>
  );
}
