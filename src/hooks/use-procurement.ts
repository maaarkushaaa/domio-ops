import { useApp } from '@/contexts/AppContext';

export const useSuppliers = () => {
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
