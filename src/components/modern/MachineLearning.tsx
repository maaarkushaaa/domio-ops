import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Prediction {
  id: string;
  type: 'demand' | 'quality' | 'cost' | 'time';
  title: string;
  confidence: number;
  status: 'high' | 'medium' | 'low';
  value: string;
}

export function MachineLearning() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = () => {
    setPredictions([
      {
        id: '1',
        type: 'demand',
        title: 'Прогноз спроса на следующий месяц',
        confidence: 87,
        status: 'high',
        value: '+23%',
      },
      {
        id: '2',
        type: 'quality',
        title: 'Вероятность брака в производстве',
        confidence: 92,
        status: 'low',
        value: '2.3%',
      },
      {
        id: '3',
        type: 'cost',
        title: 'Оптимизация затрат на материалы',
        confidence: 79,
        status: 'medium',
        value: '-15%',
      },
      {
        id: '4',
        type: 'time',
        title: 'Прогноз времени выполнения заказа',
        confidence: 84,
        status: 'high',
        value: '12-14 дней',
      },
    ]);
  };

  const trainModel = () => {
    setTraining(true);
    setTimeout(() => {
      setTraining(false);
      setPredictions(prev =>
        prev.map(p => ({
          ...p,
          confidence: Math.min(p.confidence + Math.random() * 5, 99),
        }))
      );
    }, 3000);
  };

  const getIcon = (type: Prediction['type']) => {
    switch (type) {
      case 'demand':
        return <TrendingUp className="h-4 w-4" />;
      case 'quality':
        return <CheckCircle className="h-4 w-4" />;
      case 'cost':
        return <AlertTriangle className="h-4 w-4" />;
      case 'time':
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          ML Прогнозирование
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={trainModel}
          disabled={training}
          className="w-full hover-lift"
        >
          {training ? 'Обучение модели...' : 'Переобучить модели'}
        </Button>

        <div className="space-y-3">
          {predictions.map((pred) => (
            <div
              key={pred.id}
              className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3 animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(pred.type)}
                  <div>
                    <p className="text-sm font-medium">{pred.title}</p>
                    <p className="text-lg font-bold text-primary mt-1">
                      {pred.value}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    pred.status === 'high'
                      ? 'default'
                      : pred.status === 'medium'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {pred.status === 'high' ? 'Высокая' : pred.status === 'medium' ? 'Средняя' : 'Низкая'}
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Точность прогноза</span>
                  <span className="font-medium">{pred.confidence}%</span>
                </div>
                <Progress value={pred.confidence} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
