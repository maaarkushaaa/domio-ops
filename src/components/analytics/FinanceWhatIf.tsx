import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/use-finance';
import { safeFormatCurrency } from '@/utils/safeFormat';

export function FinanceWhatIf() {
  const { accounts, operations } = useFinance();
  const [revenueDelta, setRevenueDelta] = useState<number>(10); // %
  const [expenseDelta, setExpenseDelta] = useState<number>(-5); // %
  const [months, setMonths] = useState<number>(6);

  const base = useMemo(() => {
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const monthlyIncome = operations
      .filter(op => op.type === 'income')
      .reduce((s, op) => s + (op.amount || 0), 0) / Math.max(1, new Set(operations.map(op => new Date(op.date).toISOString().slice(0,7))).size);
    const monthlyExpense = operations
      .filter(op => op.type === 'expense')
      .reduce((s, op) => s + (op.amount || 0), 0) / Math.max(1, new Set(operations.map(op => new Date(op.date).toISOString().slice(0,7))).size);
    return { totalBalance, monthlyIncome, monthlyExpense };
  }, [accounts, operations]);

  const scenario = useMemo(() => {
    const income = base.monthlyIncome * (1 + revenueDelta / 100);
    const expense = base.monthlyExpense * (1 + expenseDelta / 100);
    const net = income - expense;
    const runway = expense > 0 ? Math.max(0, Math.floor(base.totalBalance / expense)) : 0;
    const balancePath: { month: number; balance: number }[] = [];
    let bal = base.totalBalance;
    for (let m = 1; m <= months; m++) {
      bal += net;
      balancePath.push({ month: m, balance: Math.max(0, bal) });
    }
    return { income, expense, net, runway, balancePath };
  }, [base, revenueDelta, expenseDelta, months]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Симуляция "что если"</span>
          <Button variant="outline" size="sm" onClick={() => { setRevenueDelta(10); setExpenseDelta(-5); setMonths(6); }}>
            Сброс
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Изменение выручки (%)</Label>
              <div className="flex items-center gap-3">
                <Slider className="w-44" value={[revenueDelta]} min={-50} max={200} step={1} onValueChange={(v) => setRevenueDelta(v[0])} />
                <Input className="w-20 h-8" type="number" value={revenueDelta} onChange={(e) => setRevenueDelta(Number(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Изменение расходов (%)</Label>
              <div className="flex items-center gap-3">
                <Slider className="w-44" value={[expenseDelta]} min={-80} max={100} step={1} onValueChange={(v) => setExpenseDelta(v[0])} />
                <Input className="w-20 h-8" type="number" value={expenseDelta} onChange={(e) => setExpenseDelta(Number(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Горизонт (мес)</Label>
              <div className="flex items-center gap-3">
                <Slider className="w-44" value={[months]} min={1} max={24} step={1} onValueChange={(v) => setMonths(v[0])} />
                <Input className="w-20 h-8" type="number" value={months} onChange={(e) => setMonths(Math.min(24, Math.max(1, Number(e.target.value) || 1)))} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Базовый сценарий</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Баланс:</div>
              <div className="text-right font-medium">{safeFormatCurrency(base.totalBalance)}</div>
              <div>Месячные доходы:</div>
              <div className="text-right">{safeFormatCurrency(base.monthlyIncome)}</div>
              <div>Месячные расходы:</div>
              <div className="text-right">{safeFormatCurrency(base.monthlyExpense)}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Сценарий</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Доходы (мес):</div>
              <div className="text-right">{safeFormatCurrency(scenario.income)}</div>
              <div>Расходы (мес):</div>
              <div className="text-right">{safeFormatCurrency(scenario.expense)}</div>
              <div>Прибыль (мес):</div>
              <div className="text-right font-medium">{safeFormatCurrency(scenario.net)}</div>
              <div>Runway:</div>
              <div className="text-right font-medium">{scenario.runway} мес</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
