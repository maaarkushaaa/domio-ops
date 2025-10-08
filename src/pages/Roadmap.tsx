import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Target } from 'lucide-react';

export default function Roadmap() {
  const milestones = [
    {
      quarter: 'Q4 2025',
      status: 'current',
      features: [
        { name: 'Telegram интеграция', completed: true },
        { name: 'Внутренний чат', completed: true },
        { name: 'Мобильное приложение (iOS/Android)', completed: true },
        { name: 'Админ панель', completed: true },
        { name: 'Расширенная аналитика', completed: false },
      ],
    },
    {
      quarter: 'Q1 2026',
      status: 'planned',
      features: [
        { name: 'AI-ассистент для автоматизации', completed: false },
        { name: 'Интеграция с 1C', completed: false },
        { name: 'Электронные подписи', completed: false },
        { name: 'API для внешних систем', completed: false },
        { name: 'Мультиязычность', completed: false },
      ],
    },
    {
      quarter: 'Q2 2026',
      status: 'future',
      features: [
        { name: 'Machine Learning прогнозирование', completed: false },
        { name: 'Blockchain для контрактов', completed: false },
        { name: 'AR/VR визуализация', completed: false },
        { name: 'IoT интеграция для производства', completed: false },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          Дорожная карта
        </h1>
        <p className="text-muted-foreground mt-1">
          План развития DOMIO Ops
        </p>
      </div>

      <div className="space-y-6">
        {milestones.map((milestone, index) => (
          <Card key={index} className="glass-card hover-lift animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {milestone.quarter}
                  {milestone.status === 'current' && (
                    <Badge variant="default">Текущий этап</Badge>
                  )}
                  {milestone.status === 'planned' && (
                    <Badge variant="outline">Запланировано</Badge>
                  )}
                  {milestone.status === 'future' && (
                    <Badge variant="secondary">Будущее</Badge>
                  )}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {milestone.features.filter(f => f.completed).length} / {milestone.features.length}
                </div>
              </div>
              <CardDescription>
                {milestone.status === 'current' && 'В активной разработке'}
                {milestone.status === 'planned' && 'Следующий этап развития'}
                {milestone.status === 'future' && 'Долгосрочные планы'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestone.features.map((feature, fIndex) => (
                  <div
                    key={fIndex}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-lift"
                  >
                    {feature.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={feature.completed ? 'line-through text-muted-foreground' : 'font-medium'}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
