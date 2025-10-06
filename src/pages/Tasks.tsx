import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, User } from "lucide-react";

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-muted" },
  { id: "todo", title: "К выполнению", color: "bg-primary/10" },
  { id: "inProgress", title: "В работе", color: "bg-warning/10" },
  { id: "review", title: "На ревью", color: "bg-accent/10" },
  { id: "done", title: "Готово", color: "bg-success/10" },
];

const tasks = {
  backlog: [
    { id: 1, title: "Оптимизация модели стола", project: "3D", priority: "low", assignee: "Иван" },
    { id: 2, title: "Обновить базу знаний", project: "Общее", priority: "low", assignee: null },
  ],
  todo: [
    { id: 3, title: "Моделинг шкафа Версаль", project: "3D", priority: "high", assignee: "Мария" },
    { id: 4, title: "Закупка фурнитуры", project: "Закупки", priority: "medium", assignee: "Петр" },
  ],
  inProgress: [
    { id: 5, title: "UV-развертка комода", project: "3D", priority: "high", assignee: "Мария" },
    { id: 6, title: "Подготовка DXF для стола", project: "Производство", priority: "high", assignee: "Иван" },
    { id: 7, title: "Создание BOM для тумбы", project: "Производство", priority: "medium", assignee: "Петр" },
  ],
  review: [
    { id: 8, title: "GLB модель шкафа", project: "3D", priority: "high", assignee: "Мария" },
  ],
  done: [
    { id: 9, title: "Оплата поставщику Мебель+", project: "Финансы", priority: "high", assignee: "Петр" },
    { id: 10, title: "Проверка качества модели", project: "3D", priority: "medium", assignee: "Мария" },
  ],
};

export default function Tasks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Задачи</h1>
          <p className="text-muted-foreground">Канбан-доска проектов</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Новая задача
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card className={column.color}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {column.title}
                    <Badge variant="secondary" className="text-xs">
                      {tasks[column.id as keyof typeof tasks].length}
                    </Badge>
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks[column.id as keyof typeof tasks].map((task) => (
                  <Card key={task.id} className="bg-card hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {task.project}
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
                            {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                          </Badge>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
