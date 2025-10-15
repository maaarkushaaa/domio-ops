import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ActiveUser {
  user_id: string;
  user_email: string;
  user_name: string;
  status: 'online' | 'away' | 'offline';
  activity: string;
  last_activity: string;
  current_entity_type?: string;
  current_entity_id?: string;
}

export interface CollaborativeLock {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  lock_type: 'soft' | 'hard';
  acquired_at: string;
  expires_at: string;
}

export interface UserCursor {
  id: string;
  user_id: string;
  user_name: string;
  position: {
    x: number;
    y: number;
    field?: string;
  };
  color: string;
}

interface UseRealtimeCollaborationOptions {
  entityType?: string;
  entityId?: string;
  enableCursors?: boolean;
}

export function useRealtimeCollaboration(options: UseRealtimeCollaborationOptions = {}) {
  const { user } = useApp();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [locks, setLocks] = useState<CollaborativeLock[]>([]);
  const [cursors, setCursors] = useState<UserCursor[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Генерация уникального session ID
  const generateSessionId = useCallback(() => {
    return `${user?.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, [user?.id]);

  // Создание/обновление сессии
  const createOrUpdateSession = useCallback(async (sid: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          session_id: sid,
          status: 'online',
          current_entity_type: options.entityType,
          current_entity_id: options.entityId,
          last_activity: new Date().toISOString(),
        }, {
          onConflict: 'session_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating/updating session:', error);
    }
  }, [user, options.entityType, options.entityId]);

  // Обновление активности пользователя
  const updateActivity = useCallback(async (
    activityType: 'viewing' | 'editing' | 'commenting' | 'creating' | 'deleting' | 'moving' | 'sharing',
    entityType: string,
    entityId: string,
    entityName?: string,
    details?: Record<string, any>
  ) => {
    if (!sessionId) return;

    try {
      const { error } = await supabase.rpc('update_user_activity', {
        p_session_id: sessionId,
        p_activity_type: activityType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_entity_name: entityName,
        p_details: details || {}
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [sessionId]);

  // Получение блокировки
  const acquireLock = useCallback(async (
    entityType: string,
    entityId: string,
    lockType: 'soft' | 'hard' = 'soft',
    durationMinutes: number = 5
  ): Promise<{ success: boolean; error?: string; lock_id?: string }> => {
    if (!sessionId) {
      return { success: false, error: 'No active session' };
    }

    try {
      const { data, error } = await supabase.rpc('acquire_collaborative_lock', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_session_id: sessionId,
        p_lock_type: lockType,
        p_duration_minutes: durationMinutes
      });

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return { success: false, error: 'Failed to acquire lock' };
    }
  }, [sessionId]);

  // Освобождение блокировки
  const releaseLock = useCallback(async (
    entityType: string,
    entityId: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('collaborative_locks')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }, [user]);

  // Обновление позиции курсора
  const updateCursor = useCallback(async (
    entityType: string,
    entityId: string,
    position: { x: number; y: number; field?: string },
    color: string = '#3b82f6'
  ) => {
    if (!sessionId || !options.enableCursors) return;

    try {
      const { error } = await supabase
        .from('user_cursors')
        .upsert({
          session_id: sessionId,
          user_id: user?.id,
          entity_type: entityType,
          entity_id: entityId,
          position,
          color,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id,entity_type,entity_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }, [sessionId, user?.id, options.enableCursors]);

  // Загрузка активных пользователей
  const loadActiveUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_users', {
        p_entity_type: options.entityType,
        p_entity_id: options.entityId
      });

      if (error) throw error;
      setActiveUsers(data || []);
    } catch (error) {
      console.error('Error loading active users:', error);
    }
  }, [options.entityType, options.entityId]);

  // Загрузка блокировок
  const loadLocks = useCallback(async () => {
    if (!options.entityType || !options.entityId) return;

    try {
      const { data, error } = await supabase
        .from('collaborative_locks')
        .select('*')
        .eq('entity_type', options.entityType)
        .eq('entity_id', options.entityId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      setLocks(data || []);
    } catch (error) {
      console.error('Error loading locks:', error);
    }
  }, [options.entityType, options.entityId]);

  // Загрузка курсоров
  const loadCursors = useCallback(async () => {
    if (!options.enableCursors || !options.entityType || !options.entityId) return;

    try {
      const { data, error } = await supabase
        .from('user_cursors')
        .select(`
          *,
          user:user_id (
            email,
            raw_user_meta_data
          )
        `)
        .eq('entity_type', options.entityType)
        .eq('entity_id', options.entityId)
        .neq('user_id', user?.id);

      if (error) throw error;
      
      const formattedCursors = (data || []).map((cursor: any) => ({
        id: cursor.id,
        user_id: cursor.user_id,
        user_name: cursor.user?.raw_user_meta_data?.name || cursor.user?.email || 'Unknown',
        position: cursor.position,
        color: cursor.color
      }));
      
      setCursors(formattedCursors);
    } catch (error) {
      console.error('Error loading cursors:', error);
    }
  }, [options.enableCursors, options.entityType, options.entityId, user?.id]);

  // Heartbeat для поддержания сессии активной
  const startHeartbeat = useCallback((sid: string) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(async () => {
      if (!user) return;

      try {
        await supabase
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString(),
            status: 'online'
          })
          .eq('session_id', sid);
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 30000); // Каждые 30 секунд
  }, [user]);

  // Очистка неактивных сессий
  const startCleanup = useCallback(() => {
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
    }

    cleanupIntervalRef.current = setInterval(async () => {
      try {
        await supabase.rpc('cleanup_inactive_sessions');
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 60000); // Каждую минуту
  }, []);

  // Подписка на изменения в реальном времени
  const subscribeToChanges = useCallback(() => {
    if (!user) return;

    const channel = supabase.channel('collaboration-channel');

    // Подписка на сессии
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_sessions'
      },
      () => {
        loadActiveUsers();
      }
    );

    // Подписка на активности
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_activities'
      },
      () => {
        loadActiveUsers();
      }
    );

    // Подписка на блокировки
    if (options.entityType && options.entityId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaborative_locks',
          filter: `entity_type=eq.${options.entityType}`
        },
        () => {
          loadLocks();
        }
      );
    }

    // Подписка на курсоры
    if (options.enableCursors && options.entityType && options.entityId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cursors',
          filter: `entity_type=eq.${options.entityType}`
        },
        () => {
          loadCursors();
        }
      );
    }

    channel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    channelRef.current = channel;
  }, [user, options.entityType, options.entityId, options.enableCursors, loadActiveUsers, loadLocks, loadCursors]);

  // Инициализация
  useEffect(() => {
    if (!user) return;

    const sid = generateSessionId();
    setSessionId(sid);

    // Создаём сессию
    createOrUpdateSession(sid);

    // Загружаем начальные данные
    loadActiveUsers();
    if (options.entityType && options.entityId) {
      loadLocks();
      if (options.enableCursors) {
        loadCursors();
      }
    }

    // Запускаем heartbeat и cleanup
    startHeartbeat(sid);
    startCleanup();

    // Подписываемся на изменения
    subscribeToChanges();

    // Cleanup при размонтировании
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      
      // Помечаем сессию как offline
      if (sid) {
        supabase
          .from('user_sessions')
          .update({ status: 'offline' })
          .eq('session_id', sid)
          .then();
      }
    };
  }, [user, generateSessionId, createOrUpdateSession, loadActiveUsers, loadLocks, loadCursors, 
      startHeartbeat, startCleanup, subscribeToChanges, options.entityType, options.entityId, options.enableCursors]);

  return {
    activeUsers,
    locks,
    cursors,
    sessionId,
    isConnected,
    updateActivity,
    acquireLock,
    releaseLock,
    updateCursor,
    refresh: loadActiveUsers
  };
}
