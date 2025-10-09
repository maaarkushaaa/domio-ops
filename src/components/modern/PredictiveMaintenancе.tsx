import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  type: string;
  health: number;
  nextMaintenance: string;
  status: 'good' | 'warning' | 'critical';
  lastService: string;
}

export function PredictiveMaintenance() {
  const equipment: Equipment[] = [
    {
      id: '1',
      name: 'Фрезерный станок CNC-1',
      type: 'ЧПУ станок',
      health: 92,
      nextMaintenance: '2025-11-15',
      status: 'good',
      lastService: '2025-09-15',
    },
    {
      id: '2',
      name: 'Шлифовальный станок #3',
      type: 'Шлифовка',
      health: 68,
      nextMaintenance: '2025-10-20',
      status: 'warning',
      lastService: '2025-08-20',
    },
    {
      id: '3',
      name: 'Покрасочная камера',
      type: 'Покраска',
      health: 35,
      nextMaintenance: '2025-10-12',
      status: 'critical',
      lastService: '2025-07-12',
    },
    {
      id: '4',
      name: 'Лазерный резак',
      type: 'Резка',
      health: 85,
      nextMaintenance: '2025-12-01',
      status: 'good',
      lastService: '2025-10-01',
    },
  ];

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'good': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
    }
  };

  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (status: Equipment['status']) => {
    switch (status) {
      case 'good': return 'Отлично';
      case 'warning': return 'Внимание';
      case 'critical': return 'Критично';
    }
  };

  const criticalCount = equipment.filter(e => e.status === 'critical').length;
  const warningCount = equipment.filter(e => e.status === 'warning').length;
  const avgHealth = equipment.reduce((sum, e) => sum + e.health, 0) / equipment.length;

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Предиктивное ТО
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">Состояние</p>
            <p className="text-2xl font-bold text-success">{avgHealth.toFixed(0)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-muted-foreground">Внимание</p>
            <p className="text-2xl font-bold text-warning">{warningCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground">Критично</p>
            <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
          </div>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-2">
            {equipment.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getStatusIcon(item.status)}
                    {getStatusText(item.status)}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Состояние</span>
                    <span className={`font-medium ${getStatusColor(item.status)}`}>
                      {item.health}%
                    </span>
                  </div>
                  <Progress value={item.health} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>ТО: {new Date(item.nextMaintenance).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Wrench className="h-3 w-3" />
                    <span>Обслужен: {new Date(item.lastService).toLocaleDateString('ru-RU')}</span>
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
