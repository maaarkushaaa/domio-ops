import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, User, Clock, Activity } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  role: string;
  utilization: number;
  projects: number;
  available: boolean;
  nextFree: string;
}

export function ResourcePlanning() {
  const resources: Resource[] = [
    {
      id: '1',
      name: 'Иван Петров',
      role: 'Столяр',
      utilization: 95,
      projects: 3,
      available: false,
      nextFree: '15.10.2025',
    },
    {
      id: '2',
      name: 'Мария Сидорова',
      role: 'Дизайнер',
      utilization: 60,
      projects: 2,
      available: true,
      nextFree: 'Сейчас',
    },
    {
      id: '3',
      name: 'Петр Иванов',
      role: 'Монтажник',
      utilization: 80,
      projects: 4,
      available: false,
      nextFree: '12.10.2025',
    },
    {
      id: '4',
      name: 'Анна Смирнова',
      role: 'Отделка',
      utilization: 45,
      projects: 1,
      available: true,
      nextFree: 'Сейчас',
    },
  ];

  const avgUtilization = resources.reduce((sum, r) => sum + r.utilization, 0) / resources.length;

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Планирование ресурсов
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Всего сотрудников</p>
            <p className="text-2xl font-bold text-primary">{resources.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">Доступно</p>
            <p className="text-2xl font-bold text-success">
              {resources.filter(r => r.available).length}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Средняя загрузка</span>
            <span className="text-sm font-medium">{avgUtilization.toFixed(0)}%</span>
          </div>
          <Progress value={avgUtilization} className="h-2" />
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-2">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{resource.name}</p>
                      <p className="text-xs text-muted-foreground">{resource.role}</p>
                    </div>
                  </div>
                  <Badge variant={resource.available ? 'default' : 'secondary'}>
                    {resource.available ? 'Доступен' : 'Занят'}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Загрузка</span>
                    <span className="font-medium">{resource.utilization}%</span>
                  </div>
                  <Progress value={resource.utilization} className="h-1.5" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Проектов: {resource.projects}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Свободен: {resource.nextFree}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
