import { MoreVertical, Edit, Trash2, Copy, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/use-tasks';
import { useState } from 'react';
import { TaskDialog } from '@/components/tasks/TaskDialog';

interface TaskActionsMenuProps {
  taskId: string;
  taskTitle: string;
  initialTask?: any;
}

export function TaskActionsMenu({ taskId, taskTitle, initialTask }: TaskActionsMenuProps) {
  const { toast } = useToast();
  const { deleteTask } = useTasks();
  const [openEdit, setOpenEdit] = useState(false);

  const handleEdit = () => {
    setOpenEdit(true);
  };

  const handleDuplicate = () => {
    toast({
      title: 'Задача скопирована',
      description: `Создана копия задачи: ${taskTitle}`,
    });
  };

  const handleArchive = () => {
    toast({
      title: 'Задача архивирована',
      description: taskTitle,
    });
  };

  const handleDelete = () => {
    deleteTask(taskId);
    toast({
      title: 'Задача удалена',
      description: taskTitle,
      variant: 'destructive',
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Дублировать
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Архивировать
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskDialog
        mode="edit"
        openExternal={openEdit}
        onOpenChangeExternal={setOpenEdit}
        initialTask={initialTask || { id: taskId, title: taskTitle }}
      />
    </>
  );
}
