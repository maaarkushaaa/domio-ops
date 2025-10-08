import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const burndownData = [
  { sprint: 'День 1', ideal: 100, actual: 100 },
  { sprint: 'День 2', ideal: 90, actual: 95 },
  { sprint: 'День 3', ideal: 80, actual: 88 },
  { sprint: 'День 4', ideal: 70, actual: 75 },
  { sprint: 'День 5', ideal: 60, actual: 60 },
  { sprint: 'День 6', ideal: 50, actual: 52 },
  { sprint: 'День 7', ideal: 40, actual: 40 },
  { sprint: 'День 8', ideal: 30, actual: 28 },
  { sprint: 'День 9', ideal: 20, actual: 15 },
  { sprint: 'День 10', ideal: 10, actual: 8 },
  { sprint: 'День 11', ideal: 0, actual: 0 },
];

const velocityData = [
  { sprint: 'Sprint 1', planned: 40, completed: 38, committed: 40 },
  { sprint: 'Sprint 2', planned: 45, completed: 42, committed: 45 },
  { sprint: 'Sprint 3', planned: 42, completed: 45, committed: 42 },
  { sprint: 'Sprint 4', planned: 48, completed: 44, committed: 48 },
  { sprint: 'Sprint 5', planned: 50, completed: 50, committed: 50 },
  { sprint: 'Sprint 6', planned: 52, completed: 48, committed: 52 },
];

const teamPerformanceData = [
  { subject: 'Скорость', teamA: 120, teamB: 110, fullMark: 150 },
  { subject: 'Качество', teamA: 98, teamB: 130, fullMark: 150 },
  { subject: 'Коммуникация', teamA: 86, teamB: 90, fullMark: 150 },
  { subject: 'Инновации', teamA: 99, teamB: 100, fullMark: 150 },
  { subject: 'Дедлайны', teamA: 85, teamB: 90, fullMark: 150 },
  { subject: 'Документация', teamA: 65, teamB: 85, fullMark: 150 },
];

const cashFlowData = [
  { month: 'Янв', income: 65000, expenses: 45000, net: 20000 },
  { month: 'Фев', income: 72000, expenses: 48000, net: 24000 },
  { month: 'Мар', income: 68000, expenses: 52000, net: 16000 },
  { month: 'Апр', income: 85000, expenses: 55000, net: 30000 },
  { month: 'Май', income: 78000, expenses: 50000, net: 28000 },
  { month: 'Июн', income: 92000, expenses: 58000, net: 34000 },
];

const cumulativeFlowData = [
  { week: 'Нед 1', backlog: 50, inProgress: 20, review: 10, done: 5 },
  { week: 'Нед 2', backlog: 48, inProgress: 22, review: 12, done: 15 },
  { week: 'Нед 3', backlog: 45, inProgress: 25, review: 15, done: 28 },
  { week: 'Нед 4', backlog: 40, inProgress: 28, review: 18, done: 42 },
  { week: 'Нед 5', backlog: 35, inProgress: 30, review: 20, done: 58 },
  { week: 'Нед 6', backlog: 30, inProgress: 32, review: 22, done: 75 },
];

export function AdvancedCharts() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="burndown" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="burndown">Burndown</TabsTrigger>
          <TabsTrigger value="velocity">Velocity</TabsTrigger>
          <TabsTrigger value="team">Команда</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="cumulative">CFD</TabsTrigger>
        </TabsList>

        <TabsContent value="burndown">
          <Card>
            <CardHeader>
              <CardTitle>Burndown Chart - Спринт</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sprint" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    name="Идеальная линия"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Фактическая"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="velocity">
          <Card>
            <CardHeader>
              <CardTitle>Velocity Chart - Скорость команды</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sprint" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="Завершено" />
                  <Bar dataKey="committed" fill="hsl(var(--secondary))" name="Взято в работу" />
                  <Line
                    type="monotone"
                    dataKey="planned"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    name="Запланировано"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Radar Chart - Производительность команды</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={teamPerformanceData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 150]} />
                  <Radar
                    name="Команда A"
                    dataKey="teamA"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Команда B"
                    dataKey="teamB"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow - Движение денежных средств</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    fill="hsl(var(--success))"
                    stroke="hsl(var(--success))"
                    fillOpacity={0.3}
                    name="Доходы"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    fill="hsl(var(--destructive))"
                    stroke="hsl(var(--destructive))"
                    fillOpacity={0.3}
                    name="Расходы"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    name="Чистая прибыль"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cumulative">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Flow Diagram - Поток задач</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cumulativeFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="done"
                    stackId="1"
                    stroke="hsl(var(--success))"
                    fill="hsl(var(--success))"
                    name="Готово"
                  />
                  <Area
                    type="monotone"
                    dataKey="review"
                    stackId="1"
                    stroke="hsl(var(--warning))"
                    fill="hsl(var(--warning))"
                    name="На ревью"
                  />
                  <Area
                    type="monotone"
                    dataKey="inProgress"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    name="В работе"
                  />
                  <Area
                    type="monotone"
                    dataKey="backlog"
                    stackId="1"
                    stroke="hsl(var(--muted))"
                    fill="hsl(var(--muted))"
                    name="Бэклог"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
