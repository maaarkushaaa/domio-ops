import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit: number;
  allowed_ips: string[] | null;
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  ip_address: string | null;
  resource_type: string | null;
  created_at: string;
}

export interface SecurityStats {
  total_events: number;
  by_severity: Record<string, number>;
  by_event_type: Record<string, number>;
  active_alerts: number;
  api_keys_count: number;
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  verified_at: string | null;
}

export function useSecurity() {
  const { user } = useApp();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [twoFactor, setTwoFactor] = useState<TwoFactorAuth | null>(null);
  const [loading, setLoading] = useState(false);

  // Загрузка API ключей
  const loadApiKeys = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  }, [user]);

  // Создание API ключа
  const createApiKey = useCallback(async (
    name: string,
    permissions: string[] = ['read'],
    rateLimit: number = 1000,
    expiresDays: number | null = null
  ): Promise<{ success: boolean; key?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('generate_api_key', {
        p_user_id: user.id,
        p_name: name,
        p_permissions: permissions,
        p_rate_limit: rateLimit,
        p_expires_days: expiresDays
      });

      if (error) throw error;

      await loadApiKeys();
      return { success: true, key: data.key };
    } catch (error) {
      console.error('Error creating API key:', error);
      return { success: false, error: 'Failed to create API key' };
    } finally {
      setLoading(false);
    }
  }, [user, loadApiKeys]);

  // Удаление API ключа
  const deleteApiKey = useCallback(async (keyId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Логируем удаление
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'api_key_deleted',
        p_severity: 'info',
        p_description: 'API key deleted',
        p_resource_type: 'api_key',
        p_resource_id: keyId
      });

      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loadApiKeys]);

  // Переключение активности ключа
  const toggleApiKey = useCallback(async (keyId: string, isActive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: isActive })
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadApiKeys();
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  }, [user, loadApiKeys]);

  // Загрузка алертов безопасности
  const loadAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading security alerts:', error);
    }
  }, [user]);

  // Обновление статуса алерта
  const updateAlertStatus = useCallback(async (
    alertId: string,
    status: 'open' | 'investigating' | 'resolved' | 'false_positive',
    notes?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          resolved_by: status === 'resolved' ? user.id : null,
          resolution_notes: notes
        })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadAlerts();
    } catch (error) {
      console.error('Error updating alert status:', error);
    }
  }, [user, loadAlerts]);

  // Загрузка журнала аудита
  const loadAuditLog = useCallback(async (limit: number = 100) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('id, event_type, severity, description, ip_address, resource_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAuditLog(data || []);
    } catch (error) {
      console.error('Error loading audit log:', error);
    }
  }, [user]);

  // Загрузка статистики безопасности
  const loadStats = useCallback(async (days: number = 30) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_security_stats', {
        p_user_id: user.id,
        p_days: days
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading security stats:', error);
    }
  }, [user]);

  // Загрузка настроек 2FA
  const load2FA = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_2fa')
        .select('enabled, method, verified_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTwoFactor(data || { enabled: false, method: 'totp', verified_at: null });
    } catch (error) {
      console.error('Error loading 2FA settings:', error);
    }
  }, [user]);

  // Включение 2FA
  const enable2FA = useCallback(async (method: 'totp' | 'sms' | 'email' = 'totp') => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      
      // Создаём или обновляем запись 2FA
      const { error } = await supabase
        .from('user_2fa')
        .upsert({
          user_id: user.id,
          enabled: true,
          method,
          verified_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Логируем включение 2FA
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: '2fa_enabled',
        p_severity: 'info',
        p_description: `2FA enabled with method: ${method}`
      });

      await load2FA();
      return { success: true };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return { success: false, error: 'Failed to enable 2FA' };
    } finally {
      setLoading(false);
    }
  }, [user, load2FA]);

  // Отключение 2FA
  const disable2FA = useCallback(async () => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_2fa')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      // Логируем отключение 2FA
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: '2fa_disabled',
        p_severity: 'warning',
        p_description: '2FA disabled'
      });

      await load2FA();
      return { success: true };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: 'Failed to disable 2FA' };
    } finally {
      setLoading(false);
    }
  }, [user, load2FA]);

  // Инициализация
  useEffect(() => {
    if (!user) return;

    loadApiKeys();
    loadAlerts();
    loadAuditLog();
    loadStats();
    load2FA();
  }, [user, loadApiKeys, loadAlerts, loadAuditLog, loadStats, load2FA]);

  return {
    apiKeys,
    alerts,
    auditLog,
    stats,
    twoFactor,
    loading,
    createApiKey,
    deleteApiKey,
    toggleApiKey,
    updateAlertStatus,
    enable2FA,
    disable2FA,
    refresh: () => {
      loadApiKeys();
      loadAlerts();
      loadAuditLog();
      loadStats();
      load2FA();
    }
  };
}
