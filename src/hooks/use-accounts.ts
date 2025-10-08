import { useState } from 'react';

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit';
  balance: number;
  currency: string;
}

export const useAccounts = () => {
  const [accounts] = useState<Account[]>([
    {
      id: '1',
      name: 'Main Account',
      type: 'bank',
      balance: 50000,
      currency: 'USD',
    },
    {
      id: '2',
      name: 'Petty Cash',
      type: 'cash',
      balance: 2000,
      currency: 'USD',
    },
  ]);

  return {
    accounts,
    isLoading: false,
    defaultAccount: accounts[0],
  };
};
