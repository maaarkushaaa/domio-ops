import { useApp } from '@/contexts/AppContext';
import { Task } from '@/contexts/AppContext';
import { sendTelegramNotification } from '@/services/telegram';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export const useTasks = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();

  const createTask = (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    addTask(task);
    
    sendTelegramNotification({
      title: 'Новая задача',
      message: `Создана задача: "${task.title}"`,
      type: 'info',
    });
  };

  const updateTaskWithNotification = (updates: any) => {
    const task = tasks.find(t => t.id === updates.id);
    updateTask(updates.id, updates);
    
    if (updates.status === 'done' && task?.status !== 'done') {
      sendTelegramNotification({
        title: 'Задача завершена',
        message: `Выполнена задача: "${task?.title}"`,
        type: 'success',
      });
    }
  };

  return {
    tasks,
    isLoading: false,
    createTask,
    updateTask: updateTaskWithNotification,
    deleteTask,
  };
};
