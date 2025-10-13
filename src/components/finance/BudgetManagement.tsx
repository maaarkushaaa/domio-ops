import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useFinance } from '@/hooks/use-finance';
import type { Budget } from '@/hooks/use-finance';
import { useAppNotifications } from '@/components/NotificationIntegration';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BudgetDialogProps {
  budget?: Budget;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const BUDGET_TYPES = [
  { value: 'monthly', label: 'Ежемесячный', icon: Calendar },
  { value: 'quarterly', label: 'Квартальный', icon: Calendar },
  { value: 'yearly', label: 'Годовой', icon: Calendar },
  { value: 'project', label: 'Проектный', icon: Target },
  { value: 'category', label: 'По категории', icon: Target }
];

const BUDGET_STATUSES = [
  { value: 'active', label: 'Активный', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Завершен', color: 'bg-blue-100 text-blue-800' },
  { value: 'exceeded', label: 'Превышен', color: 'bg-red-100 text-red-800' },
  { value: 'paused', label: 'Приостановлен', color: 'bg-yellow-100 text-yellow-800' }
];

export function BudgetDialog({ budget, trigger, onSuccess }: BudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Форма
  const [name, setName] = useState(budget?.name || '');
  const [description, setDescription] = useState(budget?.description || '');
  const [type, setType] = useState(budget?.type || 'monthly');
  const [status, setStatus] = useState(budget?.status || 'active');
  const [amount, setAmount] = useState(budget?.amount?.toString() || '');
  const [currency, setCurrency] = useState(budget?.currency || 'RUB');
  const [startDate, setStartDate] = useState(budget?.start_date || '');
  const [endDate, setEndDate] = useState(budget?.end_date || '');
  const [category, setCategory] = useState(budget?.category || '');
  const [notes, setNotes] = useState(budget?.notes || '');

  const { createBudget, updateBudget } = useFinance();
  const { notifySuccess, notifyError } = useAppNotifications();

  const isEdit = !!budget;

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
      const budgetData = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        status,
        amount: parseFloat(amount),
        currency,
        start_date: startDate,
        end_date: endDate,
        category: category.trim() || undefined,
        notes: notes.trim() || undefined
      };

      if (isEdit && budget) {
        await updateBudget(budget.id, budgetData);
        notifySuccess('Бюджет обновлен', `Бюджет "${name}" успешно обновлен`);
      } else {
        await createBudget(budgetData);
        notifySuccess('Бюджет создан', `Бюджет "${name}" успешно создан`);
      }

      // Сброс формы
      if (!isEdit) {
        setName('');
        setDescription('');
        setAmount('');
        setCategory('');
        setNotes('');
      }
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving budget:', error);
      notifyError('Ошибка сохранения', 'Не удалось сохранить бюджет');
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить бюджет',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = BUDGET_TYPES.find(t => t.value === type);
  const TypeIcon = selectedType?.icon || Target;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="h-4 w-4 mr-2" />Новый бюджет</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать бюджет' : 'Создать бюджет'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Измените данные бюджета' : 'Создайте новый бюджет для планирования расходов'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название бюджета *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Маркетинг Q1 2024"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Тип бюджета</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_TYPES.map((type) => (
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

          {/* Статус и сумма */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Сумма бюджета *</Label>
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
          </div>

          {/* Валюта и категория */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Маркетинг, Разработка, Операции"
              />
            </div>
          </div>

          {/* Даты */}
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="endDate">Дата окончания</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                placeholder="Описание бюджета и его цели"
                rows={3}
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

export function BudgetManagement() {
  const { budgets, deleteBudget } = useFinance();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const getStatusInfo = (status: string) => {
    return BUDGET_STATUSES.find(s => s.value === status) || BUDGET_STATUSES[0];
  };

  const getTypeInfo = (type: string) => {
    return BUDGET_TYPES.find(t => t.value === type) || BUDGET_TYPES[0];
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await deleteBudget(budgetId);
      toast({
        title: 'Бюджет удален',
        description: 'Бюджет успешно удален'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить бюджет',
        variant: 'destructive'
      });
    }
  };

  const calculateProgress = (budget: Budget) => {
    // В реальном приложении здесь был бы расчет потраченной суммы
    const spent = Math.random() * budget.amount; // Заглушка
    const percentage = (spent / budget.amount) * 100;
    return {
      spent,
      percentage: Math.min(percentage, 100),
      remaining: budget.amount - spent
    };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой добавления */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление бюджетом</h2>
          <p className="text-muted-foreground">Планирование и отслеживание бюджета</p>
        </div>
        <BudgetDialog />
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего бюджетов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {budgets.filter(budget => budget.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Превышены</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {budgets.filter(budget => budget.status === 'exceeded').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budgets.reduce((sum, budget) => sum + budget.amount, 0).toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Карточки бюджетов */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const statusInfo = getStatusInfo(budget.status);
          const typeInfo = getTypeInfo(budget.type);
          const TypeIcon = typeInfo.icon;
          const progress = calculateProgress(budget);
          
          return (
            <Card key={budget.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-5 w-5" />
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBudget(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                  <Badge variant="outline">
                    {typeInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Прогресс */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Потрачено</span>
                      <span className="font-medium">
                        {progress.spent.toLocaleString('ru-RU')} ₽ / {budget.amount.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <Progress 
                      value={progress.percentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.percentage.toFixed(1)}% использовано</span>
                      <span>Осталось: {progress.remaining.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>

                  {/* Детали */}
                  <div className="space-y-2 text-sm">
                    {budget.category && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Категория:</span>
                        <span>{budget.category}</span>
                      </div>
                    )}
                    {budget.start_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Начало:</span>
                        <span>{format(new Date(budget.start_date), 'dd.MM.yyyy', { locale: ru })}</span>
                      </div>
                    )}
                    {budget.end_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Окончание:</span>
                        <span>{format(new Date(budget.end_date), 'dd.MM.yyyy', { locale: ru })}</span>
                      </div>
                    )}
                  </div>

                  {/* Предупреждения */}
                  {progress.percentage >= 90 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">Бюджет почти исчерпан!</span>
                    </div>
                  )}
                  {progress.percentage >= 100 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">Бюджет превышен!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Диалог редактирования */}
      {selectedBudget && (
        <BudgetDialog
          budget={selectedBudget}
          onSuccess={() => setSelectedBudget(null)}
        />
      )}
    </div>
  );
}
