import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Building2, 
  Wallet, 
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useFinance, Account } from '@/hooks/use-finance';
import { useAppNotifications } from '@/components/NotificationIntegration';
import { toast } from '@/hooks/use-toast';

interface AccountDialogProps {
  account?: Account;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Банковский счет', icon: Building2, color: 'bg-blue-100 text-blue-800' },
  { value: 'cash', label: 'Касса', icon: Wallet, color: 'bg-green-100 text-green-800' },
  { value: 'credit', label: 'Кредитная карта', icon: CreditCard, color: 'bg-red-100 text-red-800' },
  { value: 'investment', label: 'Инвестиции', icon: TrendingUp, color: 'bg-purple-100 text-purple-800' },
  { value: 'crypto', label: 'Криптовалюта', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' }
];

const CURRENCIES = [
  { value: 'RUB', label: 'Российский рубль (₽)' },
  { value: 'USD', label: 'Доллар США ($)' },
  { value: 'EUR', label: 'Евро (€)' },
  { value: 'CNY', label: 'Китайский юань (¥)' }
];

export function AccountDialog({ account, trigger, onSuccess }: AccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Форма
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<Account['type']>(account?.type || 'bank');
  const [currency, setCurrency] = useState(account?.currency || 'RUB');
  const [balance, setBalance] = useState(account?.balance?.toString() || '0');
  const [isDefault, setIsDefault] = useState(account?.is_default || false);
  const [isActive, setIsActive] = useState(account?.is_active ?? true);
  const [bankName, setBankName] = useState(account?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(account?.account_number || '');
  const [description, setDescription] = useState(account?.description || '');

  const { createAccount, updateAccount, deleteAccount, accounts } = useFinance();
  const { notifySuccess, notifyError } = useAppNotifications();

  const isEdit = !!account;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название счета обязательно',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const accountData = {
        name: name.trim(),
        type,
        currency,
        balance: parseFloat(balance) || 0,
        is_default: isDefault,
        is_active: isActive,
        bank_name: bankName.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        description: description.trim() || undefined
      };

      if (isEdit) {
        await updateAccount(account.id, accountData);
        notifySuccess('Счет обновлен', `Счет "${name}" успешно обновлен`);
      } else {
        await createAccount(accountData);
        notifySuccess('Счет создан', `Счет "${name}" успешно добавлен`);
      }

      // Сброс формы
      if (!isEdit) {
        setName('');
        setBalance('0');
        setBankName('');
        setAccountNumber('');
        setDescription('');
        setIsDefault(false);
      }
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving account:', error);
      notifyError('Ошибка сохранения', 'Не удалось сохранить счет');
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить счет',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = ACCOUNT_TYPES.find(t => t.value === type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="h-4 w-4 mr-2" />Новый счет</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать счет' : 'Создать счет'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название счета *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Основной расчетный счет"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Тип счета</Label>
              <Select value={type} onValueChange={(value) => setType(value as Account['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Валюта и баланс */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Валюта</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Начальный баланс</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Банковские реквизиты */}
          {(type === 'bank' || type === 'credit') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Название банка</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Сбербанк"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Номер счета/карты</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="40817810123456789012"
                />
              </div>
            </div>
          )}

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительная информация о счете"
              rows={3}
            />
          </div>

          {/* Настройки */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Основной счет</Label>
                <p className="text-sm text-muted-foreground">
                  Используется по умолчанию для новых операций
                </p>
              </div>
              <Switch
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Активный счет</Label>
                <p className="text-sm text-muted-foreground">
                  Счет доступен для использования
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
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

export function AccountsManagement() {
  const { accounts, deleteAccount } = useFinance();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      toast({
        title: 'Счет удален',
        description: 'Счет успешно удален'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить счет',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой добавления */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление счетами</h2>
          <p className="text-muted-foreground">Создание и настройка финансовых счетов</p>
        </div>
        <AccountDialog />
      </div>

      {/* Список счетов */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const typeInfo = ACCOUNT_TYPES.find(t => t.value === account.type);
          const TypeIcon = typeInfo?.icon || CreditCard;
          
          return (
            <Card key={account.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-5 w-5" />
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAccount(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={typeInfo?.color || 'bg-gray-100 text-gray-800'}>
                    {typeInfo?.label || account.type}
                  </Badge>
                  {account.is_default && (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Основной
                    </Badge>
                  )}
                  {!account.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Неактивный
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Баланс:</span>
                    <span className={`font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {account.balance.toLocaleString('ru-RU')} {account.currency}
                    </span>
                  </div>
                  {account.bank_name && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Банк:</span>
                      <span className="text-sm">{account.bank_name}</span>
                    </div>
                  )}
                  {account.account_number && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Номер:</span>
                      <span className="text-sm font-mono">{account.account_number}</span>
                    </div>
                  )}
                  {account.description && (
                    <p className="text-sm text-muted-foreground mt-2">{account.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Диалог редактирования */}
      {selectedAccount && (
        <AccountDialog
          account={selectedAccount}
          onSuccess={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
}
