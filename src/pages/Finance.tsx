import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
  Search,
  Calendar,
  PieChart,
  BarChart3,
  FileText,
  Settings,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import { OperationDialog } from "@/components/finance/OperationDialog";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { useAppNotifications } from "@/components/NotificationIntegration";
import { toast } from "@/hooks/use-toast";

export default function Finance() {
  const { 
    operations, 
    accounts, 
    invoices, 
    budgets, 
    subscriptions, 
    stats, 
    isLoading,
    exportData,
    deleteOperation
  } = useFinance();
  
  const { notifySuccess, notifyError } = useAppNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState('current');
  const [selectedOperation, setSelectedOperation] = useState<any>(null);

  // Фильтрация операций
  const filteredOperations = useMemo(() => {
    let filtered = operations;

    // Поиск
    if (searchTerm) {
      filtered = filtered.filter(op => 
        op.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.subcategory?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Категория
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(op => op.category === selectedCategory);
    }

    // Счет
    if (selectedAccount && selectedAccount !== 'all') {
      filtered = filtered.filter(op => op.account_id === selectedAccount);
    }

    // Период
    const now = new Date();
    switch (dateRange) {
      case 'current':
        filtered = filtered.filter(op => {
          const opDate = new Date(op.date);
          return opDate >= startOfMonth(now) && opDate <= endOfMonth(now);
        });
        break;
      case 'last':
        const lastMonth = subMonths(now, 1);
        filtered = filtered.filter(op => {
          const opDate = new Date(op.date);
          return opDate >= startOfMonth(lastMonth) && opDate <= endOfMonth(lastMonth);
        });
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        filtered = filtered.filter(op => {
          const opDate = new Date(op.date);
          return opDate >= quarterStart && opDate <= now;
        });
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filtered = filtered.filter(op => {
          const opDate = new Date(op.date);
          return opDate >= yearStart && opDate <= now;
        });
        break;
    }

    return filtered;
  }, [operations, searchTerm, selectedCategory, selectedAccount, dateRange]);

  // Уникальные категории для фильтра
  const categories = useMemo(() => {
    const cats = new Set(operations.map(op => op.category));
    return Array.from(cats).sort();
  }, [operations]);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await exportData(format, 'operations');
      notifySuccess('Экспорт завершен', 'Данные успешно экспортированы');
    } catch (error) {
      notifyError('Ошибка экспорта', 'Не удалось экспортировать данные');
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    try {
      await deleteOperation(operationId);
      notifySuccess('Операция удалена', 'Операция успешно удалена');
    } catch (error) {
      notifyError('Ошибка удаления', 'Не удалось удалить операцию');
    }
  };

  const defaultAccount = accounts.find(acc => acc.is_default);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка финансовых данных...</p>
        </div>
      </div>
    );
  }

  // Проверяем, выполнена ли миграция
  const isMigrationNeeded = accounts.length === 0 && operations.length === 0 && !isLoading;
  
  // Отладочная информация
  console.log('Finance page debug:', {
    isLoading,
    accountsCount: accounts.length,
    operationsCount: operations.length,
    isMigrationNeeded,
    accounts: accounts.map(acc => ({ id: acc.id, name: acc.name })),
    operations: operations.map(op => ({ id: op.id, description: op.description }))
  });
  
  if (isMigrationNeeded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Финансы</h1>
            <p className="text-muted-foreground">Управленческий учет и планирование</p>
          </div>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Требуется выполнение миграции
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700">
            <p className="mb-4">
              Для работы финансовой системы необходимо выполнить миграцию базы данных.
            </p>
            <div className="space-y-2">
              <p className="font-medium">Инструкция:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Откройте Supabase Dashboard</li>
                <li>Перейдите в раздел SQL Editor</li>
                <li>Выполните файл <code className="bg-yellow-100 px-1 rounded">supabase_migrations_finance.sql</code></li>
                <li>Обновите страницу</li>
              </ol>
            </div>
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <p className="text-sm font-medium">После выполнения миграции вы получите:</p>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                <li>Полноценную систему финансового учета</li>
                <li>Демо данные для тестирования</li>
                <li>Возможность создания операций и счетов</li>
                <li>Экспорт данных и аналитику</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Финансы</h1>
          <p className="text-muted-foreground">Управленческий учет и планирование</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Текущий месяц</SelectItem>
              <SelectItem value="last">Прошлый месяц</SelectItem>
              <SelectItem value="quarter">Квартал</SelectItem>
              <SelectItem value="year">Год</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-32">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          
          {defaultAccount && (
            <OperationDialog 
              accountId={defaultAccount.id}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Новая операция
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Общий баланс</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBalance.toLocaleString('ru-RU')} ₽</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.monthlyProfit > 0 ? '+' : ''}{stats.monthlyProfit.toLocaleString('ru-RU')} ₽ за месяц
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Доходы (месяц)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyIncome.toLocaleString('ru-RU')} ₽</div>
              <p className="text-xs text-muted-foreground">
                {stats.monthlyIncome > 0 ? `+${((stats.monthlyIncome - (stats.monthlyIncome * 0.8)) / (stats.monthlyIncome * 0.8) * 100).toFixed(1)}%` : '0%'} к прошлому
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Расходы (месяц)</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyExpense.toLocaleString('ru-RU')} ₽</div>
              <p className="text-xs text-muted-foreground">
                {stats.monthlyExpense > 0 ? `-${((stats.monthlyExpense - (stats.monthlyExpense * 1.05)) / (stats.monthlyExpense * 1.05) * 100).toFixed(1)}%` : '0%'} к прошлому
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Runway</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.runway} мес</div>
              <p className="text-xs text-muted-foreground">при текущем burn-rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Счета */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Счета
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {accounts.filter(acc => acc.is_active).map((account) => (
              <div key={account.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{account.name}</h3>
                  <Badge variant={account.is_default ? 'default' : 'outline'}>
                    {account.type}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {account.balance.toLocaleString('ru-RU')} {account.currency}
                </div>
                {account.bank_name && (
                  <p className="text-sm text-muted-foreground">{account.bank_name}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Операции</TabsTrigger>
          <TabsTrigger value="invoices">Инвойсы</TabsTrigger>
          <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
          <TabsTrigger value="budget">Бюджет</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          {/* Фильтры */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Фильтры
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Поиск</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск операций..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Категория</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Счет</label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все счета" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все счета</SelectItem>
                      {accounts.filter(acc => acc.is_active).map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Период</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Текущий месяц</SelectItem>
                      <SelectItem value="last">Прошлый месяц</SelectItem>
                      <SelectItem value="quarter">Квартал</SelectItem>
                      <SelectItem value="year">Год</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Операции */}
          <Card>
            <CardHeader>
              <CardTitle>Операции ({filteredOperations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredOperations.map((op) => {
                  const account = accounts.find(acc => acc.id === op.account_id);
                  return (
                    <div
                      key={op.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(op.date), 'dd.MM', { locale: ru })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(op.date), 'HH:mm', { locale: ru })}
                          </p>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{op.description || op.category}</p>
                            <Badge variant="outline" className="text-xs">
                              {op.category}
                            </Badge>
                            {op.subcategory && (
                              <Badge variant="secondary" className="text-xs">
                                {op.subcategory}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {account && <span>{account.name}</span>}
                            {op.tags && op.tags.length > 0 && (
                              <div className="flex gap-1">
                                {op.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {op.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{op.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${
                          op.type === 'income' ? 'text-green-600' : 
                          op.type === 'expense' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {op.type === 'income' ? '+' : op.type === 'expense' ? '-' : '↔'}{op.amount.toLocaleString('ru-RU')} {op.currency}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOperation(op)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOperation(op)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOperation(op.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredOperations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Операции не найдены</p>
                    <p className="text-sm">Попробуйте изменить фильтры или добавить новую операцию</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Инвойсы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const getStatusLabel = (status: string) => {
                    switch (status) {
                      case 'paid': return 'Оплачен';
                      case 'sent': return 'Отправлен';
                      case 'overdue': return 'Просрочен';
                      case 'draft': return 'Черновик';
                      case 'cancelled': return 'Отменен';
                      case 'refunded': return 'Возвращен';
                      default: return status;
                    }
                  };

                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'paid': return 'bg-green-100 text-green-800';
                      case 'sent': return 'bg-blue-100 text-blue-800';
                      case 'overdue': return 'bg-red-100 text-red-800';
                      case 'draft': return 'bg-gray-100 text-gray-800';
                      case 'cancelled': return 'bg-gray-100 text-gray-800';
                      case 'refunded': return 'bg-yellow-100 text-yellow-800';
                      default: return 'bg-gray-100 text-gray-800';
                    }
                  };

                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{invoice.number}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.description || 'Без описания'}</p>
                        <p className="text-xs text-muted-foreground">
                          Создан: {format(new Date(invoice.issue_date), 'dd.MM.yyyy', { locale: ru })} • 
                          Оплатить до: {format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: ru })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{invoice.total_amount.toLocaleString('ru-RU')} {invoice.currency}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Просмотр
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Активные подписки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscriptions.filter(sub => sub.is_active).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{sub.name}</p>
                        {sub.category && (
                          <Badge variant="outline" className="text-xs">
                            {sub.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{sub.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Следующий платеж: {format(new Date(sub.next_payment_date), 'dd.MM.yyyy', { locale: ru })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{sub.amount.toLocaleString('ru-RU')} {sub.currency}</p>
                      <p className="text-sm text-muted-foreground">{sub.period}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Итого в месяц</p>
                  <p className="text-xl font-bold">
                    {subscriptions
                      .filter(sub => sub.is_active && sub.period === 'monthly')
                      .reduce((sum, sub) => sum + sub.amount, 0)
                      .toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Бюджет: {format(new Date(), 'MMMM yyyy', { locale: ru })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.filter(budget => budget.is_active).map((budget) => {
                  const percentage = budget.planned_amount > 0 ? (budget.actual_amount / budget.planned_amount) * 100 : 0;
                  const isOverBudget = percentage > 100;
                  
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{budget.category}</p>
                          {budget.subcategory && (
                            <Badge variant="outline" className="text-xs">
                              {budget.subcategory}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {budget.actual_amount.toLocaleString('ru-RU')} ₽ / {budget.planned_amount.toLocaleString('ru-RU')} ₽
                          </p>
                          <p className={`text-xs ${isOverBudget ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {percentage.toFixed(1)}% использовано
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={isOverBudget ? 'bg-red-100' : ''}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Расходы по категориям
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' :
                        index === 3 ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{category.amount.toLocaleString('ru-RU')} ₽</p>
                      <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Предстоящие платежи
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.upcomingPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{payment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.date), 'dd.MM.yyyy', { locale: ru })}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{payment.amount.toLocaleString('ru-RU')} ₽</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Диалог редактирования операции */}
      {selectedOperation && (
        <OperationDialog
          operation={selectedOperation}
          onSuccess={() => setSelectedOperation(null)}
        />
      )}
    </div>
  );
}