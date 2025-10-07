import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { toast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export interface Deal {
  id: string;
  client_id: string;
  title: string;
  amount: number;
  currency: string;
  status: 'lead' | 'negotiation' | 'proposal' | 'won' | 'lost';
  created_at: string;
  client?: { id: string; name: string };
}

export const useClients = () => {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: deals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
  });

  const createClient = useMutation({
    mutationFn: async (client: Partial<Client>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Клиент создан' });
    },
  });

  const createDeal = useMutation({
    mutationFn: async (deal: Partial<Deal>) => {
      const { data, error } = await supabase
        .from('deals')
        .insert([deal])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Сделка создана' });
    },
  });

  return {
    clients: clients || [],
    deals: deals || [],
    isLoading,
    createClient: createClient.mutate,
    createDeal: createDeal.mutate,
  };
};
