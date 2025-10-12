import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, User, Calendar, MessageCircle } from 'lucide-react';
import { useTasks, TaskStatus } from '@/hooks/use-tasks';
import { Task } from '@/contexts/AppContext';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskActionsMenu } from '@/components/tasks/TaskActionsMenu';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'backlog', title: 'Бэклог', color: 'bg-muted' },
  { id: 'todo', title: 'К выполнению', color: 'bg-primary/10' },
  { id: 'in_progress', title: 'В работе', color: 'bg-warning/10' },
  { id: 'review', title: 'На ревью', color: 'bg-accent/10' },
  { id: 'done', title: 'Готово', color: 'bg-success/10' },
];

export function KanbanBoard() {
  const { tasks, updateTask } = useTasks();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [openFor, setOpenFor] = useState<TaskStatus | null>(null);

  const tasksByColumn = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (columnId: TaskStatus) => {
    if (draggedTask && draggedTask.status !== columnId) {
      const colTasks = tasksByColumn[columnId] || [];
      const newOrder = colTasks.length > 0 ? Math.max(...colTasks.map((t: any) => t.order || 0)) + 1 : 0;
      await updateTask({
        id: draggedTask.id,
        status: columnId,
        order: newOrder,
      });
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          <Card className={`${column.color} h-full`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {column.title}
                  <Badge variant="secondary" className="text-xs">
                    {tasksByColumn[column.id]?.length || 0}
                  </Badge>
                </CardTitle>
                <TaskDialog
                  defaultStatus={column.id}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setOpenFor(column.id); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                  openExternal={openFor === column.id}
                  onOpenChangeExternal={(v) => setOpenFor(v ? column.id : null)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
              {(tasksByColumn[column.id] || []).map((task) => (
                <Card
                  key={task.id}
                  className="bg-card hover:shadow-lg transition-all cursor-move animate-fade-in hover-lift"
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <TaskDetailsDialog task={task} trigger={
                        <h4 className="text-sm font-medium leading-tight flex-1 hover:underline cursor-pointer">
                          {task.title}
                        </h4>
                      } />
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          <span>{(task as any)._comment_count || 0}</span>
                        </div>
                        <TaskActionsMenu taskId={task.id} taskTitle={task.title} initialTask={task} />
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {task.project?.name || 'Без проекта'}
                      </Badge>
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {task.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{task.assignee.full_name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.due_date).toLocaleDateString('ru-RU')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!tasksByColumn[column.id] || tasksByColumn[column.id].length === 0) && (
                <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed rounded-lg">
                  Перетащите задачу сюда
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
