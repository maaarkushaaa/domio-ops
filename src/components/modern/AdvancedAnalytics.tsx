import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Download, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const forecastData = [
  { month: 'Янв', actual: 45000, forecast: null, lower: null, upper: null },
  { month: 'Фев', actual: 52000, forecast: null, lower: null, upper: null },
  { month: 'Мар', actual: 48000, forecast: null, lower: null, upper: null },
  { month: 'Апр', actual: 61000, forecast: null, lower: null, upper: null },
  { month: 'Май', actual: 55000, forecast: null, lower: null, upper: null },
  { month: 'Июн', actual: 67000, forecast: null, lower: null, upper: null },
  { month: 'Июл', actual: null, forecast: 72000, lower: 65000, upper: 79000 },
  { month: 'Авг', actual: null, forecast: 76000, lower: 68000, upper: 84000 },
  { month: 'Сен', actual: null, forecast: 80000, lower: 71000, upper: 89000 },
  { month: 'Окт', actual: null, forecast: 85000, lower: 75000, upper: 95000 },
];

const kpiData = [
  { name: 'ROI', value: 145, target: 120, status: 'success' },
  { name: 'Время выполнения', value: 87, target: 90, status: 'warning' },
  { name: 'Удовлетворенность', value: 92, target: 85, status: 'success' },
  { name: 'Конверсия', value: 68, target: 75, status: 'danger' },
  { name: 'Retention', value: 94, target: 90, status: 'success' },
];

const cohortData = [
  { week: 'Нед 1', week1: 100, week2: 85, week3: 72, week4: 65 },
  { week: 'Нед 2', week1: 100, week2: 88, week3: 75, week4: 68 },
  { week: 'Нед 3', week1: 100, week2: 90, week3: 78, week4: 70 },
  { week: 'Нед 4', week1: 100, week2: 92, week3: 82, week4: 75 },
];

const correlationData = [
  { x: 10, y: 15, name: 'Проект А' },
  { x: 20, y: 25, name: 'Проект Б' },
  { x: 15, y: 18, name: 'Проект В' },
  { x: 30, y: 35, name: 'Проект Г' },
  { x: 25, y: 28, name: 'Проект Д' },
  { x: 35, y: 42, name: 'Проект Е' },
  { x: 40, y: 45, name: 'Проект Ж' },
];

export function AdvancedAnalytics() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const exportReport = (format: string) => {
    toast({
      title: 'Экспорт отчета',
      description: `Отчет экспортируется в формате ${format.toUpperCase()}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Расширенная аналитика
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => exportReport('pdf')}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportReport('excel')}>
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="forecast">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forecast">Прогнозы</TabsTrigger>
            <TabsTrigger value="kpi">KPI</TabsTrigger>
            <TabsTrigger value="cohort">Когорты</TabsTrigger>
            <TabsTrigger value="correlation">Корреляция</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Прогноз доходов</h3>
                <p className="text-sm text-muted-foreground">
                  Машинное обучение для предсказания трендов
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod('week')}
                >
                  Неделя
                </Button>
                <Button
                  size="sm"
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod('month')}
                >
                  Месяц
                </Button>
                <Button
                  size="sm"
                  variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod('quarter')}
                >
                  Квартал
                </Button>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <ReferenceLine x="Июн" stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stackId="1"
                  stroke="hsl(var(--muted))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.3}
                  name="Нижняя граница"
                />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stackId="1"
                  stroke="hsl(var(--muted))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.3}
                  name="Верхняя граница"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  name="Факт"
                  dot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Прогноз"
                  dot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Прогноз роста
                </div>
                <div className="text-2xl font-bold">+18.5%</div>
                <p className="text-xs text-muted-foreground mt-1">на следующий квартал</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Точность модели
                </div>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground mt-1">R² score</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Сезонность
                </div>
                <div className="text-2xl font-bold">Высокая</div>
                <p className="text-xs text-muted-foreground mt-1">Q2-Q3 пик</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kpi" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Ключевые показатели эффективности</h3>
              <p className="text-sm text-muted-foreground">
                Мониторинг KPI в реальном времени
              </p>
            </div>

            <div className="space-y-4">
              {kpiData.map((kpi) => (
                <div key={kpi.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{kpi.name}</h4>
                      <Badge
                        variant={
                          kpi.status === 'success'
                            ? 'default'
                            : kpi.status === 'warning'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {kpi.value >= kpi.target ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {((kpi.value / kpi.target - 1) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{kpi.value}</div>
                      <div className="text-xs text-muted-foreground">Цель: {kpi.target}</div>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full transition-all ${
                        kpi.status === 'success'
                          ? 'bg-success'
                          : kpi.status === 'warning'
                          ? 'bg-warning'
                          : 'bg-destructive'
                      }`}
                      style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cohort" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Когортный анализ</h3>
              <p className="text-sm text-muted-foreground">
                Удержание пользователей по неделям
              </p>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="week1"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Неделя 1"
                />
                <Line
                  type="monotone"
                  dataKey="week2"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  name="Неделя 2"
                />
                <Line
                  type="monotone"
                  dataKey="week3"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  name="Неделя 3"
                />
                <Line
                  type="monotone"
                  dataKey="week4"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  name="Неделя 4"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 border rounded-lg text-center">
                <div className="text-sm text-muted-foreground">D1 Retention</div>
                <div className="text-xl font-bold">90%</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-sm text-muted-foreground">D7 Retention</div>
                <div className="text-xl font-bold">78%</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-sm text-muted-foreground">D30 Retention</div>
                <div className="text-xl font-bold">70%</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-sm text-muted-foreground">LTV</div>
                <div className="text-xl font-bold">$245</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="correlation" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Корреляционный анализ</h3>
              <p className="text-sm text-muted-foreground">
                Взаимосвязь между бюджетом и результатом проектов
              </p>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Бюджет"
                  unit="k"
                  label={{ value: 'Бюджет (тыс. ₽)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Прибыль"
                  unit="k"
                  label={{ value: 'Прибыль (тыс. ₽)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  name="Проекты"
                  data={correlationData}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  Коэффициент корреляции
                </div>
                <div className="text-3xl font-bold">0.94</div>
                <p className="text-xs text-muted-foreground mt-1">Сильная положительная связь</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">P-value</div>
                <div className="text-3xl font-bold">&lt;0.001</div>
                <p className="text-xs text-muted-foreground mt-1">Статистически значимо</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
