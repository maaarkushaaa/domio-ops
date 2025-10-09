import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, TrendingUp, Calendar, CheckCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  category: 'revenue' | 'production' | 'quality' | 'efficiency';
  status: 'on_track' | 'at_risk' | 'achieved';
}

export function GoalsKPI() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Выручка за квартал',
      target: 5000000,
      current: 3800000,
      unit: '₽',
      deadline: '2025-12-31',
      category: 'revenue',
      status: 'on_track',
    },
    {
      id: '2',
      title: 'Произведено изделий',
      target: 150,
      current: 142,
      unit: 'шт',
      deadline: '2025-10-31',
      category: 'production',
      status: 'on_track',
    },
    {
      id: '3',
      title: 'Брак не более',
      target: 3,
      current: 2.1,
      unit: '%',
      deadline: '2025-12-31',
      category: 'quality',
      status: 'achieved',
    },
  ]);

  const [newGoal, setNewGoal] = useState('');
  const { toast } = useToast();

  const addGoal = () => {
    if (!newGoal.trim()) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal,
      target: 100,
      current: 0,
      unit: 'шт',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'production',
      status: 'on_track',
    };

    setGoals([...goals, goal]);
    setNewGoal('');
    toast({
      title: 'Цель создана',
      description: 'Новая цель добавлена в систему',
    });
  };

  const getCategoryIcon = (category: Goal['category']) => {
    switch (category) {
      case 'revenue':
        return '💰';
      case 'production':
        return '🏭';
      case 'quality':
        return '⭐';
      case 'efficiency':
        return '⚡';
    }
  };

  const getProgress = (goal: Goal) => {
    return Math.min(Math.round((goal.current / goal.target) * 100), 100);
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'achieved':
        return 'default';
      case 'on_track':
        return 'secondary';
      case 'at_risk':
        return 'destructive';
    }
  };

  const getStatusText = (status: Goal['status']) => {
    switch (status) {
      case 'achieved':
        return 'Достигнута';
      case 'on_track':
        return 'В процессе';
      case 'at_risk':
        return 'Риск';
    }
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Цели и KPI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Новая цель..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            className="focus-elegant"
          />
          <Button onClick={addGoal} size="icon" className="hover-lift">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = getProgress(goal);

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3 animate-fade-in"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCategoryIcon(goal.category)}</span>
                      <div>
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          До {new Date(goal.deadline).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(goal.status) as any}>
                      {getStatusText(goal.status)}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {goal.current.toLocaleString('ru-RU')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {goal.target.toLocaleString('ru-RU')} {goal.unit}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress >= 100
                            ? 'bg-success'
                            : progress >= 70
                            ? 'bg-primary'
                            : 'bg-warning'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {progress >= 100 && (
                    <div className="flex items-center gap-2 text-success text-xs">
                      <CheckCircle className="h-3 w-3" />
                      Цель достигнута!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
