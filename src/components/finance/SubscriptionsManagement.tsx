import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Play,
  Pause
} from 'lucide-react';
import { useFinance, Subscription } from '@/hooks/use-finance';
import { useAppNotifications } from '@/components/NotificationIntegration';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { safeFormatCurrency } from '@/utils/safeFormat';

interface SubscriptionDialogProps {
  subscription?: Subscription;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Активна', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  { value: 'paused', label: 'Приостановлена', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  { value: 'cancelled', label: 'Отменена', color: 'bg-red-100 text-red-800', icon: X },
  { value: 'expired', label: 'Истекла', color: 'bg-gray-100 text-gray-800', icon: Clock }
];

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Ежемесячно' },
  { value: 'quarterly', label: 'Ежеквартально' },
  { value: 'yearly', label: 'Ежегодно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'daily', label: 'Ежедневно' }
];

export function SubscriptionDialog({ subscription, trigger, onSuccess }: SubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Форма
  const [name, setName] = useState(subscription?.name || '');
  const [description, setDescription] = useState(subscription?.description || '');
  const [amount, setAmount] = useState(subscription?.amount?.toString() || '');
  const [currency, setCurrency] = useState(subscription?.currency || 'RUB');
  const [billingCycle, setBillingCycle] = useState(subscription?.billing_cycle || 'monthly');
  const [status, setStatus] = useState(subscription?.status || 'active');
  const [startDate, setStartDate] = useState(subscription?.start_date || '');
  const [nextPaymentDate, setNextPaymentDate] = useState(subscription?.next_payment_date || '');
  const [isAutoRenew, setIsAutoRenew] = useState(subscription?.auto_renew ?? true);
  const [notes, setNotes] = useState(subscription?.notes || '');

  const { createSubscription, updateSubscription } = useFinance();
  const { notifySuccess, notifyError } = useAppNotifications();

  const isEdit = !!subscription;

  // Авто-открытие диалога при переданной подписке (режим редактирования)
  useEffect(() => {
    if (subscription) {
      setOpen(true);
    }
  }, [subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const isActive = status === 'active';
      const subscriptionData: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
        currency,
        period: billingCycle,
        is_active: isActive,
        next_payment_date: nextPaymentDate || undefined,
        auto_renewal: isAutoRenew,
      };

      if (isEdit && subscription) {
        await updateSubscription(subscription.id, subscriptionData);
        notifySuccess('Подписка обновлена', `Подписка "${name}" успешно обновлена`);
      } else {
        await createSubscription(subscriptionData);
        notifySuccess('Подписка создана', `Подписка "${name}" успешно создана`);
      }

      // Сброс формы
      if (!isEdit) {
        setName('');
        setDescription('');
        setAmount('');
        setNotes('');
        setIsAutoRenew(true);
      }
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving subscription:', error);
      notifyError('Ошибка сохранения', 'Не удалось сохранить подписку');
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить подписку',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStatus = SUBSCRIPTION_STATUSES.find(s => s.value === status);
  const StatusIcon = selectedStatus?.icon || CheckCircle2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="h-4 w-4 mr-2" />Новая подписка</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать подписку' : 'Создать подписку'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Измените данные подписки' : 'Создайте новую подписку для учета регулярных платежей'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название подписки *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spotify Premium"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Сумма и валюта */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Сумма *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Валюта</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RUB">Российский рубль (₽)</SelectItem>
                  <SelectItem value="USD">Доллар США ($)</SelectItem>
                  <SelectItem value="EUR">Евро (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Периодичность и даты */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Периодичность</Label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((cycle) => (
                    <SelectItem key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Дата начала</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextPaymentDate">Следующий платеж</Label>
              <Input
                id="nextPaymentDate"
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
              />
            </div>
          </div>

          {/* Описание и примечания */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание подписки"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Дополнительная информация"
                rows={2}
              />
            </div>
          </div>

          {/* Настройки */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Автопродление</Label>
              <p className="text-sm text-muted-foreground">
                Подписка будет продлеваться автоматически
              </p>
            </div>
            <Switch
              checked={isAutoRenew}
              onCheckedChange={setIsAutoRenew}
            />
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : (isEdit ? 'Обновить' : 'Создать')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriptionsManagement() {
  const { subscriptions, deleteSubscription, updateSubscription, loadData } = useFinance();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const getStatusInfo = (status: string) => {
    return SUBSCRIPTION_STATUSES.find(s => s.value === status) || SUBSCRIPTION_STATUSES[0];
  };

  const handleStatusChange = async (subscriptionId: string, newStatus: Subscription['status']) => {
    try {
      const isActive = newStatus === 'active';
      await updateSubscription(subscriptionId, { is_active: isActive } as any);
      toast({
        title: 'Статус обновлен',
        description: 'Статус подписки успешно изменен'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      await deleteSubscription(subscriptionId);
      toast({
        title: 'Подписка удалена',
        description: 'Подписка успешно удалена'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить подписку',
        variant: 'destructive'
      });
    }
  };

  const getBillingCycleLabel = (cycle: string) => {
    return BILLING_CYCLES.find(c => c.value === cycle)?.label || cycle;
  };

  const isUpcomingPayment = (date: string) => {
    const paymentDate = new Date(date);
    const today = new Date();
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой добавления */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление подписками</h2>
          <p className="text-muted-foreground">Отслеживание и управление подписками</p>
        </div>
        <SubscriptionDialog />
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего подписок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter(sub => sub.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Приостановлены</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {subscriptions.filter(sub => sub.status === 'paused').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ближайшие платежи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {subscriptions.filter(sub => isUpcomingPayment(sub.next_payment_date)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица подписок */}
      <Card>
        <CardHeader>
          <CardTitle>Список подписок</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Периодичность</TableHead>
                <TableHead>Следующий платеж</TableHead>
                <TableHead>Автопродление</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => {
                const statusInfo = getStatusInfo(subscription.status);
                const StatusIcon = statusInfo.icon;
                const isUpcoming = isUpcomingPayment(subscription.next_payment_date);
                
                return (
                  <TableRow key={subscription.id} className={isUpcoming ? 'bg-blue-50' : ''}>
                    <TableCell className="font-medium">{subscription.name}</TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {safeFormatCurrency(subscription.amount, subscription.currency)}
                    </TableCell>
                    <TableCell>{getBillingCycleLabel(subscription.billing_cycle)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {format(new Date(subscription.next_payment_date), 'dd.MM.yyyy', { locale: ru })}
                        {isUpcoming && <AlertCircle className="h-4 w-4 text-orange-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.auto_renew ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Включено
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <X className="h-3 w-3 mr-1" />
                          Отключено
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSubscription(subscription)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSubscription(subscription.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Диалог редактирования */}
      {selectedSubscription && (
        <SubscriptionDialog
          subscription={selectedSubscription}
          onSuccess={() => {
            setSelectedSubscription(null);
            // Немедленно обновляем список подписок из этого экземпляра useFinance
            try { loadData(); } catch (e) { console.warn('Subscriptions reload failed:', e); }
          }}
        />
      )}
    </div>
  );
}
