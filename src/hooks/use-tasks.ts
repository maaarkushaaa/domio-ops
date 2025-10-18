import { useCallback, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Task } from '@/contexts/AppContext';
import { sendTelegramNotification } from '@/services/telegram';
import { supabase } from '@/integrations/supabase/client';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

type AssigneeProfile = {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string | null;
};

const TASK_SELECT = `*,
  comment_count:task_comments(count),
  checklist_count:task_checklists(count),
  project:projects(id,name)
`;

type TaskDependenciesPayload = {
  dependencies_in: { id: string; from_id: string }[];
  dependencies_out: { id: string; to_id: string }[];
};

const mapTaskRow = (
  row: any,
  profilesById?: Map<string, AssigneeProfile>,
  deps?: TaskDependenciesPayload,
): Task => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  status: row.status,
  priority: row.priority,
  project_id: row.project_id || undefined,
  project: row.project ?? null,
  assignee_id: row.assignee_id || undefined,
  assignee: profilesById?.get(row.assignee_id) ?? (row.assignee ?? null) ?? null,
  due_date: row.due_date || undefined,
  due_end: row.due_end || undefined,
  tags: row.tags ?? undefined,
  parent_task_id: row.parent_task_id || null,
  order: row.order ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  _comment_count: row.comment_count?.[0]?.count || 0,
  _checklist_count: row.checklist_count?.[0]?.count || 0,
  dependencies_in: deps?.dependencies_in || [],
  dependencies_out: deps?.dependencies_out || [],
});

