import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Award, Zap } from 'lucide-react';

export function PerformanceDashboard() {
  const metrics = [
    { name: 'Эффективность команды', value: 87, target: 85, trend: 'up', color: 'text-success' },
    { name: 'Время на задачу', value: 3.2, target: 4, trend: 'up', unit: 'ч', color: 'text-success' },
    { name: 'Качество продукции', value: 94, target: 90, trend: 'up', color: 'text-success' },
    { name: 'Удовлетворенность клиентов', value: 4.7, target: 4.5, trend: 'up', unit: '/5', color: 'text-success' },
  ];

  const achievements = [
    { title: 'Производительность +20%', icon: Zap, date: '2025-10-01' },
    { title: 'Лучшая команда месяца', icon: Award, date: '2025-09-15' },
    { title: 'Цель по доходу достигнута', icon: Target, date: '2025-09-01' },
  ];

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Производительность
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {metrics.map((metric, i) => (
            <div key={i} className="space-y-2 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${metric.color}`}>
                    {metric.value}{metric.unit || '%'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Цель: {metric.target}{metric.unit || '%'}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={(metric.value / (metric.target * 1.2)) * 100} 
                className="interactive"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Недавние достижения</h4>
          <div className="space-y-2">
            {achievements.map((achievement, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <achievement.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(achievement.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
