import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';

export interface FinancialAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  created_at: string;
}

export const useAccounts = () => {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['financial_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as FinancialAccount[];
    },
  });

  return {
    accounts: accounts || [],
    isLoading,
    defaultAccount: accounts?.[0],
  };
};
