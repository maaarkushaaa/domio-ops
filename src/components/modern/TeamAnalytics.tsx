import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, TrendingUp, Target, Award } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  tasksCompleted: number;
  tasksInProgress: number;
  performance: number;
  badge: 'gold' | 'silver' | 'bronze' | null;
}

export function TeamAnalytics() {
  const members: TeamMember[] = [
    {
      id: '1',
      name: 'Иванов Иван',
      role: 'Столяр',
      tasksCompleted: 45,
      tasksInProgress: 3,
      performance: 95,
      badge: 'gold',
    },
    {
      id: '2',
      name: 'Петрова Мария',
      role: 'Дизайнер',
      tasksCompleted: 38,
      tasksInProgress: 5,
      performance: 87,
      badge: 'silver',
    },
    {
      id: '3',
      name: 'Сидоров Петр',
      role: 'Монтажник',
      tasksCompleted: 32,
      tasksInProgress: 2,
      performance: 78,
      badge: 'bronze',
    },
  ];

  const getBadgeIcon = (badge: TeamMember['badge']) => {
    if (badge === 'gold') return '🥇';
    if (badge === 'silver') return '🥈';
    if (badge === 'bronze') return '🥉';
    return '';
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Аналитика команды
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Задач выполнено</p>
            <p className="text-2xl font-bold text-primary">115</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">В работе</p>
            <p className="text-2xl font-bold text-success">10</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-muted-foreground">Эффективность</p>
            <p className="text-2xl font-bold text-warning">87%</p>
          </div>
        </div>

        <ScrollArea className="h-72">
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3 animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      {member.badge && (
                        <span className="text-lg">{getBadgeIcon(member.badge)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <Badge variant="outline">{member.performance}%</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-success" />
                    <span className="text-muted-foreground">Завершено:</span>
                    <span className="font-medium">{member.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">В работе:</span>
                    <span className="font-medium">{member.tasksInProgress}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Производительность</span>
                    <span className="font-medium">{member.performance}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${member.performance}%` }}
                    />
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
