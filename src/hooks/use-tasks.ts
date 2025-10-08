import { useApp } from '@/contexts/AppContext';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export const useTasks = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();

  return {
    tasks,
    isLoading: false,
    createTask: addTask,
    updateTask: (updates: any) => updateTask(updates.id, updates),
    deleteTask,
  };
};
