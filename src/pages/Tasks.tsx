import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreVertical, User, Kanban, List, Clock } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskDialog, ProjectDialog } from "@/components/tasks/TaskDialog";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskActionsMenu } from "@/components/tasks/TaskActionsMenu";
import { TaskFilters, TaskFiltersType } from "@/components/tasks/TaskFilters";
import { TimeTracker } from "@/components/modern/TimeTracker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-muted" },
  { id: "todo", title: "К выполнению", color: "bg-primary/10" },
  { id: "in_progress", title: "В работе", color: "bg-warning/10" },
  { id: "review", title: "На ревью", color: "bg-accent/10" },
  { id: "done", title: "Готово", color: "bg-success/10" },
];

export default function Tasks() {
  const { tasks, updateTask } = useTasks();
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<any>('backlog');
  const [filters, setFilters] = useState<TaskFiltersType>({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    tags: [],
    project: 'all',
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = !filters.search || 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description?.toLowerCase().includes(filters.search.toLowerCase());
      const matchStatus = filters.status === 'all' || task.status === filters.status;
      const matchPriority = filters.priority === 'all' || task.priority === filters.priority;
      const matchAssignee = filters.assignee === 'all' || (task as any).assignee_id === filters.assignee;
      const matchProject = filters.project === 'all' || (task as any).project_id === filters.project;
      const matchTags = filters.tags.length === 0 || filters.tags.some(t => (task as any).tags?.includes(t));
      return matchSearch && matchStatus && matchPriority && matchAssignee && matchProject && matchTags;
    });
  }, [tasks, filters]);

  const tasksByColumn = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Задачи</h1>
          <p className="text-muted-foreground">Управление задачами проектов ({filteredTasks.length})</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={view === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
            >
              <Kanban className="h-4 w-4 mr-2" />
              Канбан
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4 mr-2" />
              Список
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Трекер времени
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Учёт времени</DialogTitle>
              </DialogHeader>
              <TimeTracker />
            </DialogContent>
          </Dialog>
          <ProjectDialog trigger={<Button variant="outline">Новый проект</Button>} />
          <TaskDialog
            defaultStatus={dialogStatus}
            openExternal={dialogOpen}
            onOpenChangeExternal={setDialogOpen}
            trigger={
              <Button onClick={() => { setDialogStatus('backlog'); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Новая задача
              </Button>
            }
          />
        </div>
      </div>

      <TaskFilters filters={filters} onChange={setFilters} />

      {view === 'kanban' ? (
        <KanbanBoard filteredTasks={filteredTasks} />
      ) : (
        <div className="space-y-4">
          {columns.map((column) => (
            <Card key={column.id} className={column.color}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {column.title}
                    <Badge variant="secondary" className="text-xs">
                      {tasksByColumn[column.id]?.length || 0}
                    </Badge>
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setDialogStatus(column.id); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(tasksByColumn[column.id] || []).map((task) => (
                  <Card key={task.id} className="bg-card hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                        <TaskActionsMenu taskId={task.id} taskTitle={task.title} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {task.project?.name || 'Без проекта'}
                          </Badge>
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {task.assignee.full_name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
