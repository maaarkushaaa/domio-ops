import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { toast } from '@/hooks/use-toast';

export type OperationType = 'income' | 'expense';

export interface FinancialOperation {
  id: string;
  type: OperationType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  account_id: string;
  project_id?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  number: string;
  client_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  created_at: string;
  client?: { id: string; name: string };
}

export const useFinance = () => {
  const queryClient = useQueryClient();

  const { data: operations } = useQuery({
    queryKey: ['financial_operations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_operations')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as FinancialOperation[];
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
  });

  const createOperation = useMutation({
    mutationFn: async (operation: Partial<FinancialOperation>) => {
      const { data, error } = await supabase
        .from('financial_operations')
        .insert([operation])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_operations'] });
      toast({ title: 'Операция создана' });
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: Partial<Invoice>) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoice])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Инвойс создан' });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Инвойс обновлен' });
    },
  });

  return {
    operations: operations || [],
    invoices: invoices || [],
    createOperation: createOperation.mutate,
    createInvoice: createInvoice.mutate,
    updateInvoice: updateInvoice.mutate,
  };
};
