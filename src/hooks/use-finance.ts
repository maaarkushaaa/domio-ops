// VERSION: 2.0 - ULTRA DEEP FIX - FORCE CACHE REFRESH
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

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
  period: 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'daily';
  next_payment_date: string;
  is_active: boolean;
  auto_renewal: boolean;
  category?: string;
  provider?: string;
  account_id?: string;
  notes?: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface FinancialReport {
  id: string;
  type: string;
  period: string;
  data: any;
  created_at: string;
  created_by: string;
}

export const useFinance = () => {
  const { user } = useAuth();
  const [operations, setOperations] = useState<FinancialOperation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных
  const lastLoadAtRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    // Throttle frequent load requests (e.g., from realtime bursts)
    if (now - (lastLoadAtRef.current || 0) < 800) {
      return;
    }
    lastLoadAtRef.current = now;

    try {
      setIsLoading(true);
      setError(null);

      // Загружаем только существующие таблицы
      console.log('Starting to load finance data for user:', user?.id);

      const [operationsRes, accountsRes] = await Promise.allSettled([
        supabase.from('financial_operations').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*').order('created_at', { ascending: false })
      ]);

      // Обрабатываем результаты
      const operations = operationsRes.status === 'fulfilled' && !operationsRes.value.error
        ? operationsRes.value.data || []
        : [];

      const accounts = accountsRes.status === 'fulfilled' && !accountsRes.value.error
        ? accountsRes.value.data || []
        : [];

      setOperations(operations);
      setAccounts(accounts);

      console.log('Finance data loaded:', {
        operationsCount: operations.length,
        accountsCount: accounts.length,
        accounts: accounts.map(acc => ({ id: acc.id, name: acc.name, is_default: acc.is_default }))
      });

      // Логируем ошибки для отладки
      if (operationsRes.status === 'rejected' || (operationsRes.status === 'fulfilled' && operationsRes.value.error)) {
        console.warn('Financial operations table not found - migration may not be executed');
      }
      if (accountsRes.status === 'rejected' || (accountsRes.status === 'fulfilled' && accountsRes.value.error)) {
        console.warn('Accounts table not found - migration may not be executed');
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

  // Загрузка данных при монтировании
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 FINANCE HOOK - Loading data for user:', user.id);
      loadData();
    }
  }, [user?.id]);

  return {
    // Данные
    operations,
    accounts,
    stats: {
      totalBalance,
      monthlyIncome,
      monthlyExpense: monthlyExpenses,
      monthlyProfit: monthlyNetIncome,
      runway: monthlyExpenses > 0 ? Math.round(totalBalance / monthlyExpenses) : 0,
      topCategories: [],
      recentOperations: operations.slice(0, 10),
      upcomingPayments: []
    },

    // Состояние
    isLoading,
    error,

    // Расчеты
    totalIncome,
    totalExpenses,
    netIncome,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyNetIncome,
    accountBalances,

    // Экспорт
    exportData: async (format: 'csv' | 'excel' | 'pdf') => {
      console.log('Export not implemented yet');
    },
    loadData
  };
};