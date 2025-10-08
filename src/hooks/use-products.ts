import { useApp } from '@/contexts/AppContext';

export const useProducts = () => {
  const { products, addProduct, updateProduct } = useApp();

  return {
    products,
    bomItems: [],
    isLoading: false,
    createProduct: addProduct,
    updateProduct: (updates: any) => updateProduct(updates.id, updates),
  };
};
