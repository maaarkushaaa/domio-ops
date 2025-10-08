import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Package,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProjectTimeline } from "@/components/timeline/ProjectTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { user } = useAuth();
  const userName = user?.name || user?.email?.split('@')[0] || 'Пользователь';
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6 rounded-xl hover-lift animate-scale-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          Добро пожаловать, {userName}!
        </h1>
        <p className="text-muted-foreground mt-1">Обзор операций DOMIO</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="timeline">Timeline проектов</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover-lift animate-scale-in" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Задачи на сегодня</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 с вчерашнего дня
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-scale-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">3</div>
            <p className="text-xs text-muted-foreground">
              Требуют внимания
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-scale-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Баланс (Взлётная полоса: 8 мес)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 234 567 ₽</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.3% за месяц • Расход: 150к ₽/мес
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-scale-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">В производстве</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              изделий
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Активные задачи */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle>Активные задачи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Моделинг шкафа Версаль", project: "3D", priority: "high", progress: 75 },
              { title: "Подготовка DXF для стола", project: "Производство", priority: "high", progress: 60 },
              { title: "Закупка фурнитуры", project: "Закупки", priority: "medium", progress: 40 },
              { title: "Оплата поставщику Мебель+", project: "Финансы", priority: "high", progress: 90 },
            ].map((task, i) => (
              <div key={i} className="space-y-2 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {task.project}
                      </Badge>
                      <Badge 
                        variant={task.priority === "high" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {task.priority === "high" ? "Высокий" : "Средний"}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="interactive" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Уведомления */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle>Важные уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                type: "warning",
                title: "Инвойс #1234 просрочен на 3 дня",
                time: "2 часа назад",
                icon: AlertCircle,
                color: "text-yellow-500",
              },
              {
                type: "info",
                title: "Подписка Adobe истекает через 7 дней",
                time: "Сегодня",
                icon: Clock,
                color: "text-primary",
              },
              {
                type: "alert",
                title: "Низкие остатки фурнитуры на складе",
                time: "Вчера",
                icon: Package,
                color: "text-destructive",
              },
              {
                type: "success",
                title: "Получена оплата от клиента А123",
                time: "Вчера",
                icon: DollarSign,
                color: "text-green-500",
              },
            ].map((notification, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all interactive hover-lift animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <notification.icon className={`h-5 w-5 mt-0.5 ${notification.color}`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Производственный план */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <CardTitle>План производства на неделю</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Шкаф Версаль", status: "В работе", stage: "UV-развертка", deadline: "15 Окт" },
              { name: "Стол Модерн", status: "Техподготовка", stage: "Создание DXF", deadline: "17 Окт" },
              { name: "Комод Классик", status: "Ожидание материалов", stage: "Закупка", deadline: "20 Окт" },
              { name: "Тумба Лофт", status: "Планирование", stage: "BOM", deadline: "22 Окт" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover-lift interactive animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.stage}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.deadline}</p>
                  <p className="text-xs text-muted-foreground">Дедлайн</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <ProjectTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
}
