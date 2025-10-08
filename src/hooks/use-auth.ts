import { useApp } from '@/contexts/AppContext';

export const useAuth = () => {
  const { user, signIn, signUp, signOut } = useApp();

  return {
    user,
    session: user ? { user } : null,
    loading: false,
    signIn,
    signUp,
    signOut,
  };
};
