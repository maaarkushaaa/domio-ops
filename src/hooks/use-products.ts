import { useApp } from '@/contexts/AppContext';

export type ProductStatus = 'planning' | 'in_progress' | 'quality_check' | 'completed' | 'on_hold';

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
