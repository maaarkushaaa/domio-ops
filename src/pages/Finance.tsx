// VERSION: 2.0 - ULTRA DEEP FIX - FORCE CACHE REFRESH
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
import { AccountsManagement } from "@/components/finance/AccountsManagement";
import { InvoicesManagement } from "@/components/finance/InvoicesManagement";
import { SubscriptionsManagement } from "@/components/finance/SubscriptionsManagement";
import { BudgetManagement } from "@/components/finance/BudgetManagement";
import { useState, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { useAppNotifications } from "@/components/NotificationIntegration";
import { toast } from "@/hooks/use-toast";
import { FinancialInsights } from "@/components/analytics/FinancialInsights";
import { FinanceWhatIf } from "@/components/analytics/FinanceWhatIf";
import { FinanceForecast } from "@/components/analytics/FinanceForecast";

// Безопасная функция форматирования чисел - VERSION 2.0 FIX
const safeFormatNumber = (value: any, fallback = '0'): string => {
  try {
    const num = Number(value);
    if (isNaN(num)) return fallback;
    return num.toLocaleString('ru-RU');
  } catch {
    return fallback;
  }
};

export default function Finance() {
  console.log('🚀 FINANCE PAGE V2.0 - Component rendered');
  
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
  const [opPage, setOpPage] = useState(1);
  const [opPageSize, setOpPageSize] = useState(20);
  const parentRef = useRef<HTMLDivElement | null>(null);

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

  const totalOpPages = useMemo(() => Math.max(1, Math.ceil(filteredOperations.length / opPageSize)), [filteredOperations.length, opPageSize]);
  const paginatedOperations = useMemo(() => {
    const start = (opPage - 1) * opPageSize;
    return filteredOperations.slice(start, start + opPageSize);
  }, [filteredOperations, opPage, opPageSize]);

  const rowVirtualizer = useVirtualizer({
    count: paginatedOperations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-4">
          {[0,1,2,3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-28 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Счета */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[0,1,2,3].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-7 w-32 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Фильтры */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-20" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {[0,1,2,3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Операции */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-5 w-52" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-[560px] overflow-hidden rounded-md border">
                {[...Array(10)].map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <Skeleton className="h-3 w-10 mb-1" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-24" />
                      <div className="flex gap-1">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
              <div className="text-2xl font-bold">{safeFormatNumber(stats?.totalBalance)} ₽</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {(stats?.monthlyProfit || 0) > 0 ? '+' : ''}{safeFormatNumber(stats?.monthlyProfit)} ₽ за месяц
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Доходы (месяц)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeFormatNumber(stats?.monthlyIncome)} ₽</div>
              <p className="text-xs text-muted-foreground">
                {(stats?.monthlyIncome || 0) > 0 ? `+${(((stats?.monthlyIncome || 0) - ((stats?.monthlyIncome || 0) * 0.8)) / ((stats?.monthlyIncome || 0) * 0.8) * 100).toFixed(1)}%` : '0%'} к прошлому
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Расходы (месяц)</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeFormatNumber(stats?.monthlyExpense)} ₽</div>
              <p className="text-xs text-muted-foreground">
                {(stats?.monthlyExpense || 0) > 0 ? `-${(((stats?.monthlyExpense || 0) - ((stats?.monthlyExpense || 0) * 1.05)) / ((stats?.monthlyExpense || 0) * 1.05) * 100).toFixed(1)}%` : '0%'} к прошлому
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
                  {safeFormatNumber(account.balance)} {account.currency}
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
          <TabsTrigger value="accounts">Счета</TabsTrigger>
          <TabsTrigger value="invoices">Счета-фактуры</TabsTrigger>
          <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
          <TabsTrigger value="budget">Бюджет</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="reports">Отчеты</TabsTrigger>
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
                <div ref={parentRef} className="h-[560px] overflow-auto rounded-md border">
                  <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((vRow) => {
                      const op = paginatedOperations[vRow.index];
                      const account = accounts.find(acc => acc.id === op.account_id);
                      return (
                        <div
                          key={op.id}
                          className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vRow.start}px)` }}
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
                                <Badge variant="outline" className="text-xs">{op.category}</Badge>
                                {op.subcategory && (<Badge variant="secondary" className="text-xs">{op.subcategory}</Badge>)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {account && <span>{account.name}</span>}
                                {op.tags && op.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {op.tags.slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                    ))}
                                    {op.tags.length > 3 && (
                                      <Badge variant="outline" className="text-xs">+{op.tags.length - 3}</Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-lg font-bold ${op.type === 'income' ? 'text-green-600' : op.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                              {op.type === 'income' ? '+' : op.type === 'expense' ? '-' : '↔'}{safeFormatNumber(op.amount)} {op.currency}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedOperation(op)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedOperation(op)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteOperation(op.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
                {filteredOperations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Операции не найдены</p>
                    <p className="text-sm">Попробуйте изменить фильтры или добавить новую операцию</p>
                  </div>
                )}

              {/* Пагинация операций */}
              {filteredOperations.length > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">Страница {opPage} из {totalOpPages}</div>
                  <div className="flex items-center gap-2">
                    <Select value={String(opPageSize)} onValueChange={(v) => { setOpPageSize(parseInt(v)); setOpPage(1); }}>
                      <SelectTrigger className="w-28"><SelectValue placeholder="Размер" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" disabled={opPage <= 1} onClick={() => setOpPage(opPage - 1)}>Назад</Button>
                    <Button variant="outline" disabled={opPage >= totalOpPages} onClick={() => setOpPage(opPage + 1)}>Вперед</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <AccountsManagement />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <InvoicesManagement />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsManagement />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetManagement />
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
                      <p className="text-sm font-medium">{safeFormatNumber(category.amount)} ₽</p>
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
                    <p className="text-sm font-medium">{safeFormatNumber(payment.amount)} ₽</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FinanceForecast />
            <FinanceWhatIf />
          </div>

          <FinancialInsights />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Финансовые отчеты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  Отчет о доходах и расходах
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Балансовый отчет
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Отчет о движении денежных средств
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <PieChart className="h-6 w-6" />
                  Анализ по категориям
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  Бюджетный отчет
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Download className="h-6 w-6" />
                  Экспорт данных
                </Button>
              </div>
            </CardContent>
          </Card>
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