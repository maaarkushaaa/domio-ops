import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Task } from "@/types";
import { Calendar, AlertCircle } from "lucide-react";

interface TaskListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  tasks: Task[];
  variant?: 'today' | 'overdue' | 'upcoming';
}

export function TaskListDialog({ open, onOpenChange, title, tasks, variant = 'today' }: TaskListDialogProps) {
  const ruStatus = (status: string) => {
    const map: Record<string, string> = {
      todo: 'К выполнению',
      in_progress: 'В работе',
      review: 'На ревью',
      done: 'Завершено',
    };
    return map[status] || status;
  };

  const ruPriority = (priority: string) => {
    const map: Record<string, string> = {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      urgent: 'Срочный',
    };
    return map[priority] || priority;
  };

  const priorityColor = (priority: string) => {
    const map: Record<string, string> = {
      low: 'bg-blue-500/10 text-blue-500',
      medium: 'bg-yellow-500/10 text-yellow-500',
      high: 'bg-orange-500/10 text-orange-500',
      urgent: 'bg-red-500/10 text-red-500',
    };
    return map[priority] || 'bg-gray-500/10 text-gray-500';
  };

  // Сортируем задачи по дате от ближайшей к дальней
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return dateA - dateB;
  });

  const formatDateRange = (task: Task) => {
    if (!task.due_date) return '—';
    const start = new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const end = (task as any).due_end;
    if (end && end !== task.due_date) {
      return `${start} — ${new Date(end).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
    }
    return start;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'overdue' && <AlertCircle className="h-5 w-5 text-destructive" />}
            {variant === 'upcoming' && <Calendar className="h-5 w-5 text-primary" />}
            {title} ({sortedTasks.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Задачи не найдены
            </div>
          ) : (
            sortedTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge className={priorityColor(task.priority)}>
                        {ruPriority(task.priority)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline">{ruStatus(task.status)}</Badge>
                      {task.project?.name && (
                        <Badge variant="secondary">{task.project.name}</Badge>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDateRange(task)}
                      </div>
                      {(task as any)._comment_count > 0 && (
                        <span className="text-muted-foreground">
                          💬 {(task as any)._comment_count}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

