import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Brain, TrendingDown, TrendingUp } from 'lucide-react';
import { useFeatureFlags } from '@/contexts/FeatureFlags';
import { useInvoicesQuery, useBudgetsQuery, useAccountsQuery } from '@/hooks/finance-queries';
import { safeFormatCurrency } from '@/utils/safeFormat';
import { fetchFinanceInsights, type AISuggestion } from '@/integrations/ai/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

export function FinancialInsights() {
  const { enableAI } = useFeatureFlags();
  const { invoices } = useInvoicesQuery();
  const { budgets } = useBudgetsQuery();
  const { accounts } = useAccountsQuery();
  const [ai, setAi] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('finance_ai_enabled');
      return saved !== null ? saved === 'true' : enableAI;
    } catch {
      return enableAI;
    }
  });

  const { insights, payload } = useMemo(() => {
    const list: { title: string; severity: 'info' | 'warn' | 'error'; details?: string }[] = [];

    // Runway heuristic
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const monthlyBudgetPlan = budgets
      .filter(b => b.period === 'monthly')
      .reduce((s, b) => s + (b.planned_amount || 0), 0);
    let runway: number | undefined = undefined;
    if (monthlyBudgetPlan > 0) {
      runway = Math.max(0, Math.floor(totalBalance / monthlyBudgetPlan));
      if (runway <= 3) {
        list.push({
          title: `Низкий runway: ~${runway} мес`,
          severity: 'error',
          details: `Баланс ${safeFormatCurrency(totalBalance)}, план расходов/мес ${safeFormatCurrency(monthlyBudgetPlan)}`,
        });
      } else if (runway <= 6) {
        list.push({
          title: `Умеренный runway: ~${runway} мес`,
          severity: 'warn',
          details: `Баланс ${safeFormatCurrency(totalBalance)}, план расходов/мес ${safeFormatCurrency(monthlyBudgetPlan)}`,
        });
      } else {
        list.push({
          title: `Комфортный runway: ~${runway} мес`,
          severity: 'info',
          details: `Баланс ${safeFormatCurrency(totalBalance)}, план расходов/мес ${safeFormatCurrency(monthlyBudgetPlan)}`,
        });
      }
    }

    // Overdue invoices heuristic
    const overdue = invoices.filter(i => i.status === 'overdue');
    let overdueCount = 0;
    let overdueSum = 0;
    if (overdue.length > 0) {
      overdueCount = overdue.length;
      overdueSum = overdue.reduce((s, i) => s + (i.total_amount || 0), 0);
      list.push({
        title: `Просроченных инвойсов: ${overdueCount} на ${safeFormatCurrency(overdueSum)}`,
        severity: 'warn',
        details: 'Рекомендуется связаться с клиентами и предложить мотивацию к оплате',
      });
    }

    // Budget overruns heuristic
    const exceeded = budgets.filter(b => (b.actual_amount || 0) > (b.planned_amount || 0));
    let exceededCount = 0;
    let exceededSum = 0;
    if (exceeded.length > 0) {
      exceededCount = exceeded.length;
      exceededSum = exceeded.reduce((s, b) => s + ((b.actual_amount || 0) - (b.planned_amount || 0)), 0);
      list.push({
        title: `Перерасход по бюджетам (${exceededCount}) на ${safeFormatCurrency(exceededSum)}`,
        severity: 'warn',
        details: 'Пересмотрите лимиты или оптимизируйте траты в затронутых категориях',
      });
    }

    return {
      insights: list,
      payload: { runway, overdueCount, overdueSum, exceededCount, exceededSum },
    };
  }, [invoices, budgets, accounts]);

  // Persist local toggle
  useEffect(() => {
    try { localStorage.setItem('finance_ai_enabled', String(aiEnabled)); } catch {}
  }, [aiEnabled]);

  // Fetch AI suggestions
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!aiEnabled) { setAi([]); setError(null); return; }
      setIsLoading(true);
      setError(null);
      const suggestions = await fetchFinanceInsights(payload);
      if (!ignore) {
        setAi(suggestions);
        setIsLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [aiEnabled, payload]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Финансовые инсайты
            <Badge variant={aiEnabled ? 'default' : 'outline'} className="ml-2 text-xs">
              {aiEnabled ? 'AI: ON' : 'AI: OFF'}
            </Badge>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">AI</span>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[0,1,2].map(i => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {!isLoading && !error && (
          insights.length + ai.length === 0 ? (
            <div className="text-sm text-muted-foreground">Недостаточно данных для инсайтов</div>
          ) : (
            <div className="space-y-3">
              {[...insights, ...ai].map((i, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {i.severity === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  ) : i.severity === 'warn' ? (
                    <TrendingDown className="h-4 w-4 text-yellow-600 mt-0.5" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{i.title}</div>
                    {i.details && <div className="text-xs text-muted-foreground">{i.details}</div>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!aiEnabled && (
          <div className="text-xs text-muted-foreground mt-4">
            Для генеративных рекомендаций включите переключатель AI или флаг в настройках Feature Flags.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
