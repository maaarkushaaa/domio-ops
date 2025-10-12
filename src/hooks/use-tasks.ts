import { useEffect } from 'react';
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
        // Подсчёт комментариев через подзапрос + связь с проектом
        const { data, error } = await (supabase as any)
          .from('tasks')
          .select('*, comment_count:task_comments(count), project:projects(id,name)')
          .order('order', { ascending: true });
        if (error) throw error;
        (data || []).forEach((t: any) => {
          addTask({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            project_id: t.project_id,
            assignee_id: t.assignee_id,
            due_date: t.due_date,
            due_end: t.due_end, // ✅ Добавлено!
            created_at: t.created_at,
            updated_at: t.updated_at,
            _comment_count: t.comment_count?.[0]?.count || 0,
            project: t.project,
          } as any);
        });
      } catch (e) {
        console.error('load tasks error', e);
      }
      channel = supabase
        .channel('tasks_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
          const row: any = payload.new;
          addTask({
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            project_id: row.project_id,
            assignee_id: row.assignee_id,
            due_date: row.due_date,
            due_end: row.due_end, // ✅ Добавлено!
            created_at: row.created_at,
            updated_at: row.updated_at,
          } as any);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
          const row: any = payload.new;
          updateTask(row.id, row);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (payload) => {
          const row: any = payload.old;
          deleteTask(row.id);
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
        due_end: (task as any).due_end || null,
      })
      .select()
      .single();
    if (error) throw error;
    // add with DB id (realtime may also insert same id; addTask in context dedupes by id)
    addTask({ id: data.id, ...data } as any);
    sendTelegramNotification({ title: 'Новая задача', message: `Создана задача: "${task.title}"`, type: 'info' });
    return data;
  };

  const updateTaskWithNotification = async (updates: any) => {
    try {
      console.log('[TASK-UPDATE] Updating task', updates.id, 'with', updates);
      const { data, error } = await (supabase as any)
        .from('tasks')
        .update(updates)
        .eq('id', updates.id)
        .select('*, comment_count:task_comments(count), project:projects(id,name)')
        .single();
      if (error) {
        console.error('[TASK-UPDATE] Update task error:', error);
        throw error;
      }
      console.log('[TASK-UPDATE] Task updated successfully, received data:', data);
      
      // Transform data to match expected format
      const transformedData = {
        ...data,
        _comment_count: data.comment_count?.[0]?.count || 0,
      };
      updateTask(updates.id, transformedData);
      console.log('[TASK-UPDATE] Local state updated');

      // Log activity
      await (supabase as any)
        .from('task_activity')
        .insert({
          task_id: updates.id,
          actor_id: (await supabase.auth.getUser()).data.user?.id,
          event: `Задача обновлена`,
          payload: updates,
        });
      console.log('[TASK-UPDATE] Activity logged');
    } catch (err) {
      console.error('[TASK-UPDATE] Update task failed:', err);
      alert('Ошибка при обновлении задачи: ' + (err as any)?.message);
      throw err;
    }
  };

  const deleteTaskWithSupabase = async (id: string) => {
    const { error } = await (supabase as any)
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    deleteTask(id);
  };

  // Comments API
  const createComment = async (taskId: string, authorId: string, content: string) => {
    try {
      console.log('[COMMENT-CREATE] Creating comment for task', taskId, 'by', authorId, 'content:', content);
      const { data, error } = await (supabase as any)
        .from('task_comments')
        .insert({ task_id: taskId, author_id: authorId, content })
        .select()
        .single();
      if (error) {
        console.error('[COMMENT-CREATE] Create comment error:', error);
        throw error;
      }
      console.log('[COMMENT-CREATE] Comment created successfully, data:', data);
      return data;
    } catch (err) {
      console.error('[COMMENT-CREATE] Create comment failed:', err);
      alert('Ошибка при создании комментария: ' + (err as any)?.message);
      throw err;
    }
  };

  const listComments = async (taskId: string) => {
    console.log('[COMMENT-LIST] Fetching comments for task', taskId);
    
    // Сначала получаем комментарии
    const { data: commentsData, error: commentsError } = await (supabase as any)
      .from('task_comments')
      .select('id, content, created_at, author_id')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    
    if (commentsError) {
      console.error('[COMMENT-LIST] Error fetching comments:', commentsError);
      throw commentsError;
    }
    
    if (!commentsData || commentsData.length === 0) {
      console.log('[COMMENT-LIST] No comments found');
      return [];
    }
    
    // Затем получаем профили авторов
    const authorIds = [...new Set(commentsData.map((c: any) => c.author_id))];
    const { data: profilesData, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .in('id', authorIds);
    
    if (profilesError) {
      console.error('[COMMENT-LIST] Error fetching profiles:', profilesError);
      // Продолжаем без профилей
    }
    
    // Объединяем данные
    const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
    const result = commentsData.map((c: any) => ({
      ...c,
      author: profilesMap.get(c.author_id) || { full_name: 'Пользователь', email: '' }
    }));
    
    console.log('[COMMENT-LIST] Fetched', result.length, 'comments with profiles');
    return result;
  };

  return {
    tasks,
    isLoading: false,
    createTask,
    updateTask: updateTaskWithNotification,
    deleteTask: deleteTaskWithSupabase,
    createComment,
    listComments,
  };
};
