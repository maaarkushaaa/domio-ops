import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskComments } from '@/components/tasks/TaskComments';

export function TaskDetailsDialog({ task, trigger }: { task: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{task.title}</span>
            <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)}>Редактировать</Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {task.description && <div className="text-sm">{task.description}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm"><b>Статус:</b> {task.status}</div>
            <div className="text-sm"><b>Приоритет:</b> {task.priority}</div>
            <div className="text-sm"><b>Проект:</b> {task.project?.name || 'Без проекта'}</div>
            <div className="text-sm"><b>Дедлайн:</b> {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '—'}</div>
          </div>

          {/* TODO: теги, чек‑листы, вложения, подзадачи */}
          <TaskComments taskId={task.id} />
        </div>
      </DialogContent>

      <TaskDialog mode="edit" openExternal={openEdit} onOpenChangeExternal={setOpenEdit} initialTask={task} />
    </Dialog>
  );
}
