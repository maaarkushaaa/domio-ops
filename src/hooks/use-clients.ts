import { useApp } from '@/contexts/AppContext';

export const useClients = () => {
  const { clients, addClient, updateClient } = useApp();

  return {
    clients,
    deals: [],
    isLoading: false,
    createClient: addClient,
    createDeal: () => {},
  };
};
