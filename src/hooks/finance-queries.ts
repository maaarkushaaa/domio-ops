import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice } from '@/hooks/use-finance';

// Query Keys
const qk = {
  invoices: ['invoices'] as const,
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
