import { useApp } from '@/contexts/AppContext';

export const useFinance = () => {
  const { financialOperations, addFinancialOperation } = useApp();

  return {
    operations: financialOperations,
    invoices: [],
    createOperation: addFinancialOperation,
    createInvoice: () => {},
    updateInvoice: () => {},
  };
};
