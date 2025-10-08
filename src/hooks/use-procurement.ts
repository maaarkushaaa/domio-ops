import { useApp } from '@/contexts/AppContext';

export const useProcurement = () => {
  const { suppliers, addSupplier } = useApp();

  return {
    suppliers,
    orders: [],
    warehouseItems: [],
    createSupplier: addSupplier,
    createOrder: () => {},
    updateOrder: () => {},
  };
};

export const useSuppliers = useProcurement;
