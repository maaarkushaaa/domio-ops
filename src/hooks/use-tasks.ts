import { useEffect } from '@/components/ai/AIAssistantAdvanced';
import { useApp } from '@/contexts/AppContext';
import { Task } from '@/contexts/AppContext';
import { sendTelegramNotification } from '@/services/telegram';
import { supabase } from '@/integrations/supabase/client';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export const useTasks = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();

  // Initial load + realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        (data || []).forEach((t: any) => {
          addTask({
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            project_id: t.project_id,
            assignee_id: t.assignee_id,
            due_date: t.due_date,
          } as any);
          updateTask(t.id, { id: t.id, created_at: t.created_at } as any);
        });
      } catch (e) {
        console.error('load tasks error', e);
      }
      channel = supabase
        .channel('tasks_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          const row: any = payload.new || payload.old;
          if (payload.eventType === 'INSERT') {
            addTask({
              title: row.title,
              description: row.description,
              status: row.status,
              priority: row.priority,
              project_id: row.project_id,
              assignee_id: row.assignee_id,
              due_date: row.due_date,
            } as any);
            updateTask(row.id, { id: row.id, created_at: row.created_at } as any);
          } else if (payload.eventType === 'UPDATE') {
            updateTask(row.id, row);
          } else if (payload.eventType === 'DELETE') {
            deleteTask(row.id);
          }
        })
        .subscribe();
    };
    load();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await (supabase as any)
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description || null,
        status: task.status,
        priority: task.priority,
        project_id: (task as any).project_id || null,
        assignee_id: (task as any).assignee_id || null,
        due_date: (task as any).due_date || null,
      })
      .select()
      .single();
    if (error) throw error;
    // optimistic UX
    addTask(task as any);
    updateTask(data.id, { id: data.id, created_at: data.created_at } as any);
    sendTelegramNotification({ title: 'Новая задача', message: `Создана задача: "${task.title}"`, type: 'info' });
    return data;
  };

  const updateTaskWithNotification = async (updates: any) => {
    const { error } = await (supabase as any)
      .from('tasks')
      .update(updates)
      .eq('id', updates.id);
    if (error) throw error;
    updateTask(updates.id, updates);
  };

  const deleteTaskWithSupabase = async (id: string) => {
    const { error } = await (supabase as any)
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    deleteTask(id);
  };

  return {
    tasks,
    isLoading: false,
    createTask,
    updateTask: updateTaskWithNotification,
    deleteTask: deleteTaskWithSupabase,
  };
};
