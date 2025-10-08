import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';

export function ProjectTimeline() {
  const { projects } = useProjects();
  const { tasks } = useTasks();

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.project_id === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter((t) => t.status === 'done').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const getProjectStatus = (project: any) => {
    const progress = getProjectProgress(project.id);
    if (progress === 100) return { label: 'Завершен', variant: 'default' as const };
    if (progress > 70) return { label: 'Близок к завершению', variant: 'default' as const };
    if (progress > 30) return { label: 'В процессе', variant: 'secondary' as const };
    return { label: 'Начало', variant: 'outline' as const };
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />

        <div className="space-y-8">
          {projects.map((project, index) => {
            const progress = getProjectProgress(project.id);
            const status = getProjectStatus(project);
            const daysRemaining = getDaysRemaining(project.end_date);
            const projectTasks = tasks.filter((t) => t.project_id === project.id);

            return (
              <div key={project.id} className="relative pl-20 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                {/* Timeline dot */}
                <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-primary ring-4 ring-background animate-scale-in" />

                <Card className="hover-lift glass-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{progress}%</div>
                        <p className="text-xs text-muted-foreground">Прогресс</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={progress} className="h-2" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {project.start_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Начало</p>
                            <p className="font-medium">
                              {new Date(project.start_date).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                      )}

                      {project.end_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Окончание</p>
                            <p className="font-medium">
                              {new Date(project.end_date).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                      )}

                      {daysRemaining !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Осталось дней</p>
                            <p className={`font-medium ${daysRemaining < 7 ? 'text-destructive' : ''}`}>
                              {daysRemaining > 0 ? daysRemaining : 'Просрочен'}
                            </p>
                          </div>
                        </div>
                      )}

                      {project.budget && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Бюджет</p>
                            <p className="font-medium">{project.budget.toLocaleString('ru-RU')} ₽</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{projectTasks.length} задач</span>
                        <span>•</span>
                        <span>{projectTasks.filter((t) => t.status === 'done').length} выполнено</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
