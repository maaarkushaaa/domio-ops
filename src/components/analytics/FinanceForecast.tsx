import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useFinance } from '@/hooks/use-finance';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Brush } from 'recharts';
import { safeFormatCurrency } from '@/utils/safeFormat';

function exponentialSmoothing(series: number[], alpha: number, horizon: number) {
  if (series.length === 0) return { smoothed: [], forecast: [] };
  let s = series[0];
  const smoothed: number[] = [s];
  for (let t = 1; t < series.length; t++) {
    s = alpha * series[t] + (1 - alpha) * s;
    smoothed.push(s);
  }
  const forecast = Array.from({ length: horizon }, () => s);
  return { smoothed, forecast };
}

export function FinanceForecast() {
  const { operations } = useFinance();
  const [alpha, setAlpha] = useState<number>(0.5);
  const [horizon, setHorizon] = useState<number>(6);

  const { data, months } = useMemo(() => {
    const map = new Map<string, number>();
    operations.forEach(op => {
      const ym = new Date(op.date).toISOString().slice(0, 7);
      const sign = op.type === 'income' ? 1 : op.type === 'expense' ? -1 : 0;
      map.set(ym, (map.get(ym) || 0) + sign * (op.amount || 0));
    });
    const months = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    const series = months.map(m => map.get(m) || 0);
    return { data: series, months };
  }, [operations]);

  const { smoothed, forecast } = useMemo(() => exponentialSmoothing(data, alpha, horizon), [data, alpha, horizon]);

  const chartData = useMemo(() => {
    const hist = months.map((m, i) => ({ month: m, actual: data[i], smoothed: smoothed[i] ?? null }));
    const lastMonth = months[months.length - 1] || new Date().toISOString().slice(0, 7);
    const [y, mm] = lastMonth.split('-').map(Number);
    const points: { month: string; forecast: number }[] = [];
    let year = y;
    let month = mm;
    for (let i = 0; i < forecast.length; i++) {
      month += 1;
      if (month > 12) { month = 1; year += 1; }
      const label = `${year}-${String(month).padStart(2, '0')}`;
      points.push({ month: label, forecast: forecast[i] });
    }
    return [...hist, ...points];
  }, [months, data, smoothed, forecast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Прогноз денежных потоков (эксп. сглаживание)</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">alpha</Label>
              <Slider value={[alpha]} min={0.05} max={0.95} step={0.05} onValueChange={(v) => setAlpha(Number(v[0]))} className="w-40" />
              <Input className="w-16 h-8" type="number" step={0.05} min={0.05} max={0.95} value={alpha} onChange={(e) => setAlpha(Math.max(0.05, Math.min(0.95, Number(e.target.value) || 0.5)))} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">горизонт</Label>
              <Slider value={[horizon]} min={1} max={18} step={1} onValueChange={(v) => setHorizon(v[0])} className="w-40" />
              <Input className="w-16 h-8" type="number" min={1} max={18} value={horizon} onChange={(e) => setHorizon(Math.max(1, Math.min(18, Number(e.target.value) || 6)))} />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v) => new Intl.NumberFormat('ru-RU').format(Number(v))} />
            <Tooltip formatter={(v: any) => safeFormatCurrency(Number(v))} />
            <Legend />
            <Line type="monotone" dataKey="actual" name="Факт (мес)" stroke="#0ea5e9" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="smoothed" name="Сглажено" stroke="#7c3aed" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="forecast" name="Прогноз" stroke="#10b981" dot={false} strokeDasharray="5 5" strokeWidth={2} />
            <Brush dataKey="month" height={20} travellerWidth={10} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
