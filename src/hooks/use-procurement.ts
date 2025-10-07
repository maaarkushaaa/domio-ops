import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { toast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  name: string;
  category?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  rating?: number;
  delivery_time?: string;
  created_at: string;
}

export interface ProcurementOrder {
  id: string;
  supplier_id: string;
  number: string;
  status: 'draft' | 'sent' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  order_date: string;
  expected_delivery?: string;
  created_at: string;
  supplier?: { id: string; name: string };
}

export interface WarehouseItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_quantity?: number;
  location?: string;
  updated_at: string;
}

export const useProcurement = () => {
  const queryClient = useQueryClient();

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Supplier[];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ['procurement_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procurement_orders')
        .select(`
          *,
          supplier:suppliers(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProcurementOrder[];
    },
  });

  const { data: warehouseItems } = useQuery({
    queryKey: ['warehouse_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_items')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as WarehouseItem[];
    },
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplier])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Поставщик создан' });
    },
  });

  const createOrder = useMutation({
    mutationFn: async (order: Partial<ProcurementOrder>) => {
      const { data, error } = await supabase
        .from('procurement_orders')
        .insert([order])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement_orders'] });
      toast({ title: 'Заказ создан' });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcurementOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from('procurement_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement_orders'] });
      toast({ title: 'Заказ обновлен' });
    },
  });

  return {
    suppliers: suppliers || [],
    orders: orders || [],
    warehouseItems: warehouseItems || [],
    createSupplier: createSupplier.mutate,
    createOrder: createOrder.mutate,
    updateOrder: updateOrder.mutate,
  };
};
