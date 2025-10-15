import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export interface Integration {
  id: string;
  integration_type: 'telegram' | 'whatsapp' | 'google_calendar' | 'zapier' | '1c' | 'slack' | 'discord' | 'email' | 'sms' | 'webhook' | 'custom';
  integration_name: string;
  description: string | null;
  is_active: boolean;
  is_configured: boolean;
  config: any;
  webhook_url: string | null;
  rate_limit: number;
  last_sync_at: string | null;
  last_error: string | null;
  error_count: number;
  success_count: number;
  created_at: string;
}

export interface IntegrationEvent {
  id: string;
  integration_id: string;
  event_type: string;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'processing' | 'success' | 'failed' | 'retrying';
  payload: any;
  response: any;
  error_message: string | null;
  created_at: string;
}

export interface IntegrationRule {
  id: string;
  integration_id: string;
  rule_name: string;
  trigger_type: string;
  action_type: string;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
}

export interface IntegrationStats {
  total_integrations: number;
  active_integrations: number;
  configured_integrations: number;
  total_events: number;
  successful_events: number;
  failed_events: number;
  active_rules: number;
  by_type: Record<string, {
    count: number;
    active: number;
    success_count: number;
  }>;
}

export function useIntegrations() {
  const { user } = useApp();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [rules, setRules] = useState<IntegrationRule[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Загрузка интеграций
  const loadIntegrations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  }, [user]);

  // Создание/обновление интеграции
  const upsertIntegration = useCallback(async (
    integrationType: Integration['integration_type'],
    integrationName: string,
    config: any = {},
    webhookUrl?: string
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integrations')
        .upsert({
          user_id: user.id,
          integration_type: integrationType,
          integration_name: integrationName,
          config,
          webhook_url: webhookUrl,
          is_configured: true
        }, {
          onConflict: 'user_id,integration_type'
        })
        .select()
        .single();

      if (error) throw error;

      await loadIntegrations();
      return { success: true, integration: data };
    } catch (error) {
      console.error('Error upserting integration:', error);
      return { success: false, error: 'Failed to save integration' };
    } finally {
      setLoading(false);
    }
  }, [user, loadIntegrations]);

  // Переключение активности интеграции
  const toggleIntegration = useCallback(async (integrationId: string, isActive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('integrations')
        .update({ is_active: isActive })
        .eq('id', integrationId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadIntegrations();
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  }, [user, loadIntegrations]);

  // Удаление интеграции
  const deleteIntegration = useCallback(async (integrationId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loadIntegrations]);

  // Загрузка событий
  const loadEvents = useCallback(async (integrationId?: string, limit: number = 50) => {
    if (!user) return;

    try {
      let query = supabase
        .from('integration_events')
        .select(`
          *,
          integration:integrations(integration_name, integration_type)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }, [user]);

  // Загрузка правил
  const loadRules = useCallback(async (integrationId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('integration_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  }, [user]);

  // Создание правила
  const createRule = useCallback(async (
    integrationId: string,
    ruleName: string,
    triggerType: string,
    actionType: string,
    actionConfig: any,
    triggerConditions: any = {}
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_rules')
        .insert({
          user_id: user.id,
          integration_id: integrationId,
          rule_name: ruleName,
          trigger_type: triggerType,
          trigger_conditions: triggerConditions,
          action_type: actionType,
          action_config: actionConfig
        })
        .select()
        .single();

      if (error) throw error;

      await loadRules();
      return { success: true, rule: data };
    } catch (error) {
      console.error('Error creating rule:', error);
      return { success: false, error: 'Failed to create rule' };
    } finally {
      setLoading(false);
    }
  }, [user, loadRules]);

  // Переключение активности правила
  const toggleRule = useCallback(async (ruleId: string, isActive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('integration_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  }, [user, loadRules]);

  // Удаление правила
  const deleteRule = useCallback(async (ruleId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('integration_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  }, [user, loadRules]);

  // Отправка Telegram сообщения
  const sendTelegramMessage = useCallback(async (
    integrationId: string,
    chatId: number,
    message: string
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('send_telegram_message', {
        p_integration_id: integrationId,
        p_chat_id: chatId,
        p_message: message
      });

      if (error) throw error;
      return { success: true, event_id: data };
    } catch (error) {
      console.error('Error sending telegram message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }, [user]);

  // Создание события календаря
  const createCalendarEvent = useCallback(async (
    integrationId: string,
    title: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    taskId?: string
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('create_calendar_event', {
        p_user_id: user.id,
        p_integration_id: integrationId,
        p_title: title,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
        p_description: description,
        p_task_id: taskId
      });

      if (error) throw error;
      return { success: true, event_id: data };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return { success: false, error: 'Failed to create event' };
    }
  }, [user]);

  // Загрузка статистики
  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_integration_stats', {
        p_user_id: user.id
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user]);

  // Получение иконки для типа интеграции
  const getIntegrationIcon = useCallback((type: string): string => {
    const icons: Record<string, string> = {
      telegram: '📱',
      whatsapp: '💬',
      google_calendar: '📅',
      zapier: '⚡',
      '1c': '📊',
      slack: '💼',
      discord: '🎮',
      email: '📧',
      sms: '📲',
      webhook: '🔗'
    };
    return icons[type] || '🔌';
  }, []);

  // Получение цвета для статуса
  const getStatusColor = useCallback((status: string): string => {
    const colors: Record<string, string> = {
      pending: 'text-gray-500',
      processing: 'text-blue-500',
      success: 'text-green-500',
      failed: 'text-red-500',
      retrying: 'text-yellow-500'
    };
    return colors[status] || 'text-gray-500';
  }, []);

  // Инициализация
  useEffect(() => {
    if (!user) return;

    loadIntegrations();
    loadEvents();
    loadRules();
    loadStats();
  }, [user, loadIntegrations, loadEvents, loadRules, loadStats]);

  // Подписка на изменения
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('integrations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integrations',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadIntegrations();
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_events'
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadIntegrations, loadEvents, loadStats]);

  return {
    integrations,
    events,
    rules,
    stats,
    loading,
    upsertIntegration,
    toggleIntegration,
    deleteIntegration,
    loadEvents,
    createRule,
    toggleRule,
    deleteRule,
    sendTelegramMessage,
    createCalendarEvent,
    getIntegrationIcon,
    getStatusColor,
    refresh: () => {
      loadIntegrations();
      loadEvents();
      loadRules();
      loadStats();
    }
  };
}