export const useTasks = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();

  const fetchAssigneeProfiles = useCallback(async (rows: any[]) => {
    const ids = Array.from(new Set((rows || []).map((r) => r.assignee_id).filter(Boolean))) as string[];
    if (!ids.length) return new Map<string, AssigneeProfile>();
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', ids);
      if (error) throw error;
      return new Map<string, AssigneeProfile>((data || []).map((profile: AssigneeProfile) => [profile.id, profile]));
    } catch (err) {
      console.warn('[TASKS] Failed to load assignee profiles', err);
      return new Map<string, AssigneeProfile>();
    }
  }, []);

  const fetchDependencies = useCallback(async (taskIds: string[]) => {
    if (!taskIds.length) return new Map<string, TaskDependenciesPayload>();
    try {
      const chunkSize = 20;
      const chunks: string[][] = [];
      for (let i = 0; i < taskIds.length; i += chunkSize) {
        chunks.push(taskIds.slice(i, i + chunkSize));
      }

      const collect = async (column: 'predecessor_id' | 'successor_id') => {
        const collected: any[] = [];
        for (const chunk of chunks) {
          const { data, error } = await (supabase as any)
            .from('task_dependencies')
            .select('id, predecessor_id, successor_id')
            .in(column, chunk);
          if (error) throw error;
          collected.push(...(data || []));
        }
        return collected;
      };

      const [outgoing, incoming] = await Promise.all([
        collect('predecessor_id'),
        collect('successor_id'),
      ]);

      const depsMap = new Map<string, TaskDependenciesPayload>();

      outgoing.forEach((dep: any) => {
        const list = depsMap.get(dep.predecessor_id) || { dependencies_in: [], dependencies_out: [] };
        list.dependencies_out.push({ id: dep.id, to_id: dep.successor_id });
        depsMap.set(dep.predecessor_id, list);
      });

      incoming.forEach((dep: any) => {
        const list = depsMap.get(dep.successor_id) || { dependencies_in: [], dependencies_out: [] };
        list.dependencies_in.push({ id: dep.id, from_id: dep.predecessor_id });
        depsMap.set(dep.successor_id, list);
      });

      return depsMap;
    } catch (err) {
      console.error('[TASKS] Failed to load dependencies', err);
      return new Map<string, TaskDependenciesPayload>();
    }
  }, []);

  const isLoadingRef = useRef(false);
  const pendingReloadRef = useRef(false);

  const lastLoadedTasksRef = useRef<Task[]>([]);

  const loadTasks = useCallback(async (): Promise<Task[]> => {
    if (isLoadingRef.current) {
      pendingReloadRef.current = true;
      return lastLoadedTasksRef.current;
    }
    isLoadingRef.current = true;
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select(TASK_SELECT)
        .order('order', { ascending: true });
      if (error) throw error;

      const profilesById = await fetchAssigneeProfiles(data || []);
      const depsByTaskId = await fetchDependencies((data || []).map((row: any) => row.id));

      const transformed = (data || []).map((row: any) => mapTaskRow(row, profilesById, depsByTaskId.get(row.id)));
      lastLoadedTasksRef.current = transformed;
      transformed.forEach((task) => {
        addTask(task);
      });
      return transformed;
    } catch (e) {
      console.error('load tasks error', e);
      return lastLoadedTasksRef.current;
    } finally {
      isLoadingRef.current = false;
      if (pendingReloadRef.current) {
        pendingReloadRef.current = false;
        void loadTasks();
      }
    }
  }, [addTask, fetchAssigneeProfiles, fetchDependencies]);

  const fetchTaskDetails = useCallback(async (taskId: string) => {
    const { data, error } = await (supabase as any)
      .from('tasks')
      .select(TASK_SELECT)
      .eq('id', taskId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Task not found');
    }

    const profilesById = await fetchAssigneeProfiles([data]);
    const depsByTaskId = await fetchDependencies([data.id]);

    return mapTaskRow(data, profilesById, depsByTaskId.get(data.id));
  }, [fetchAssigneeProfiles, fetchDependencies]);

  // Initial load + realtime
  useEffect(() => {
    loadTasks();

    const tasksChannel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, async (payload) => {
        const row: any = payload.new;
        try {
          const full = await fetchTaskDetails(row.id);
          addTask(full);
        } catch (error) {
          console.error('Failed to fetch inserted task details', error);
          addTask(row);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, async (payload) => {
        const row: any = payload.new;
        try {
          const full = await fetchTaskDetails(row.id);
          addTask(full);
        } catch (error) {
          console.error('Failed to fetch updated task details', error);
          updateTask(row.id, row);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (payload) => {
        const row: any = payload.old;
        deleteTask(row.id);
      })
      .subscribe();

    const dependenciesChannel = supabase
      .channel('task_dependencies_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_dependencies' }, async () => {
        await loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(dependenciesChannel);
    };
  }, [addTask, deleteTask, fetchTaskDetails, loadTasks, updateTask]);

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
        tags: (task as any).tags || null,
        parent_task_id: (task as any).parent_task_id || null,
        order: (task as any).order ?? null,
      })
      .select(TASK_SELECT)
      .single();
    if (error) throw error;
    const profilesById = await fetchAssigneeProfiles([data]);
    const depsByTaskId = await fetchDependencies([data.id]);
    addTask(mapTaskRow(data, profilesById, depsByTaskId.get(data.id)));
    sendTelegramNotification({ title: 'Новая задача', message: `Создана задача: "${task.title}"`, type: 'info' });
    
    // Добавляем уведомление в систему
    if ((window as any).notifyTaskCreated) {
      (window as any).notifyTaskCreated(task.title);
    }
    
    return data;
  };

  const updateTaskWithNotification = async (updates: any) => {
    try {
      console.log('[TASK-UPDATE] Updating task', updates.id, 'with', updates);
      const { data, error } = await (supabase as any)
        .from('tasks')
        .update(updates)
        .eq('id', updates.id)
        .select(TASK_SELECT)
        .single();
      if (error) {
        console.error('[TASK-UPDATE] Update task error:', error);
        throw error;
      }
      console.log('[TASK-UPDATE] Task updated successfully, received data:', data);
      
      // Transform data to match expected format
      const profilesById = await fetchAssigneeProfiles([data]);
      const depsByTaskId = await fetchDependencies([data.id]);
      const transformedData = mapTaskRow(data, profilesById, depsByTaskId.get(data.id));
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
      
      // Добавляем уведомление в систему
      if ((window as any).notifyTaskUpdated) {
        (window as any).notifyTaskUpdated(data.title);
      }
    } catch (err) {
      console.error('[TASK-UPDATE] Update task failed:', err);
      alert('Ошибка при обновлении задачи: ' + (err as any)?.message);
      throw err;
    }
  };

  const deleteTaskWithSupabase = async (id: string) => {
    // Получаем название задачи перед удалением для уведомления
    const task = tasks.find(t => t.id === id);
    const taskTitle = task?.title || 'Неизвестная задача';
    
    const { error } = await (supabase as any)
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    deleteTask(id);
    
    // Добавляем уведомление в систему
    if ((window as any).notifyTaskDeleted) {
      (window as any).notifyTaskDeleted(taskTitle);
    }
  };

  const createDependency = async (predecessorId: string, successorId: string) => {
    if (!predecessorId || !successorId) {
      throw new Error('Не выбраны задачи для зависимости');
    }
    if (predecessorId === successorId) {
      throw new Error('Задача не может зависеть сама от себя');
    }

    try {
      const { data, error } = await (supabase as any)
        .from('task_dependencies')
        .insert({ predecessor_id: predecessorId, successor_id: successorId })
        .select('id, predecessor_id, successor_id')
        .single();
      if (error) throw error;
      const predecessorTask = tasks.find((t) => t.id === predecessorId);
      if (predecessorTask) {
        const nextOut = [...(predecessorTask.dependencies_out ?? [])];
        if (!nextOut.some((dep) => dep.to_id === successorId)) {
          nextOut.push({ id: data.id, to_id: successorId });
          addTask({ ...predecessorTask, dependencies_out: nextOut } as Task);
        }
      }

      const successorTask = tasks.find((t) => t.id === successorId);
      if (successorTask) {
        const nextIn = [...(successorTask.dependencies_in ?? [])];
        if (!nextIn.some((dep) => dep.from_id === predecessorId)) {
          nextIn.push({ id: data.id, from_id: predecessorId });
          addTask({ ...successorTask, dependencies_in: nextIn } as Task);
        }
      }

      return data;
    } catch (err) {
      console.error('[DEPENDENCY-CREATE] Failed to create dependency:', err);
      throw err;
    }
  };

  const deleteDependency = async (
    dependencyId: string,
    meta?: { predecessorId?: string; successorId?: string },
  ) => {
    if (!dependencyId) return;
    try {
      let predecessorId = meta?.predecessorId;
      let successorId = meta?.successorId;

      if (!predecessorId || !successorId) {
        const { data: depRow, error: fetchError } = await (supabase as any)
          .from('task_dependencies')
          .select('predecessor_id, successor_id')
          .eq('id', dependencyId)
          .maybeSingle();
        if (fetchError) throw fetchError;
        predecessorId = predecessorId ?? depRow?.predecessor_id;
        successorId = successorId ?? depRow?.successor_id;
      }

      const { error } = await (supabase as any)
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);
      if (error) throw error;

      if (predecessorId) {
        const predecessorTask = tasks.find((t) => t.id === predecessorId);
        if (predecessorTask) {
          const nextOut = (predecessorTask.dependencies_out ?? []).filter((dep) => dep.id !== dependencyId);
          updateTask(predecessorId, { dependencies_out: nextOut });
        }
      }

      if (successorId) {
        const successorTask = tasks.find((t) => t.id === successorId);
        if (successorTask) {
          const nextIn = (successorTask.dependencies_in ?? []).filter((dep) => dep.id !== dependencyId);
          updateTask(successorId, { dependencies_in: nextIn });
        }
      }

      const maxAttempts = 6;
      const baseDelay = 200;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const { data: checkData, error: checkError } = await (supabase as any)
          .from('task_dependencies')
          .select('id')
          .eq('id', dependencyId)
          .maybeSingle();
        if (checkError && checkError.code !== 'PGRST116') {
          console.warn('[DEPENDENCY-DELETE] Verify deletion error:', checkError);
          break;
        }
        if (!checkData) {
          await loadTasks();
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, baseDelay * (attempt + 1)));
      }

      await loadTasks();
    } catch (err) {
      console.error('[DEPENDENCY-DELETE] Failed to delete dependency:', err);
      throw err;
    }
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
      
      // Добавляем уведомление в систему
      if ((window as any).notifyCommentAdded) {
        const task = tasks.find(t => t.id === taskId);
        const taskTitle = task?.title || 'Неизвестная задача';
        (window as any).notifyCommentAdded(taskTitle, 'Пользователь');
      }
      
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
    createTask,
    updateTask: updateTaskWithNotification,
    deleteTask: deleteTaskWithSupabase,
    createDependency,
    deleteDependency,
    createComment,
    listComments,
  };
};
