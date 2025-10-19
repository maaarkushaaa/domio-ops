import { useCallback, useEffect, useRef, useState } from 'react';
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

  const assigneeProfilesCacheRef = useRef<Record<string, { profile: AssigneeProfile; expiresAt: number }>>({});
  const dependenciesCacheRef = useRef<Record<string, { payload: TaskDependenciesPayload; expiresAt: number }>>({});
  const currentLoadPromiseRef = useRef<Promise<Task[]> | null>(null);
  const CACHE_TTL_MS = 5000;

  const fetchAssigneeProfiles = useCallback(async (rows: any[], { force }: { force?: boolean } = {}) => {
    const ids = Array.from(new Set((rows || []).map((r) => r.assignee_id).filter(Boolean))) as string[];
    if (!ids.length) return new Map<string, AssigneeProfile>();

    const now = Date.now();
    const missingIds: string[] = [];
    const result = new Map<string, AssigneeProfile>();

    ids.forEach((id) => {
      const entry = assigneeProfilesCacheRef.current[id];
      if (!force && entry && entry.expiresAt > now) {
        result.set(id, entry.profile);
      } else {
        missingIds.push(id);
      }
    });

    if (!missingIds.length) {
      return result;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', missingIds);
      if (error) throw error;
      const expiresAt = Date.now() + CACHE_TTL_MS;
      (data || []).forEach((profile: AssigneeProfile) => {
        assigneeProfilesCacheRef.current[profile.id] = { profile, expiresAt };
        result.set(profile.id, profile);
      });
      return result;
    } catch (err) {
      console.warn('[TASKS] Failed to load assignee profiles', err);
      return result;
    }
  }, []);

  const fetchDependencies = useCallback(async (taskIds: string[], { force }: { force?: boolean } = {}) => {
    if (!taskIds.length) return new Map<string, TaskDependenciesPayload>();

    const now = Date.now();
    const result = new Map<string, TaskDependenciesPayload>();
    const missingIds: string[] = [];

    taskIds.forEach((taskId) => {
      const entry = dependenciesCacheRef.current[taskId];
      if (!force && entry && entry.expiresAt > now) {
        result.set(taskId, entry.payload);
      } else {
        missingIds.push(taskId);
      }
    });

    if (!missingIds.length) {
      return result;
    }

    try {
      const chunkSize = 20;
      const chunks: string[][] = [];
      for (let i = 0; i < missingIds.length; i += chunkSize) {
        chunks.push(missingIds.slice(i, i + chunkSize));
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

      const fetched = new Map<string, TaskDependenciesPayload>();

      outgoing.forEach((dep: any) => {
        const list = fetched.get(dep.predecessor_id) || { dependencies_in: [], dependencies_out: [] };
        list.dependencies_out.push({ id: dep.id, to_id: dep.successor_id });
        fetched.set(dep.predecessor_id, list);
      });

      incoming.forEach((dep: any) => {
        const list = fetched.get(dep.successor_id) || { dependencies_in: [], dependencies_out: [] };
        list.dependencies_in.push({ id: dep.id, from_id: dep.predecessor_id });
        fetched.set(dep.successor_id, list);
      });

      const expiresAt = Date.now() + CACHE_TTL_MS;
      missingIds.forEach((taskId) => {
        const payload = fetched.get(taskId) || { dependencies_in: [], dependencies_out: [] };
        dependenciesCacheRef.current[taskId] = { payload, expiresAt };
        result.set(taskId, payload);
      });

      return result;
    } catch (err) {
      console.error('[TASKS] Failed to load dependencies', err);
      return result;
    }
  }, []);

  const isLoadingRef = useRef(false);
  const pendingReloadRef = useRef(false);

  const lastLoadedTasksRef = useRef<Task[]>([]);
  const loadCallIdRef = useRef(0);
  const lastAppliedLoadIdRef = useRef(0);
  const [dependencyCache, setDependencyCache] = useState(new Map<string, TaskDependenciesPayload>());
  const dependencyUpdatesRef = useRef<{ [taskId: string]: number }>({});
  const dependencyRefreshQueueRef = useRef<Set<string>>(new Set());
  const dependencyRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dependencyRefreshInFlightRef = useRef<Promise<void> | null>(null);
  const dependencyRefreshWaitersRef = useRef<Array<() => void>>([]);
  const dependencyRefreshLastRunRef = useRef(0);
  const dependencyRefreshLastAppliedAtRef = useRef<Record<string, number>>({});
  const MIN_DEP_REFRESH_INTERVAL_MS = 350;
  const deletedDependencyIdsRef = useRef(new Map<string, number>());
  const DELETION_SUPPRESSION_WINDOW_MS = 4000;
  const pendingDependencyDeletionsRef = useRef(
    new Map<string, { predecessorId?: string; successorId?: string; startedAt: number }>(),
  );
  const PENDING_DELETION_TIMEOUT_MS = 10000;

  const pruneDeletedDependencies = useCallback(() => {
    const now = Date.now();
    deletedDependencyIdsRef.current.forEach((timestamp, depId) => {
      if (now - timestamp > DELETION_SUPPRESSION_WINDOW_MS) {
        deletedDependencyIdsRef.current.delete(depId);
      }
    });
  }, []);

  const markDependencyDeleted = useCallback((depId?: string | null) => {
    if (!depId) return;
    deletedDependencyIdsRef.current.set(depId, Date.now());
  }, []);

  const isDependencyRecentlyDeleted = useCallback((depId?: string | null) => {
    if (!depId) return false;
    pruneDeletedDependencies();
    return deletedDependencyIdsRef.current.has(depId);
  }, [pruneDeletedDependencies]);

  const prunePendingDependencyDeletions = useCallback(() => {
    const now = Date.now();
    pendingDependencyDeletionsRef.current.forEach((entry, depId) => {
      if (now - entry.startedAt > PENDING_DELETION_TIMEOUT_MS) {
        pendingDependencyDeletionsRef.current.delete(depId);
      }
    });
  }, []);

  const isDependencyDeletionPending = useCallback((depId?: string | null) => {
    if (!depId) return false;
    prunePendingDependencyDeletions();
    return pendingDependencyDeletionsRef.current.has(depId);
  }, [prunePendingDependencyDeletions]);

  const shouldSuppressDependency = useCallback(
    (depId?: string | null) => {
      if (!depId) return false;
      pruneDeletedDependencies();
      prunePendingDependencyDeletions();
      return (
        deletedDependencyIdsRef.current.has(depId) || pendingDependencyDeletionsRef.current.has(depId)
      );
    },
    [pruneDeletedDependencies, prunePendingDependencyDeletions],
  );

  const applyDependencyRemovalImmediate = useCallback(
    (depId?: string | null, predecessorId?: string | null, successorId?: string | null) => {
      if (!depId) return;

      setDependencyCache((prev) => {
        const next = new Map(prev);
        if (predecessorId) {
          const current = next.get(predecessorId) || { dependencies_in: [], dependencies_out: [] };
          next.set(predecessorId, {
            dependencies_in: current.dependencies_in,
            dependencies_out: current.dependencies_out.filter((dep) => dep.id !== depId),
          });
        }
        if (successorId) {
          const current = next.get(successorId) || { dependencies_in: [], dependencies_out: [] };
          next.set(successorId, {
            dependencies_in: current.dependencies_in.filter((dep) => dep.id !== depId),
            dependencies_out: current.dependencies_out,
          });
        }
        return next;
      });

      if (predecessorId) {
        const predecessorTask = tasks.find((task) => task.id === predecessorId);
        if (predecessorTask) {
          const nextOut = (predecessorTask.dependencies_out || []).filter((dep) => dep.id !== depId);
          updateTask(predecessorId, { dependencies_out: nextOut });
        }
      }

      if (successorId) {
        const successorTask = tasks.find((task) => task.id === successorId);
        if (successorTask) {
          const nextIn = (successorTask.dependencies_in || []).filter((dep) => dep.id !== depId);
          updateTask(successorId, { dependencies_in: nextIn });
        }
      }
    },
    [setDependencyCache, tasks, updateTask],
  );

  const dependencyExists = useCallback(async (depId?: string | null): Promise<boolean> => {
    if (!depId) return false;
    const { data, error } = await (supabase as any)
      .from('task_dependencies')
      .select('id')
      .eq('id', depId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.warn('[DEPENDENCY-DELETE] existence check error', depId, error);
      throw error;
    }
    return Boolean(data);
  }, []);

  const verifyDependencyDeletion = useCallback(
    async (depId?: string | null, predecessorId?: string | null, successorId?: string | null) => {
      if (!depId) return true;
      const attempts = 6;
      const baseDelay = 180;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const exists = await dependencyExists(depId);
        if (!exists) {
          console.debug('[DEPENDENCY-DELETE] verification succeeded', depId, 'attempt', attempt + 1);
          applyDependencyRemovalImmediate(depId, predecessorId, successorId);
          return true;
        }
        console.warn('[DEPENDENCY-DELETE] verification: dependency still exists', depId, 'attempt', attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, baseDelay * (attempt + 1)));
        const { error } = await (supabase as any)
          .from('task_dependencies')
          .delete()
          .eq('id', depId);
        if (error && error.code !== 'PGRST116') {
          console.warn('[DEPENDENCY-DELETE] re-delete attempt failed', depId, error);
        }
      }
      return false;
    },
    [applyDependencyRemovalImmediate, dependencyExists],
  );

  const loadTasks = useCallback(async (): Promise<Task[]> => {
    const callId = ++loadCallIdRef.current;
    if (currentLoadPromiseRef.current && isLoadingRef.current) {
      pendingReloadRef.current = true;
      return currentLoadPromiseRef.current;
    }
    isLoadingRef.current = true;
    const promise = (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('tasks')
          .select(TASK_SELECT)
          .order('order', { ascending: true });
        if (error) throw error;

        const profilesById = await fetchAssigneeProfiles(data || []);
        const depsByTaskId = await fetchDependencies((data || []).map((row: any) => row.id));

        const transformed = (data || []).map((row: any) => mapTaskRow(row, profilesById, depsByTaskId.get(row.id)));

        if (callId < lastAppliedLoadIdRef.current) {
          return lastLoadedTasksRef.current;
        }

        const now = Date.now();
        deletedDependencyIdsRef.current.forEach((timestamp, depId) => {
          if (now - timestamp > DELETION_SUPPRESSION_WINDOW_MS) {
            deletedDependencyIdsRef.current.delete(depId);
          }
        });

        lastLoadedTasksRef.current = transformed;
        lastAppliedLoadIdRef.current = callId;
        transformed.forEach((task) => {
          addTask(task);
        });
        return transformed;
      } catch (e) {
        console.error('load tasks error', e);
        return lastLoadedTasksRef.current;
      } finally {
        isLoadingRef.current = false;
        currentLoadPromiseRef.current = null;
        if (pendingReloadRef.current) {
          pendingReloadRef.current = false;
          void loadTasks();
        }
      }
    })();

    currentLoadPromiseRef.current = promise;
    return promise;
  }, [addTask, fetchAssigneeProfiles, fetchDependencies]);

  const markDependencyDirty = useCallback((taskId: string) => {
    dependencyUpdatesRef.current[taskId] = Date.now();
  }, []);

  const executeDependencyRefresh = useCallback(
    async (taskIds: string[]) => {
      if (!taskIds.length) return;
      const uniqueIds = Array.from(new Set(taskIds.filter(Boolean)));
      if (!uniqueIds.length) return;

      try {
        console.debug('[TASKS][DEP-REFRESH] fetch start', uniqueIds);
        const depsMap = await fetchDependencies(uniqueIds);
        setDependencyCache((prev) => {
          const next = new Map(prev);
          uniqueIds.forEach((taskId) => {
            const payload = depsMap.get(taskId) || { dependencies_in: [], dependencies_out: [] };
            const suppressedIn = (payload.dependencies_in || []).filter((dep) => shouldSuppressDependency(dep.id));
            const suppressedOut = (payload.dependencies_out || []).filter((dep) => shouldSuppressDependency(dep.id));
            if (suppressedIn.length || suppressedOut.length) {
              console.debug('[TASKS][DEP-REFRESH] suppress entries for task', taskId, {
                in: suppressedIn.map((dep) => dep.id),
                out: suppressedOut.map((dep) => dep.id),
              });
            }
            next.set(taskId, {
              dependencies_in: (payload.dependencies_in || []).filter((dep) => !shouldSuppressDependency(dep.id)),
              dependencies_out: (payload.dependencies_out || []).filter((dep) => !shouldSuppressDependency(dep.id)),
            });
          });
          return next;
        });

        uniqueIds.forEach((taskId) => {
          const data = depsMap.get(taskId) || { dependencies_in: [], dependencies_out: [] };
          const suppressedIn = (data.dependencies_in || []).filter((dep) => shouldSuppressDependency(dep.id));
          const suppressedOut = (data.dependencies_out || []).filter((dep) => shouldSuppressDependency(dep.id));
          if (suppressedIn.length || suppressedOut.length) {
            console.debug('[TASKS][DEP-REFRESH] suppress state update for task', taskId, {
              in: suppressedIn.map((dep) => dep.id),
              out: suppressedOut.map((dep) => dep.id),
            });
          }
          updateTask(taskId, {
            dependencies_in: (data.dependencies_in || []).filter((dep) => !shouldSuppressDependency(dep.id)),
            dependencies_out: (data.dependencies_out || []).filter((dep) => !shouldSuppressDependency(dep.id)),
          });
        });
      } catch (err) {
        console.warn('[TASKS] Failed to refresh dependency tasks', uniqueIds, err);
      } finally {
        console.debug('[TASKS][DEP-REFRESH] fetch finished', uniqueIds);
      }
    },
    [fetchDependencies, shouldSuppressDependency, updateTask],
  );

  const flushDependencyRefresh = useCallback(async () => {
    dependencyRefreshTimerRef.current = null;
    if (dependencyRefreshInFlightRef.current) {
      try {
        await dependencyRefreshInFlightRef.current;
      } catch (err) {
        console.warn('[TASKS] Pending dependency refresh failed', err);
      }
    }

    const queue = dependencyRefreshQueueRef.current;
    const taskIds = Array.from(queue);
    queue.clear();

    const refreshPromise = executeDependencyRefresh(taskIds);
    dependencyRefreshInFlightRef.current = refreshPromise;
    try {
      await refreshPromise;
      dependencyRefreshLastRunRef.current = Date.now();
      taskIds.forEach((taskId) => {
        dependencyRefreshLastAppliedAtRef.current[taskId] = dependencyRefreshLastRunRef.current;
      });
      console.debug('[TASKS][DEP-REFRESH] flush applied', taskIds);
    } finally {
      dependencyRefreshInFlightRef.current = null;
      const waiters = dependencyRefreshWaitersRef.current.splice(0);
      waiters.forEach((resolve) => resolve());
      if (dependencyRefreshQueueRef.current.size) {
        dependencyRefreshTimerRef.current = setTimeout(() => {
          dependencyRefreshTimerRef.current = null;
          void flushDependencyRefresh();
        }, 60);
      }
    }
  }, [executeDependencyRefresh]);

  const scheduleDependencyRefresh = useCallback(
    (taskIds: (string | undefined | null)[], options?: { force?: boolean }): Promise<void> => {
      const filtered = taskIds.filter((id): id is string => Boolean(id));
      if (!filtered.length) {
        console.debug('[TASKS][DEP-REFRESH] enqueue skipped (empty input)');
        return Promise.resolve();
      }

      const now = Date.now();
      const enqueued: string[] = [];
      filtered.forEach((taskId) => {
        if (!options?.force) {
          const lastApplied = dependencyRefreshLastAppliedAtRef.current[taskId] ?? 0;
          if (now - lastApplied < MIN_DEP_REFRESH_INTERVAL_MS) {
            console.debug('[TASKS][DEP-REFRESH] enqueue skipped (recently refreshed)', taskId);
            return;
          }
        }

        if (dependencyRefreshQueueRef.current.has(taskId) && !options?.force) {
          console.debug('[TASKS][DEP-REFRESH] enqueue skipped (already queued)', taskId);
          return;
        }

        dependencyRefreshQueueRef.current.add(taskId);
        enqueued.push(taskId);
      });

      if (!enqueued.length) {
        return dependencyRefreshTimerRef.current || dependencyRefreshInFlightRef.current
          ? new Promise<void>((resolve) => dependencyRefreshWaitersRef.current.push(resolve))
          : Promise.resolve();
      }

      console.debug('[TASKS][DEP-REFRESH] enqueue', enqueued, 'queue size', dependencyRefreshQueueRef.current.size);

      return new Promise<void>((resolve) => {
        dependencyRefreshWaitersRef.current.push(resolve);

        if (!dependencyRefreshTimerRef.current) {
          dependencyRefreshTimerRef.current = setTimeout(() => {
            dependencyRefreshTimerRef.current = null;
            void flushDependencyRefresh();
          }, 120);
        }
      });
    },
    [flushDependencyRefresh],
  );

  const applyRealtimeDependencyChange = useCallback(
    async (payload: any) => {
      const depId: string | undefined = payload.new?.id ?? payload.old?.id;
      const predecessorId: string | undefined = payload.new?.predecessor_id ?? payload.old?.predecessor_id;
      // ...
      const successorId: string | undefined = payload.new?.successor_id ?? payload.old?.successor_id;

      if (!depId || !predecessorId || !successorId) {
        return;
      }

      markDependencyDirty(predecessorId);
      markDependencyDirty(successorId);

      console.debug('[TASKS][REALTIME] event', payload.eventType, 'dep', depId, 'from', predecessorId, 'to', successorId);

      switch (payload.eventType) {
        case 'INSERT':
          if (isDependencyRecentlyDeleted(depId) || isDependencyDeletionPending(depId)) {
            console.debug('[TASKS] Skip realtime INSERT for pending/recently deleted dependency', depId);
            break;
          }
          if (pendingDependencyDeletionsRef.current.has(depId)) {
            console.debug('[TASKS] Skip realtime INSERT because deletion pending', depId);
            break;
          }
          if (deletedDependencyIdsRef.current.has(depId)) {
            console.debug('[TASKS] Skip realtime INSERT because dependency marked deleted', depId);
            break;
          }
          if (shouldSuppressDependency(depId)) {
            console.debug('[TASKS] Skip realtime INSERT because dependency suppressed', depId);
            break;
          }
          setDependencyCache((prev) => {
            const next = new Map(prev);
            const sourceOut = next.get(predecessorId)?.dependencies_out || [];
            const sourceIn = next.get(successorId)?.dependencies_in || [];
            next.set(predecessorId, {
              dependencies_out: sourceOut.some((dep) => dep.id === depId)
                ? sourceOut
                : [...sourceOut, { id: depId, to_id: successorId }],
              dependencies_in: next.get(predecessorId)?.dependencies_in || [],
            });
            next.set(successorId, {
              dependencies_in: sourceIn.some((dep) => dep.id === depId)
                ? sourceIn
                : [...sourceIn, { id: depId, from_id: predecessorId }],
              dependencies_out: next.get(successorId)?.dependencies_out || [],
            });
            return next;
          });
          break;
        case 'DELETE':
          markDependencyDeleted(depId);
          applyDependencyRemovalImmediate(depId, predecessorId, successorId);
          break;
        case 'UPDATE':
          void scheduleDependencyRefresh([predecessorId, successorId, payload.old?.predecessor_id, payload.old?.successor_id]);
          break;
        default:
          break;
      }

      void scheduleDependencyRefresh([predecessorId, successorId]);
    },
    [markDependencyDirty, scheduleDependencyRefresh],
  );

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

    const profilesById = await fetchAssigneeProfiles([data], { force: false });
    const depsByTaskId = await fetchDependencies([data.id], { force: false });

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_dependencies' }, applyRealtimeDependencyChange)
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
      const depsByTaskId = await fetchDependencies([data.id], { force: true });
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.error('[DEPENDENCY-CREATE] Failed to fetch current user', authError);
        throw authError;
      }
      if (!user?.id) {
        throw new Error('Не удалось определить текущего пользователя для зависимости');
      }

      const { data, error } = await (supabase as any)
        .from('task_dependencies')
        .insert({
          predecessor_id: predecessorId,
          successor_id: successorId,
          created_by: user.id,
        })
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

      console.debug('[DEPENDENCY-DELETE] start', dependencyId, predecessorId, successorId);

      if (!predecessorId || !successorId) {
        const { data: existingRow, error: fetchError } = await (supabase as any)
          .from('task_dependencies')
          .select('id, predecessor_id, successor_id')
          .eq('id', dependencyId)
          .maybeSingle();
        if (fetchError) throw fetchError;
        predecessorId = predecessorId ?? existingRow?.predecessor_id;
        successorId = successorId ?? existingRow?.successor_id;
      }

      pendingDependencyDeletionsRef.current.set(dependencyId, {
        predecessorId,
        successorId,
        startedAt: Date.now(),
      });
      applyDependencyRemovalImmediate(dependencyId, predecessorId, successorId);

      const { error: deleteError } = await (supabase as any)
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);
      if (deleteError) throw deleteError;

      markDependencyDeleted(dependencyId);
      await scheduleDependencyRefresh([predecessorId, successorId]);

      const verified = await verifyDependencyDeletion(dependencyId, predecessorId, successorId);
      if (!verified) {
        console.error('[DEPENDENCY-DELETE] verification failed after retries', dependencyId);
        throw new Error('Не удалось подтвердить удаление зависимости. Попробуйте позже.');
      }

      pendingDependencyDeletionsRef.current.delete(dependencyId);

      console.debug('[DEPENDENCY-DELETE] completed', dependencyId, 'pending size', pendingDependencyDeletionsRef.current.size);
    } catch (err) {
      console.error('[DEPENDENCY-DELETE] Failed to delete dependency:', err);
      pendingDependencyDeletionsRef.current.delete(dependencyId);
      throw err;
    }
  };

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
