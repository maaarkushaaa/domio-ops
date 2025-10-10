import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Zap,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  triggers: number;
  actions: number;
  lastRun: string;
  successRate: number;
}

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Автоматическое создание задач из писем',
    description: 'Создает задачи из важных писем клиентов',
    status: 'active',
    triggers: 45,
    actions: 12,
    lastRun: '2 мин назад',
    successRate: 98,
  },
  {
    id: '2',
    name: 'Уведомления о сроках',
    description: 'Отправляет напоминания о приближающихся дедлайнах',
    status: 'active',
    triggers: 120,
    actions: 8,
    lastRun: '15 мин назад',
    successRate: 100,
  },
  {
    id: '3',
    name: 'Распределение производственных заказов',
    description: 'Автоматически назначает заказы доступным мастерам',
    status: 'paused',
    triggers: 33,
    actions: 5,
    lastRun: '2 часа назад',
    successRate: 95,
  },
];

export function AdvancedWorkflows() {
  const [workflows, setWorkflows] = useState(mockWorkflows);
  const { toast } = useToast();

  const toggleWorkflow = (id: string) => {
    setWorkflows(workflows.map(w => {
      if (w.id === id) {
        const newStatus = w.status === 'active' ? 'paused' : 'active';
        toast({
          title: newStatus === 'active' ? 'Workflow активирован' : 'Workflow приостановлен',
          description: w.name,
        });
        return { ...w, status: newStatus as 'active' | 'paused' };
      }
      return w;
    }));
  };

  const getStatusBadge = (status: Workflow['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Активен</Badge>;
      case 'paused':
        return <Badge variant="secondary">Приостановлен</Badge>;
      case 'draft':
        return <Badge variant="outline">Черновик</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Автоматизация Workflows</h2>
          <p className="text-muted-foreground">Создавайте умные автоматизации для бизнес-процессов</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Создать Workflow
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных Workflows</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              из {workflows.length} всего
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено сегодня</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">
              +12% за неделю
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Успешность</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97.8%</div>
            <p className="text-xs text-muted-foreground">
              Средняя за месяц
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Список Workflows */}
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <GitBranch className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{workflow.name}</h3>
                    {getStatusBadge(workflow.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleWorkflow(workflow.id)}
                  >
                    {workflow.status === 'active' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Триггеров</p>
                  <p className="text-lg font-semibold">{workflow.triggers}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Действий</p>
                  <p className="text-lg font-semibold">{workflow.actions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Последний запуск</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {workflow.lastRun}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Успешность</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{workflow.successRate}%</p>
                    <Progress value={workflow.successRate} className="h-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Шаблоны */}
      <Card>
        <CardHeader>
          <CardTitle>Популярные шаблоны</CardTitle>
          <CardDescription>Начните с готовых решений для типовых задач</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <p className="font-medium">Автоответчик для клиентов</p>
                <p className="text-xs text-muted-foreground">Автоматические ответы на часто задаваемые вопросы</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <p className="font-medium">Резервное копирование данных</p>
                <p className="text-xs text-muted-foreground">Ежедневное создание backup важных данных</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <p className="font-medium">Отчеты руководству</p>
                <p className="text-xs text-muted-foreground">Еженедельная отправка сводных отчетов</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <p className="font-medium">Контроль бюджета</p>
                <p className="text-xs text-muted-foreground">Уведомления при превышении лимитов расходов</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
