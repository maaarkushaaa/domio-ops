import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, Users, DollarSign, Package } from 'lucide-react';

const salesData = [
  { month: 'Янв', revenue: 4200, orders: 24, profit: 1800 },
  { month: 'Фев', revenue: 3800, orders: 20, profit: 1600 },
  { month: 'Мар', revenue: 5200, orders: 32, profit: 2400 },
  { month: 'Апр', revenue: 4600, orders: 28, profit: 2100 },
  { month: 'Май', revenue: 6100, orders: 38, profit: 2900 },
  { month: 'Июн', revenue: 7200, orders: 45, profit: 3500 },
];

const productionData = [
  { category: 'Кухни', value: 35, color: '#4F46E5' },
  { category: 'Шкафы', value: 25, color: '#10B981' },
  { category: 'Столы', value: 20, color: '#F59E0B' },
  { category: 'Стулья', value: 15, color: '#EF4444' },
  { category: 'Другое', value: 5, color: '#8B5CF6' },
];

const teamPerformance = [
  { metric: 'Качество', current: 92, target: 95 },
  { metric: 'Скорость', current: 85, target: 90 },
  { metric: 'Эффективность', current: 88, target: 85 },
  { metric: 'Инновации', current: 75, target: 80 },
  { metric: 'Коммуникация', current: 90, target: 90 },
];

const kpiData = [
  { name: 'Q1', revenue: 85000, target: 100000, satisfaction: 87 },
  { name: 'Q2', revenue: 92000, target: 100000, satisfaction: 89 },
  { name: 'Q3', revenue: 105000, target: 100000, satisfaction: 92 },
  { name: 'Q4', revenue: 118000, target: 100000, satisfaction: 94 },
];

export function DataVisualization() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Визуализация данных</h2>
        <p className="text-muted-foreground">Продвинутая аналитика и интерактивные графики</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽7.2M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+18.2%</span> за месяц
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заказы</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+12%</span> за месяц
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Клиенты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+8%</span> за месяц
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Рост</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.3%</div>
            <p className="text-xs text-muted-foreground">
              Годовой показатель
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Выручка</TabsTrigger>
          <TabsTrigger value="production">Производство</TabsTrigger>
          <TabsTrigger value="team">Команда</TabsTrigger>
          <TabsTrigger value="kpi">KPI Динамика</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Динамика продаж</CardTitle>
                <CardDescription>Выручка и прибыль по месяцам</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)"
                      name="Выручка"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="hsl(var(--success))" 
                      fillOpacity={1} 
                      fill="url(#colorProfit)"
                      name="Прибыль"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Количество заказов</CardTitle>
                <CardDescription>Помесячная динамика</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" name="Заказы" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Распределение производства</CardTitle>
              <CardDescription>По категориям продукции</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie
                      data={productionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {productionData.map((item) => (
                    <div key={item.category} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.category}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Производительность команды</CardTitle>
              <CardDescription>Текущие показатели vs целевые</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={teamPerformance}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Radar 
                    name="Текущий" 
                    dataKey="current" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6} 
                  />
                  <Radar 
                    name="Цель" 
                    dataKey="target" 
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success))" 
                    fillOpacity={0.3} 
                  />
                  <Legend />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Квартальные KPI</CardTitle>
              <CardDescription>Выполнение целей и удовлетворенность</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={kpiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Выручка"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Цель"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Удовлетворенность %"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
