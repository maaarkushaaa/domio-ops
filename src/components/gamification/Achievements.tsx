import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Award, TrendingUp } from 'lucide-react';

const achievements = [
  { id: 1, title: 'Быстрая работа', icon: Zap, description: 'Завершил 10 задач за неделю', unlocked: true, progress: 100 },
  { id: 2, title: 'Мастер качества', icon: Star, description: 'Без замечаний в 20 проектах', unlocked: true, progress: 100 },
  { id: 3, title: 'Командный игрок', icon: Target, description: 'Помог 5 коллегам', unlocked: false, progress: 60 },
  { id: 4, title: 'Новатор', icon: Award, description: 'Предложил 3 улучшения', unlocked: false, progress: 33 },
  { id: 5, title: 'Марафонец', icon: Trophy, description: 'Завершил 100 задач', unlocked: false, progress: 75 },
  { id: 6, title: 'Рост навыков', icon: TrendingUp, description: 'Прошел 5 обучений', unlocked: false, progress: 40 },
];

const leaderboard = [
  { name: 'Иван Петров', points: 1250, tasks: 45, avatar: '👨‍💼' },
  { name: 'Анна Сидорова', points: 1180, tasks: 42, avatar: '👩‍💻' },
  { name: 'Петр Козлов', points: 1050, tasks: 38, avatar: '👨‍🔧' },
  { name: 'Мария Волкова', points: 980, tasks: 35, avatar: '👩‍🎨' },
  { name: 'Дмитрий Новиков', points: 920, tasks: 32, avatar: '👨‍💻' },
];

export function Achievements() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            Достижения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card key={achievement.id} className={`p-4 ${achievement.unlocked ? 'bg-muted/50' : 'opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        {achievement.unlocked && (
                          <Badge variant="default">
                            <Star className="h-3 w-3 mr-1" />
                            Получено
                          </Badge>
                        )}
                      </div>
                      {!achievement.unlocked && (
                        <div className="space-y-1">
                          <Progress value={achievement.progress} />
                          <p className="text-xs text-muted-foreground">{achievement.progress}% завершено</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Рейтинг сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold">
                  {index + 1}
                </div>
                <div className="text-2xl">{user.avatar}</div>
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.tasks} задач завершено</p>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {user.points}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
