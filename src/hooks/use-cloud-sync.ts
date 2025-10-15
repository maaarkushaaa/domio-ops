import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export interface CloudProvider {
  id: string;
  provider_type: 'google_drive' | 'dropbox' | 'onedrive' | 'aws_s3' | 'yandex_disk' | 'box' | 'icloud';
  provider_name: string;
  account_email: string | null;
  quota_total: number | null;
  quota_used: number | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'error' | 'paused';
  sync_error: string | null;
  created_at: string;
}

export interface CloudFile {
  id: string;
  provider_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number;
  is_folder: boolean;
  sync_status: 'synced' | 'pending' | 'conflict' | 'error' | 'deleted';
  last_modified_at: string | null;
  last_synced_at: string | null;
}

export interface SyncHistory {
  id: string;
  provider_id: string;
  sync_type: 'full' | 'incremental' | 'manual' | 'automatic';
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  files_processed: number;
  files_uploaded: number;
  files_downloaded: number;
  files_deleted: number;
  bytes_transferred: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

export interface SyncConflict {
  id: string;
  file_id: string;
  conflict_type: string;
  local_version: any;
  remote_version: any;
  resolved: boolean;
  created_at: string;
}

export interface CloudSyncStats {
  total_providers: number;
  active_providers: number;
  total_files: number;
  total_size_bytes: number;
  by_provider: Record<string, {
    files: number;
    size_bytes: number;
    quota_used: number;
    quota_total: number;
  }>;
  recent_syncs: any[];
  unresolved_conflicts: number;
}

export function useCloudSync() {
  const { user } = useApp();
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [history, setHistory] = useState<SyncHistory[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [stats, setStats] = useState<CloudSyncStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Загрузка провайдеров
  const loadProviders = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cloud_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading cloud providers:', error);
    }
  }, [user]);

  // Добавление провайдера
  const addProvider = useCallback(async (
    providerType: CloudProvider['provider_type'],
    providerName: string,
    accessToken: string,
    accountEmail?: string
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cloud_providers')
        .insert({
          user_id: user.id,
          provider_type: providerType,
          provider_name: providerName,
          access_token: accessToken,
          account_email: accountEmail,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await loadProviders();
      return { success: true, provider: data };
    } catch (error) {
      console.error('Error adding provider:', error);
      return { success: false, error: 'Failed to add provider' };
    } finally {
      setLoading(false);
    }
  }, [user, loadProviders]);

  // Удаление провайдера
  const removeProvider = useCallback(async (providerId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cloud_providers')
        .delete()
        .eq('id', providerId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadProviders();
    } catch (error) {
      console.error('Error removing provider:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loadProviders]);

  // Переключение активности провайдера
  const toggleProvider = useCallback(async (providerId: string, isActive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cloud_providers')
        .update({ is_active: isActive })
        .eq('id', providerId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadProviders();
    } catch (error) {
      console.error('Error toggling provider:', error);
    }
  }, [user, loadProviders]);

  // Запуск синхронизации
  const startSync = useCallback(async (
    providerId: string,
    syncType: 'full' | 'incremental' | 'manual' = 'manual'
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('start_cloud_sync', {
        p_user_id: user.id,
        p_provider_id: providerId,
        p_sync_type: syncType
      });

      if (error) throw error;

      await loadProviders();
      await loadHistory();
      
      return { success: true, sync_id: data };
    } catch (error) {
      console.error('Error starting sync:', error);
      return { success: false, error: 'Failed to start sync' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Загрузка файлов
  const loadFiles = useCallback(async (providerId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('cloud_files')
        .select('*')
        .eq('user_id', user.id);

      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query
        .order('file_name', { ascending: true })
        .limit(100);

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }, [user]);

  // Загрузка истории
  const loadHistory = useCallback(async (limit: number = 20) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sync_history')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  }, [user]);

  // Загрузка конфликтов
  const loadConflicts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sync_conflicts')
        .select('*')
        .eq('user_id', user.id)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConflicts(data || []);
    } catch (error) {
      console.error('Error loading conflicts:', error);
    }
  }, [user]);

  // Разрешение конфликта
  const resolveConflict = useCallback(async (
    conflictId: string,
    strategy: 'keep_local' | 'keep_remote' | 'keep_both' | 'manual'
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      const { error } = await supabase.rpc('resolve_sync_conflict', {
        p_conflict_id: conflictId,
        p_user_id: user.id,
        p_resolution_strategy: strategy
      });

      if (error) throw error;

      await loadConflicts();
      await loadFiles();
      
      return { success: true };
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return { success: false, error: 'Failed to resolve conflict' };
    } finally {
      setLoading(false);
    }
  }, [user, loadConflicts, loadFiles]);

  // Загрузка статистики
  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_cloud_sync_stats', {
        p_user_id: user.id
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user]);

  // Форматирование размера файла
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Получение процента использования квоты
  const getQuotaPercentage = useCallback((provider: CloudProvider): number => {
    if (!provider.quota_total || !provider.quota_used) return 0;
    return Math.round((provider.quota_used / provider.quota_total) * 100);
  }, []);

  // Инициализация
  useEffect(() => {
    if (!user) return;

    loadProviders();
    loadHistory();
    loadConflicts();
    loadStats();
  }, [user, loadProviders, loadHistory, loadConflicts, loadStats]);

  // Подписка на изменения
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('cloud-sync-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cloud_providers',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadProviders();
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_history',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadHistory();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_conflicts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadConflicts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadProviders, loadHistory, loadConflicts, loadStats]);

  return {
    providers,
    files,
    history,
    conflicts,
    stats,
    loading,
    addProvider,
    removeProvider,
    toggleProvider,
    startSync,
    loadFiles,
    resolveConflict,
    formatFileSize,
    getQuotaPercentage,
    refresh: () => {
      loadProviders();
      loadHistory();
      loadConflicts();
      loadStats();
    }
  };
}
