import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice, Budget, Subscription, Account } from '@/hooks/use-finance';

// Query Keys
const qk = {
  invoices: ['invoices'] as const,
  budgets: ['budgets'] as const,
  subscriptions: ['subscriptions'] as const,
  accounts: ['accounts'] as const,
};

export function useInvoicesQuery() {
  const queryClient = useQueryClient();

  // List
  const invoicesQuery = useQuery({
    queryKey: qk.invoices,
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  // Create
  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert({ ...payload })
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invoices });
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invoices });
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invoices });
    },
  });

  return {
    invoices: invoicesQuery.data || [],
    isLoading: invoicesQuery.isLoading,
    isError: invoicesQuery.isError,
    refetch: invoicesQuery.refetch,
    createInvoice: createMutation.mutateAsync,
    updateInvoice: async (id: string, updates: Partial<Invoice>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteInvoice: deleteMutation.mutateAsync,
  };
}

export function useInvoicesQueryPaged(initialPage = 1, initialPageSize = 20) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const listQuery = useQuery({
    queryKey: [...qk.invoices, 'paged', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: (data || []) as Invoice[], count: count as number | null };
    },
    keepPreviousData: true,
    staleTime: 15_000,
  });

  const totalCount = listQuery.data?.count ?? 0;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .insert({ ...payload })
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invoices });
      queryClient.invalidateQueries({ queryKey: [...qk.invoices, 'paged'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invoices });
      queryClient.invalidateQueries({ queryKey: [...qk.invoices, 'paged'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invoices });
      queryClient.invalidateQueries({ queryKey: [...qk.invoices, 'paged'] });
    },
  });

  return {
    invoices: listQuery.data?.rows ?? [],
    totalCount,
    totalPages,
    page,
    pageSize,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    setPage: (p: number) => setPage(Math.max(1, p)),
    setPageSize: (s: number) => {
      const size = Math.max(1, s);
      setPageSize(size);
      setPage(1);
    },
    createInvoice: createMutation.mutateAsync,
    updateInvoice: async (id: string, updates: Partial<Invoice>) => updateMutation.mutateAsync({ id, updates }),
    deleteInvoice: deleteMutation.mutateAsync,
  } as const;
}

export function useSubscriptionsQuery() {
  const queryClient = useQueryClient();

  const subscriptionsQuery = useQuery({
    queryKey: qk.subscriptions,
    queryFn: async (): Promise<Subscription[]> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('next_payment_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({ ...payload })
        .select()
        .single();
      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.subscriptions }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Subscription> }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.subscriptions }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.subscriptions }),
  });

  return {
    subscriptions: subscriptionsQuery.data || [],
    isLoading: subscriptionsQuery.isLoading,
    isError: subscriptionsQuery.isError,
    refetch: subscriptionsQuery.refetch,
    createSubscription: createMutation.mutateAsync,
    updateSubscription: async (id: string, updates: Partial<Subscription>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteSubscription: deleteMutation.mutateAsync,
  };
}

export function useAccountsQuery() {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: qk.accounts,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...payload })
        .select()
        .single();
      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.accounts }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Account> }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.accounts }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.accounts }),
  });

  return {
    accounts: accountsQuery.data || [],
    isLoading: accountsQuery.isLoading,
    isError: accountsQuery.isError,
    refetch: accountsQuery.refetch,
    createAccount: createMutation.mutateAsync,
    updateAccount: async (id: string, updates: Partial<Account>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteAccount: deleteMutation.mutateAsync,
  };
}

export function useBudgetsQuery() {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: qk.budgets,
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...payload })
        .select()
        .single();
      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.budgets });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Budget> }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.budgets });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.budgets });
    },
  });

  return {
    budgets: budgetsQuery.data || [],
    isLoading: budgetsQuery.isLoading,
    isError: budgetsQuery.isError,
    refetch: budgetsQuery.refetch,
    createBudget: createMutation.mutateAsync,
    updateBudget: async (id: string, updates: Partial<Budget>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteBudget: deleteMutation.mutateAsync,
  };
}
