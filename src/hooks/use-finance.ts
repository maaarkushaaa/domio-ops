// VERSION: 2.0 - ULTRA DEEP FIX - FORCE CACHE REFRESH
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface FinancialOperation {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  category: string;
  subcategory?: string;
  description?: string;
  date: string;
  account_id?: string;
  project_id?: string;
  client_id?: string;
  supplier_id?: string;
  invoice_id?: string;
  tags?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'investment' | 'crypto';
  currency: string;
  balance: number;
  is_default: boolean;
  is_active: boolean;
  bank_name?: string;
  account_number?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Invoice {
  id: string;
  number: string;
  type: 'invoice' | 'receipt' | 'estimate';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  client_id?: string;
  project_id?: string;
  description?: string;
  notes?: string;
  items?: any[];
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  year: number;
  month?: number;
  quarter?: number;
  planned_amount: number;
  actual_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Subscription {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  next_payment_date: string;
  is_active: boolean;
  auto_renewal: boolean;
  category?: string;
  provider?: string;
  account_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface FinancialStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyProfit: number;
  runway: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  recentOperations: FinancialOperation[];
  upcomingPayments: Array<{ name: string; amount: number; date: string }>;
}

export const useFinance = () => {
  const { user } = useAuth();
  const [operations, setOperations] = useState<FinancialOperation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Тестовый запрос для проверки таблиц
      console.log('Testing table existence...');
      const testAccounts = await supabase.from('accounts').select('count').limit(1);
      const testOperations = await supabase.from('financial_operations').select('count').limit(1);
      console.log('Table test results:', {
        accounts: testAccounts,
        operations: testOperations
      });

      // Загружаем все данные параллельно с обработкой ошибок
      console.log('Starting to load finance data for user:', user?.id);
      
      const [operationsRes, accountsRes, invoicesRes, budgetsRes, subscriptionsRes, reportsRes] = await Promise.allSettled([
        supabase.from('financial_operations').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').order('next_payment_date', { ascending: true }),
        supabase.from('financial_reports').select('*').order('created_at', { ascending: false })
      ]);

      // Детальная отладка каждого запроса
      console.log('Finance queries results:', {
        operations: operationsRes,
        accounts: accountsRes,
        invoices: invoicesRes,
        budgets: budgetsRes,
        subscriptions: subscriptionsRes,
        reports: reportsRes
      });

      // Обрабатываем результаты с fallback для отсутствующих таблиц
      const operations = operationsRes.status === 'fulfilled' && !operationsRes.value.error 
        ? operationsRes.value.data || [] 
        : [];
      
      const accounts = accountsRes.status === 'fulfilled' && !accountsRes.value.error 
        ? accountsRes.value.data || [] 
        : [];
      
      const invoices = invoicesRes.status === 'fulfilled' && !invoicesRes.value.error 
        ? invoicesRes.value.data || [] 
        : [];
      
      const budgets = budgetsRes.status === 'fulfilled' && !budgetsRes.value.error 
        ? budgetsRes.value.data || [] 
        : [];
      
      const subscriptions = subscriptionsRes.status === 'fulfilled' && !subscriptionsRes.value.error 
        ? subscriptionsRes.value.data || [] 
        : [];
      
      const financialReports = reportsRes.status === 'fulfilled' && !reportsRes.value.error 
        ? reportsRes.value.data || [] 
        : [];

      setOperations(operations);
      setAccounts(accounts);
      setInvoices(invoices);
      setBudgets(budgets);
      setSubscriptions(subscriptions);
      setFinancialReports(financialReports);

      // Отладочная информация
      console.log('Finance data loaded:', {
        operationsCount: operations.length,
        accountsCount: accounts.length,
        invoicesCount: invoices.length,
        budgetsCount: budgets.length,
        subscriptionsCount: subscriptions.length,
        reportsCount: financialReports.length,
        operations: operations.slice(0, 3).map(op => ({ id: op.id, description: op.description })),
        accounts: accounts.map(acc => ({ id: acc.id, name: acc.name, is_default: acc.is_default }))
      });

      // Вычисляем статистику
      calculateStats(operations, accounts, subscriptions);

      // Логируем ошибки для отладки
      if (operationsRes.status === 'rejected' || (operationsRes.status === 'fulfilled' && operationsRes.value.error)) {
        console.warn('Financial operations table not found - migration may not be executed');
      }
      if (accountsRes.status === 'rejected' || (accountsRes.status === 'fulfilled' && accountsRes.value.error)) {
        console.warn('Accounts table not found - migration may not be executed');
      }
      if (invoicesRes.status === 'rejected' || (invoicesRes.status === 'fulfilled' && invoicesRes.value.error)) {
        console.warn('Invoices table not found - migration may not be executed');
      }
      if (budgetsRes.status === 'rejected' || (budgetsRes.status === 'fulfilled' && budgetsRes.value.error)) {
        console.warn('Budgets table not found - migration may not be executed');
      }
      if (subscriptionsRes.status === 'rejected' || (subscriptionsRes.status === 'fulfilled' && subscriptionsRes.value.error)) {
        console.warn('Subscriptions table not found - migration may not be executed');
      }
      if (reportsRes.status === 'rejected' || (reportsRes.status === 'fulfilled' && reportsRes.value.error)) {
        console.warn('Financial reports table not found - migration may not be executed');
      }
    } catch (error) {
      console.error('Error loading finance data:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Вычисленные значения
  const totalIncome = useMemo(() => 
    operations.filter(op => op.type === 'income').reduce((sum, op) => sum + op.amount, 0),
    [operations]
  );

  const totalExpenses = useMemo(() => 
    operations.filter(op => op.type === 'expense').reduce((sum, op) => sum + op.amount, 0),
    [operations]
  );

  const netIncome = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const totalBalance = useMemo(() => 
    accounts.filter(acc => acc.is_active).reduce((sum, acc) => sum + acc.balance, 0),
    [accounts]
  );

  const monthlyIncome = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return operations
      .filter(op => {
        const opDate = new Date(op.date);
        return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear && op.type === 'income';
      })
      .reduce((sum, op) => sum + op.amount, 0);
  }, [operations]);

  const monthlyExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return operations
      .filter(op => {
        const opDate = new Date(op.date);
        return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear && op.type === 'expense';
      })
      .reduce((sum, op) => sum + op.amount, 0);
  }, [operations]);

  const monthlyNetIncome = useMemo(() => monthlyIncome - monthlyExpenses, [monthlyIncome, monthlyExpenses]);

  const categoryBreakdown = useMemo(() => {
    const breakdown = operations.reduce((acc, op) => {
      if (!acc[op.category]) {
        acc[op.category] = { income: 0, expense: 0 };
      }
      if (op.type === 'income') {
        acc[op.category].income += op.amount;
      } else {
        acc[op.category].expense += op.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return Object.entries(breakdown).map(([category, amounts]) => ({
      category,
      income: amounts.income,
      expense: amounts.expense,
      net: amounts.income - amounts.expense
    }));
  }, [operations]);

  const monthlyTrends = useMemo(() => {
    const trends = operations.reduce((acc, op) => {
      const month = new Date(op.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { income: 0, expense: 0 };
      }
      if (op.type === 'income') {
        acc[month].income += op.amount;
      } else {
        acc[month].expense += op.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amounts]) => ({
        month,
        income: amounts.income,
        expense: amounts.expense,
        net: amounts.income - amounts.expense
      }));
  }, [operations]);

  const accountBalances = useMemo(() => 
    accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      balance: acc.balance,
      currency: acc.currency,
      type: acc.type
    })),
    [accounts]
  );

  const upcomingPayments = useMemo(() => 
    subscriptions
      .filter(sub => sub.status === 'active')
      .map(sub => ({
        name: sub.name,
        amount: sub.amount,
        date: sub.next_payment_date
      })),
    [subscriptions]
  );

  const overdueInvoices = useMemo(() => 
    invoices
      .filter(inv => inv.status === 'overdue' || (inv.status === 'sent' && new Date(inv.due_date) < new Date()))
      .map(inv => ({
        id: inv.id,
        number: inv.number,
        amount: inv.total_amount,
        dueDate: inv.due_date
      })),
    [invoices]
  );

  const budgetStatus = useMemo(() => 
    budgets.map(budget => ({
      id: budget.id,
      category: budget.category || 'Общий',
      budget: budget.amount,
      spent: Math.random() * budget.amount, // Заглушка - в реальном приложении здесь был бы расчет
      percentage: Math.random() * 100 // Заглушка
    })),
    [budgets]
  );

  // Вычисление статистики
  const calculateStats = useCallback((ops: FinancialOperation[], accs: Account[], subs: Subscription[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyOps = ops.filter(op => {
      const opDate = new Date(op.date);
      return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyOps
      .filter(op => op.type === 'income')
      .reduce((sum, op) => sum + op.amount, 0);

    const monthlyExpense = monthlyOps
      .filter(op => op.type === 'expense')
      .reduce((sum, op) => sum + op.amount, 0);

    const totalBalance = accs
      .filter(acc => acc.is_active)
      .reduce((sum, acc) => sum + acc.balance, 0);

    const monthlyProfit = monthlyIncome - monthlyExpense;
    const runway = monthlyExpense > 0 ? Math.round(totalBalance / monthlyExpense) : 0;

    // Топ категории
    const categoryStats = monthlyOps.reduce((acc, op) => {
      if (!acc[op.category]) {
        acc[op.category] = { amount: 0, count: 0 };
      }
      acc[op.category].amount += op.amount;
      acc[op.category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    const topCategories = Object.entries(categoryStats)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: monthlyExpense > 0 ? (data.amount / monthlyExpense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Предстоящие платежи
    const upcomingPayments = subs
      .filter(sub => sub.is_active)
      .map(sub => ({
        name: sub.name,
        amount: sub.amount,
        date: sub.next_payment_date
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    setStats({
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyProfit,
      runway,
      topCategories,
      recentOperations: ops.slice(0, 10),
      upcomingPayments
    });
  }, []);

  // CRUD операции
  const createOperation = async (operation: Omit<FinancialOperation, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('financial_operations')
        .insert({
          ...operation,
          created_by: user?.id,
          updated_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setOperations(prev => [data, ...prev]);
      
      // Обновляем баланс счета
      if (operation.account_id) {
        await updateAccountBalance(operation.account_id, operation.type, operation.amount);
      }

      // Пересчитываем статистику
      calculateStats([data, ...operations], accounts, subscriptions);

      return data;
    } catch (error) {
      console.error('Error creating operation:', error);
      throw error;
    }
  };

  const updateOperation = async (id: string, updates: Partial<FinancialOperation>) => {
    try {
      const { data, error } = await supabase
        .from('financial_operations')
        .update({
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setOperations(prev => prev.map(op => op.id === id ? data : op));
      return data;
    } catch (error) {
      console.error('Error updating operation:', error);
      throw error;
    }
  };

  const deleteOperation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_operations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOperations(prev => prev.filter(op => op.id !== id));
    } catch (error) {
      console.error('Error deleting operation:', error);
      throw error;
    }
  };

  const createAccount = async (account: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          ...account,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    console.log('🔧 FINANCE V4.0 - Updating account:', id, updates);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => prev.map(acc => acc.id === id ? data : acc));
      console.log('✅ FINANCE V7.0 - Account updated successfully:', data);
      
      // Принудительно перезагружаем данные для обновления интерфейса
      console.log('🔄 FINANCE V7.0 - Reloading data to update UI');
      await loadData();
      console.log('✅ FINANCE V7.0 - Data reloaded successfully');
      
      return data;
    } catch (error) {
      console.error('❌ FINANCE V4.0 - Error updating account:', error);
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const updateAccountBalance = async (accountId: string, operationType: string, amount: number) => {
    try {
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) return;

      const balanceChange = operationType === 'income' ? amount : -amount;
      const newBalance = account.balance + balanceChange;

      const { error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, balance: newBalance } : acc
      ));
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  };

  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoice,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setInvoices(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    console.log('🔧 FINANCE V4.0 - Updating invoice:', id, updates);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInvoices(prev => prev.map(inv => inv.id === id ? data : inv));
      console.log('✅ FINANCE V7.0 - Invoice updated successfully:', data);
      
      // Принудительно перезагружаем данные для обновления интерфейса
      console.log('🔄 FINANCE V7.0 - Reloading data to update UI');
      await loadData();
      console.log('✅ FINANCE V7.0 - Data reloaded successfully');
      
      return data;
    } catch (error) {
      console.error('❌ FINANCE V4.0 - Error updating invoice:', error);
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };

  const createBudget = async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          ...budget,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setBudgets(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  };

  const createSubscription = async (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...subscription,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setSubscriptions(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSubscriptions(prev => prev.map(sub => sub.id === id ? data : sub));
      
      // Принудительно перезагружаем данные для обновления интерфейса
      console.log('🔄 FINANCE V7.0 - Reloading data to update UI');
      await loadData();
      console.log('✅ FINANCE V7.0 - Data reloaded successfully');
      
      return data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBudgets(prev => prev.map(budget => budget.id === id ? data : budget));
      
      // Принудительно перезагружаем данные для обновления интерфейса
      console.log('🔄 FINANCE V7.0 - Reloading data to update UI');
      await loadData();
      console.log('✅ FINANCE V7.0 - Data reloaded successfully');
      
      return data;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBudgets(prev => prev.filter(budget => budget.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  const createFinancialReport = async (report: Omit<FinancialReport, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .insert({
          ...report,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setFinancialReports(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating financial report:', error);
      throw error;
    }
  };

  // Экспорт данных
  const exportData = async (format: 'csv' | 'excel' | 'pdf', type: 'operations' | 'invoices' | 'budgets' | 'all') => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'operations':
          data = operations;
          filename = 'financial_operations';
          break;
        case 'invoices':
          data = invoices;
          filename = 'invoices';
          break;
        case 'budgets':
          data = budgets;
          filename = 'budgets';
          break;
        case 'all':
          data = { operations, accounts, invoices, budgets, subscriptions };
          filename = 'financial_data';
          break;
      }

      if (format === 'csv') {
        const csv = convertToCSV(data);
        downloadFile(csv, `${filename}.csv`, 'text/csv');
      } else if (format === 'excel') {
        // Здесь можно добавить экспорт в Excel
        console.log('Excel export not implemented yet');
      } else if (format === 'pdf') {
        // Здесь можно добавить экспорт в PDF
        console.log('PDF export not implemented yet');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Загрузка данных при монтировании - VERSION 4.0 FIX - ОДИН РАЗ
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 FINANCE HOOK V4.0 - Loading data ONCE for user:', user.id);
      loadData();
    }
  }, [user?.id]); // Зависим только от user.id, загружаем ОДИН РАЗ

  // Realtime подписки (временно отключены для устранения множественных перезагрузок)
  // useEffect(() => {
  //   if (!user) return;

  //   const operationsChannel = supabase
  //     .channel('financial_operations_changes')
  //     .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_operations' }, () => {
  //       loadData();
  //     })
  //     .subscribe();

  //   const accountsChannel = supabase
  //     .channel('accounts_changes')
  //     .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
  //       loadData();
  //     })
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(operationsChannel);
  //     supabase.removeChannel(accountsChannel);
  //   };
  // }, [user, loadData]);

  return {
    // Данные
    operations,
    accounts,
    invoices,
    budgets,
    subscriptions,
    financialReports,
    stats,
    
    // Состояние
    isLoading,
    error,
    
    // Операции
    createOperation,
    updateOperation,
    deleteOperation,
    
    // Счета
    createAccount,
    updateAccount,
    deleteAccount,
    updateAccountBalance,
    
    // Инвойсы
    createInvoice,
    updateInvoice,
    deleteInvoice,
    
    // Бюджеты
    createBudget,
    updateBudget,
    deleteBudget,
    
    // Подписки
    createSubscription,
    updateSubscription,
    deleteSubscription,
    
    // Отчеты
    createFinancialReport,
    
    // Расчеты
    totalIncome,
    totalExpenses,
    netIncome,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyNetIncome,
    categoryBreakdown,
    monthlyTrends,
    accountBalances,
    upcomingPayments,
    overdueInvoices,
    budgetStatus,
    
    // Экспорт
    exportData,
    loadData
  };
};