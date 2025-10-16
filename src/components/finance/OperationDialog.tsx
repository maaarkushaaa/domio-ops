import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Tag, User } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { safeFormatCurrency } from '@/utils/safeFormat';
import { useFinance, FinancialOperation } from '@/hooks/use-finance';
import { useAppNotifications } from '@/components/NotificationIntegration';
import { toast } from '@/hooks/use-toast';

interface OperationDialogProps {
  trigger?: React.ReactNode;
  accountId?: string;
  operation?: FinancialOperation;
  onSuccess?: () => void;
}

const OPERATION_TYPES = [
  { value: 'income', label: 'Доход', icon: '💰' },
  { value: 'expense', label: 'Расход', icon: '💸' },
  { value: 'transfer', label: 'Перевод', icon: '🔄' }
];

const CATEGORIES = {
  income: [
    { value: 'Продажи', subcategories: ['Мебель', 'Услуги', 'Консультации'] },
    { value: 'Инвестиции', subcategories: ['Дивиденды', 'Проценты', 'Рост капитала'] },
    { value: 'Прочее', subcategories: ['Возврат', 'Подарки', 'Прочее'] }
  ],
  expense: [
    { value: 'Производство', subcategories: ['Материалы', 'Фурнитура', 'Инструменты', 'Оборудование'] },
    { value: 'Маркетинг', subcategories: ['Реклама', 'SMM', 'Контент', 'События'] },
    { value: 'Разработка', subcategories: ['Зарплата', 'Инструменты', 'Хостинг', 'Лицензии'] },
    { value: 'Общее', subcategories: ['Аренда', 'Коммунальные', 'Офис', 'Канцелярия'] },
    { value: 'Транспорт', subcategories: ['Топливо', 'Ремонт', 'Страховка', 'Налоги'] },
    { value: 'Прочее', subcategories: ['Разное', 'Непредвиденные'] }
  ],
  transfer: [
    { value: 'Между счетами', subcategories: ['Перевод', 'Пополнение', 'Снятие'] },
    { value: 'Инвестиции', subcategories: ['Покупка', 'Продажа', 'Реинвест'] }
  ]
};

export function OperationDialog({ trigger, accountId, operation, onSuccess }: OperationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Форма
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');

  const { createOperation, updateOperation, accounts } = useFinance();
  const { notifySuccess, notifyError } = useAppNotifications();

  const isEdit = !!operation;

  useEffect(() => {
    if (!accountId) {
      const defaultAccount = accounts.find((acc) => acc.is_default) || accounts.find((acc) => acc.is_active);
      if (defaultAccount && !selectedAccountId) {
        setSelectedAccountId(defaultAccount.id);
      }
    } else if (accountId !== selectedAccountId) {
      setSelectedAccountId(accountId);
    }
  }, [accounts, accountId, selectedAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !selectedAccountId) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const operationData = {
        type,
        amount: parseFloat(amount),
        currency,
        category,
        subcategory: subcategory || undefined,
        description: description || undefined,
        date: date.toISOString().split('T')[0],
        account_id: selectedAccountId,
        tags: tags.length > 0 ? tags : undefined
      };

      if (isEdit) {
        await updateOperation(operation.id, operationData);
        notifySuccess('Операция обновлена', `Операция "${description || category}" успешно обновлена`);
      } else {
        await createOperation(operationData);
        notifySuccess('Операция создана', `Операция "${description || category}" успешно добавлена`);
      }

      // Сброс формы
      if (!isEdit) {
        setAmount('');
        setCategory('');
        setSubcategory('');
        setDescription('');
        setTags([]);
      }
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving operation:', error);
      notifyError('Ошибка сохранения', 'Не удалось сохранить операцию');
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить операцию',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const currentCategories = CATEGORIES[type] || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="h-4 w-4 mr-2" />Новая операция</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать операцию' : 'Создать операцию'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Измените данные финансовой операции' : 'Создайте новую финансовую операцию'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Тип операции */}
          <div className="space-y-2">
            <Label>Тип операции</Label>
            <div className="grid grid-cols-3 gap-2">
              {OPERATION_TYPES.map((opType) => (
                <Button
                  key={opType.value}
                  type="button"
                  variant={type === opType.value ? 'default' : 'outline'}
                  onClick={() => {
                    setType(opType.value as any);
                    setCategory('');
                    setSubcategory('');
                  }}
                  className="flex items-center gap-2"
                >
                  <span>{opType.icon}</span>
                  {opType.label}
                </Button>
              ))}
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
                  <SelectItem value="RUB">₽ RUB</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Категория и подкатегория */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Категория *</Label>
              <Select value={category} onValueChange={(value) => {
                setCategory(value);
                setSubcategory('');
              }} required>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {currentCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Подкатегория</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите подкатегорию" />
                </SelectTrigger>
                <SelectContent>
                  {currentCategories
                    .find(cat => cat.value === category)
                    ?.subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание операции"
              rows={3}
            />
          </div>

          {/* Дата и счет */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Дата операции</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Счет *</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите счет" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(acc => acc.is_active).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({safeFormatCurrency(account.balance, account.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Теги */}
          <div className="space-y-2">
            <Label>Теги</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Добавить тег"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(tag)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
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