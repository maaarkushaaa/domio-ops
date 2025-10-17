import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status: string;
  created_at: string;
}

interface ClientDetailsDialogProps {
  client: Client;
  trigger?: React.ReactNode;
}

export function ClientDetailsDialog({ client, trigger }: ClientDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [dealsStats, setDealsStats] = useState<{ totalDeals: number; totalAmount: number }>({
    totalDeals: 0,
    totalAmount: 0,
  });

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const { data, error } = await (supabase as any)
        .from('deals')
        .select('amount')
        .eq('client_id', client.id);

      if (error) throw error;

      const totalDeals = data?.length ?? 0;
      const totalAmount = (data ?? []).reduce((sum: number, deal: any) => sum + Number(deal.amount || 0), 0);

      setDealsStats({ totalDeals, totalAmount });
    } catch (error) {
      console.error('Error loading client deals stats:', error);
      setDealsStats({ totalDeals: 0, totalAmount: 0 });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      fetchStats();
    }
  };

  const getStatusBadge = () => {
    switch (client.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Активный</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800">Неактивный</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Архивирован</Badge>;
      default:
        return <Badge variant="outline">{client.status}</Badge>;
    }
  };

  const formattedAmount = `${dealsStats.totalAmount.toLocaleString('ru-RU')} ₽`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>Открыть</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client.name}</DialogTitle>
          <DialogDescription>
            Детальная информация о клиенте
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Статус</CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Дата создания</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{new Date(client.created_at).toLocaleDateString('ru-RU')}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Контактная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.contact_person && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[120px]">Контактное лицо:</span>
                  <span className="text-sm text-muted-foreground">{client.contact_person}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{client.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Заметки</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Всего сделок</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? '—' : dealsStats.totalDeals}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общая сумма</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? '—' : formattedAmount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
