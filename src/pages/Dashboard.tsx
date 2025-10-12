import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useProducts } from "@/hooks/use-products";
import { ProjectTimeline } from "@/components/timeline/ProjectTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { TaskListDialog } from "@/components/dashboard/TaskListDialog";
import { Task } from "@/types";

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { products } = useProducts();
  const navigate = useNavigate();
  const userName = user?.name || user?.email?.split('@')[0] || 'Пользователь';
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogTasks, setDialogTasks] = useState<Task[]>([]);
  const [dialogVariant, setDialogVariant] = useState<'today' | 'overdue' | 'upcoming'>('today');
  
  // Задачи на сегодня: начинаются сегодня или раньше И заканчиваются сегодня или позже (или не имеют конца)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const todayTasks = tasks.filter(t => {
    if (t.status === 'done') return false;
    
    if (!t.due_date) return false; // Нет дедлайна - не показываем
    
    const startDate = new Date(t.due_date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = (t as any).due_end ? new Date((t as any).due_end) : startDate;
    endDate.setHours(23, 59, 59, 999);
    
    // Задача на сегодня если: начало <= сегодня И конец >= сегодня
    return startDate <= todayEnd && endDate >= today;
  }).length;
  
  // Просроченные: конец задачи раньше сегодняшней даты
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    
    const endDate = (t as any).due_end ? new Date((t as any).due_end) : new Date(t.due_date);
    endDate.setHours(23, 59, 59, 999);
    
    return endDate < today;
  });
  
  // Предстоящие: начинаются в будущем
  const upcomingTasks = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    
    const startDate = new Date(t.due_date);
    startDate.setHours(0, 0, 0, 0);
    
    return startDate > todayEnd;
  });
  
  const inProduction = products.filter(p => p.status === 'in_progress').length;
  
  const openTaskDialog = (title: string, taskList: Task[], variant: 'today' | 'overdue' | 'upcoming') => {
    setDialogTitle(title);
    setDialogTasks(taskList);
    setDialogVariant(variant);
    setDialogOpen(true);
  };
  
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className="glass-card hover-lift animate-scale-in interactive cursor-pointer" 
          style={{ animationDelay: '0ms' }} 
          onClick={() => {
            const todayTasksList = tasks.filter(t => {
              if (t.status === 'done') return false;
              if (!t.due_date) return false;
              const startDate = new Date(t.due_date);
              startDate.setHours(0, 0, 0, 0);
              const endDate = (t as any).due_end ? new Date((t as any).due_end) : startDate;
              endDate.setHours(23, 59, 59, 999);
              return startDate <= todayEnd && endDate >= today;
            });
            openTaskDialog('Задачи на сегодня', todayTasksList, 'today');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Задачи на сегодня</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks}</div>
            <p className="text-xs text-muted-foreground">
              Нажмите для просмотра
            </p>
          </CardContent>
        </Card>

        <Card 
          className="glass-card hover-lift animate-scale-in interactive cursor-pointer" 
          style={{ animationDelay: '100ms' }} 
          onClick={() => openTaskDialog('Просроченные задачи', overdueTasks, 'overdue')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Требуют внимания
            </p>
          </CardContent>
        </Card>

        <Card 
          className="glass-card hover-lift animate-scale-in interactive cursor-pointer" 
          style={{ animationDelay: '150ms' }} 
          onClick={() => openTaskDialog('Предстоящие задачи', upcomingTasks, 'upcoming')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Предстоящие</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{upcomingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Запланированы
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-scale-in interactive" style={{ animationDelay: '200ms' }} onClick={() => navigate('/finance')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Баланс (Взлётка: 8 мес)</CardTitle>
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

        <Card className="glass-card hover-lift animate-scale-in interactive" style={{ animationDelay: '300ms' }} onClick={() => navigate('/production')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">В производстве</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProduction}</div>
            <p className="text-xs text-muted-foreground">
              изделий
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Активные задачи (реальные) */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle>Активные задачи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks
              .filter(t => t.status !== 'done')
              .slice(0, 8)
              .map((t: any, i: number) => (
                <div key={t.id} className="space-y-2 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{t.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{t.project?.name || 'Без проекта'}</Badge>
                        <Badge variant={t.priority === 'high' ? 'destructive' : t.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                          {t.priority === 'high' ? 'Высокий' : t.priority === 'medium' ? 'Средний' : 'Низкий'}
                        </Badge>
                      </div>
                    </div>
                    {/* Прогресс по дате: сколько прошло процентов периода */}
                    <span className="text-sm font-medium">
                      {(() => {
                        if (!t.due_date) return '—';
                        const start = new Date(t.due_date).getTime();
                        const end = (t.due_end ? new Date(t.due_end) : new Date(t.due_date)).getTime();
                        const now = Date.now();
                        if (end <= start) return '0%';
                        const p = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
                        return `${p}%`;
                      })()}
                    </span>
                  </div>
                  <Progress value={((): number => {
                    if (!t.due_date) return 0;
                    const start = new Date(t.due_date).getTime();
                    const end = (t.due_end ? new Date(t.due_end) : new Date(t.due_date)).getTime();
                    const now = Date.now();
                    if (end <= start) return 0;
                    return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
                  })()} className="interactive" />
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Уведомления (реальные) */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle>Важные уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueTasks.slice(0,5).map((t: any, i: number) => (
              <div key={`overdue-${t.id}`} className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all interactive hover-lift animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <AlertCircle className="h-5 w-5 mt-0.5 text-destructive" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Просрочено: {t.title}</p>
                  <p className="text-xs text-muted-foreground">Дедлайн: {new Date((t.due_end || t.due_date)).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Производственный план (реальные изделия, выбор периода) */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>План производства</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span>Период:</span>
              {/* Простая форма выбора периода (быстрые фильтры) */}
              <Button size="sm" variant="outline">Неделя</Button>
              <Button size="sm" variant="outline">Месяц</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products.slice(0,8).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover-lift interactive animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="space-y-1">
                  <p className="font-medium">{p.name || 'Изделие'}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{p.status || '—'}</Badge>
                    <span className="text-xs text-muted-foreground">{p.stage || '—'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{p.deadline ? new Date(p.deadline).toLocaleDateString('ru-RU') : '—'}</p>
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
      
      <TaskListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        tasks={dialogTasks}
        variant={dialogVariant}
      />
    </div>
  );
}
