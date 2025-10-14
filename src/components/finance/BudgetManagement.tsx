import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
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
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useFinance } from '@/hooks/use-finance';
import { useBudgetsQuery } from '@/hooks/finance-queries';
import type { Budget } from '@/hooks/use-finance';
import { useAppNotifications } from '@/components/NotificationIntegration';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { safeFormatNumber, safeFormatCurrency } from '@/utils/safeFormat';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Brush } from 'recharts';

interface BudgetDialogProps {
  budget?: Budget;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const PERIOD_TYPES = [
  { value: 'monthly', label: 'Ежемесячный', icon: Calendar },
  { value: 'quarterly', label: 'Квартальный', icon: Calendar },
  { value: 'yearly', label: 'Годовой', icon: Calendar }
];

export function BudgetDialog({ budget, trigger, onSuccess }: BudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Форма
  const [name, setName] = useState(budget?.name || '');
  const [category, setCategory] = useState(budget?.category || '');
  const [period, setPeriod] = useState<Budget['period']>(budget?.period || 'monthly');
  const [year, setYear] = useState<number>(budget?.year || new Date().getFullYear());
  const [month, setMonth] = useState<number | undefined>(budget?.month);
  const [quarter, setQuarter] = useState<number | undefined>(budget?.quarter);
  const [plannedAmount, setPlannedAmount] = useState<string>(
    (budget?.planned_amount ?? '').toString()
  );
  const [actualAmount, setActualAmount] = useState<string>(
    (budget?.actual_amount ?? '0').toString()
  );
  const [isActive, setIsActive] = useState<boolean>(budget?.is_active ?? true);

  const { createBudget, updateBudget } = useFinance();
  const { notifySuccess, notifyError } = useAppNotifications();

  const isEdit = !!budget;

  // Авто-открытие диалога при переданном бюджете (режим редактирования)
  useEffect(() => {
    if (budget) {
      setOpen(true);
    }
  }, [budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      name: z.string().min(1, 'Название обязательно'),
      category: z.string().optional().or(z.literal('')),
      period: z.enum(['monthly','quarterly','yearly']),
      year: z.number().int().gte(2000).lte(2100),
      month: z.number().int().min(1).max(12).optional(),
      quarter: z.number().int().min(1).max(4).optional(),
      planned_amount: z.preprocess((v) => Number(v), z.number().finite().nonnegative()),
      actual_amount: z.preprocess((v) => Number(v), z.number().finite().min(0).optional()),
      is_active: z.boolean(),
    }).refine(
      (val) => val.period !== 'monthly' || !!val.month,
      { message: 'Для ежемесячного периода укажите месяц', path: ['month'] }
    ).refine(
      (val) => val.period !== 'quarterly' || !!val.quarter,
      { message: 'Для квартального периода укажите квартал', path: ['quarter'] }
    );

    const parseResult = schema.safeParse({
      name: name.trim(),
      category: category.trim(),
      period,
      year,
      month,
      quarter,
      planned_amount: plannedAmount,
      actual_amount: actualAmount || '0',
      is_active: isActive,
    });

    if (!parseResult.success) {
      const firstErr = parseResult.error.issues[0];
      toast({ title: 'Ошибка', description: firstErr?.message || 'Проверьте поля формы', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const p = parseResult.data;
      const budgetData: any = {
        name: p.name,
        category: p.category || undefined,
        period: p.period,
        year: p.year,
        month: p.period === 'monthly' ? (p.month || new Date().getMonth() + 1) : undefined,
        quarter: p.period === 'quarterly' ? (p.quarter || Math.ceil((new Date().getMonth() + 1) / 3)) : undefined,
        planned_amount: p.planned_amount,
        actual_amount: Number(p.actual_amount || 0),
        is_active: p.is_active,
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
        setCategory('');
        setPlannedAmount('');
        setActualAmount('0');
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

  const selectedPeriod = PERIOD_TYPES.find(t => t.value === period);
  const TypeIcon = selectedPeriod?.icon || Target;

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
              <Label>Период</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Budget['period'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_TYPES.map((type) => (
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

          {/* Параметры периода и суммы */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Год</Label>
              <Input id="year" type="number" value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())} />
            </div>
            <div className="space-y-2">
              {period === 'monthly' && (
                <>
                  <Label htmlFor="month">Месяц (1-12)</Label>
                  <Input id="month" type="number" min={1} max={12}
                    value={month ?? ''}
                    onChange={(e) => setMonth(parseInt(e.target.value) || undefined)} />
                </>
              )}
              {period === 'quarterly' && (
                <>
                  <Label htmlFor="quarter">Квартал (1-4)</Label>
                  <Input id="quarter" type="number" min={1} max={4}
                    value={quarter ?? ''}
                    onChange={(e) => setQuarter(parseInt(e.target.value) || undefined)} />
                </>
              )}
            </div>
          </div>

          {/* Суммы и категория */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planned">Плановая сумма *</Label>
              <Input id="planned" type="number" step="0.01" value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual">Фактически потрачено</Label>
              <Input id="actual" type="number" step="0.01" value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* Категория и активность */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Input id="category" value={category}
                onChange={(e) => setCategory(e.target.value)} placeholder="Маркетинг" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mt-6">
                <input id="active" type="checkbox" className="h-4 w-4"
                  checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <Label htmlFor="active">Активный бюджет</Label>
              </div>
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
  const { budgets, deleteBudget, updateBudget, isLoading } = useBudgetsQuery();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const getStatusInfo = (b: Budget) => {
    const exceeded = (b.actual_amount || 0) > (b.planned_amount || 0);
    if (!b.is_active) return { label: 'Неактивный', color: 'bg-gray-100 text-gray-800' };
    if (exceeded) return { label: 'Превышен', color: 'bg-red-100 text-red-800' };
    return { label: 'Активный', color: 'bg-green-100 text-green-800' };
  };

  const getPeriodInfo = (period: Budget['period']) => {
    switch (period) {
      case 'monthly': return { label: 'Ежемесячный', icon: Calendar };
      case 'quarterly': return { label: 'Квартальный', icon: Calendar };
      case 'yearly': return { label: 'Годовой', icon: Calendar };
      default: return { label: String(period), icon: Calendar };
    }
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
    const planned = budget.planned_amount || 0;
    const spent = budget.actual_amount || 0;
    const percentage = planned > 0 ? (spent / planned) * 100 : 0;
    return {
      spent,
      percentage: Math.min(percentage, 100),
      remaining: Math.max(0, planned - spent)
    };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Простые графики: сумма бюджетов по типам (без внешних библиотек)
  const totalsByType = useMemo(() => {
    const map = budgets.reduce((acc, b) => {
      const key = b.period as string;
      acc[key] = (acc[key] || 0) + (b.planned_amount || 0);
      return acc;
    }, {} as Record<string, number>);
    const entries = Object.entries(map).sort((a, b) => (b[1] - a[1]));
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return { entries, max };
  }, [budgets]);

  const totalsByPeriod = useMemo(() => {
    const map = budgets.reduce((acc, b) => {
      const key = b.period as string;
      acc[key] = acc[key] || { period: key, planned: 0, actual: 0 };
      acc[key].planned += b.planned_amount || 0;
      acc[key].actual += b.actual_amount || 0;
      return acc;
    }, {} as Record<string, { period: string; planned: number; actual: number }>);
    return Object.values(map);
  }, [budgets]);

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { month: string; planned: number; actual: number }>();
    const add = (ym: string, planned: number, actual: number) => {
      if (!map.has(ym)) map.set(ym, { month: ym, planned: 0, actual: 0 });
      const obj = map.get(ym)!;
      obj.planned += planned;
      obj.actual += actual;
    };
    budgets.forEach(b => {
      const y = b.year;
      if (b.period === 'monthly' && b.month) {
        const ym = `${y}-${String(b.month).padStart(2, '0')}`;
        add(ym, b.planned_amount || 0, b.actual_amount || 0);
      } else if (b.period === 'quarterly' && b.quarter) {
        const firstMonth = (b.quarter - 1) * 3 + 1;
        const ym = `${y}-${String(firstMonth).padStart(2, '0')}`;
        add(ym, b.planned_amount || 0, b.actual_amount || 0);
      } else if (b.period === 'yearly') {
        const ym = `${y}-01`;
        add(ym, b.planned_amount || 0, b.actual_amount || 0);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [budgets]);

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
            <div className="text-2xl font-bold">{isLoading ? '—' : budgets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{isLoading ? '—' : budgets.filter(budget => budget.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Превышены</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{isLoading ? '—' : budgets.filter(budget => (budget.actual_amount || 0) > (budget.planned_amount || 0)).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '—' : safeFormatCurrency(budgets.reduce((sum, budget) => sum + (budget.planned_amount || 0), 0))}</div>
          </CardContent>
        </Card>
      </div>

      {/* Карточки бюджетов */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
          <>
            <Card className="animate-pulse h-48" />
            <Card className="animate-pulse h-48" />
            <Card className="animate-pulse h-48" />
          </>
        )}
        {!isLoading && budgets.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-10 text-center text-muted-foreground">Нет бюджетов. Создайте первый бюджет.</CardContent>
          </Card>
        )}
        {!isLoading && budgets.map((budget) => {
          const statusInfo = getStatusInfo(budget);
          const typeInfo = getPeriodInfo(budget.period);
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
                        {safeFormatCurrency(progress.spent)} / {safeFormatCurrency(budget.planned_amount || 0)}
                      </span>
                    </div>
                    <Progress 
                      value={progress.percentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.percentage.toFixed(1)}% использовано</span>
                      <span>Осталось: {safeFormatCurrency(progress.remaining)}</span>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Период:</span>
                      <span>{typeInfo.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Год:</span>
                      <span>{budget.year}</span>
                    </div>
                    {budget.period === 'monthly' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Месяц:</span>
                        <span>{budget.month}</span>
                      </div>
                    )}
                    {budget.period === 'quarterly' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Квартал:</span>
                        <span>{budget.quarter}</span>
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

      {/* Графики (Recharts) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">План/Факт по типу периода</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <div className="w-full h-full bg-muted animate-pulse rounded" />
            ) : totalsByPeriod.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Нет данных для графика</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalsByPeriod}>
                  <defs>
                    <linearGradient id="gradPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <RechartsTooltip formatter={(v: any) => safeFormatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="planned" name="План" fill="url(#gradPlanned)" />
                  <Bar dataKey="actual" name="Факт" fill="url(#gradActual)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Тренд план/факт по месяцам</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <div className="w-full h-full bg-muted animate-pulse rounded" />
            ) : monthlyTrend.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Нет данных для графика</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(v: any) => safeFormatCurrency(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="planned" name="План" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Факт" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Brush dataKey="month" height={20} travellerWidth={10} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Диалог редактирования */}
      {selectedBudget && (
        <BudgetDialog
          budget={selectedBudget}
          onSuccess={() => {
            setSelectedBudget(null);
          }}
        />
      )}
    </div>
  );
}
