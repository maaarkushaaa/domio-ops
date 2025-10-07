import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { toast } from '@/hooks/use-toast';

export type ProductStatus = 'planning' | 'in_progress' | 'quality_check' | 'completed' | 'on_hold';

export interface Product {
  id: string;
  name: string;
  description?: string;
  status: ProductStatus;
  progress: number;
  assignee_id?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  assignee?: { id: string; full_name: string };
}

export interface BOMItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export const useProducts = () => {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          assignee:profiles(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: bomItems } = useQuery({
    queryKey: ['bom_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bom_items')
        .select('*');

      if (error) throw error;
      return data as BOMItem[];
    },
  });

  const createProduct = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Изделие создано' });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Изделие обновлено' });
    },
  });

  return {
    products: products || [],
    bomItems: bomItems || [],
    isLoading,
    createProduct: createProduct.mutate,
    updateProduct: updateProduct.mutate,
  };
};
