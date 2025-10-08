import { useApp } from '@/contexts/AppContext';

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
