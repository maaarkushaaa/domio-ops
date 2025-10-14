import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function FinanceRealtimeProvider() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = (key: readonly unknown[]) => {
      try { queryClient.invalidateQueries({ queryKey: key }); } catch {}
    };

    const ops = supabase
      .channel('rq_financial_operations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_operations' }, () => {
        invalidate(['operations']);
      })
      .subscribe();

    const acc = supabase
      .channel('rq_accounts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
        invalidate(['accounts']);
      })
      .subscribe();

    const inv = supabase
      .channel('rq_invoices_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        invalidate(['invoices']);
      })
      .subscribe();

    const bud = supabase
      .channel('rq_budgets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => {
        invalidate(['budgets']);
      })
      .subscribe();

    const subs = supabase
      .channel('rq_subscriptions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        invalidate(['subscriptions']);
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(ops); } catch {}
      try { supabase.removeChannel(acc); } catch {}
      try { supabase.removeChannel(inv); } catch {}
      try { supabase.removeChannel(bud); } catch {}
      try { supabase.removeChannel(subs); } catch {}
    };
  }, [queryClient]);

  return null;
}
