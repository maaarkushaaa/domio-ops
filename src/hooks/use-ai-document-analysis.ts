import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export interface DocumentAnalysis {
  id: string;
  document_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  analysis_type: 'ocr' | 'text_extraction' | 'entity_extraction' | 'classification' | 'sentiment' | 'summary' | 'translation' | 'full';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  accuracy_score: number | null;
  confidence_score: number | null;
  language_detected: string | null;
  page_count: number | null;
  word_count: number | null;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AnalysisResult {
  id: string;
  analysis_id: string;
  result_type: 'extracted_text' | 'entities' | 'keywords' | 'summary' | 'metadata' | 'tables' | 'images' | 'signatures' | 'dates' | 'amounts' | 'custom';
  result_data: any;
  confidence: number | null;
  page_number: number | null;
  created_at: string;
}

export interface ExtractedEntity {
  id: string;
  analysis_id: string;
  entity_type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'phone' | 'email' | 'address' | 'contract_number' | 'inn' | 'kpp' | 'account_number' | 'custom';
  entity_value: string;
  entity_label: string | null;
  confidence: number;
  context: string | null;
  page_number: number | null;
  created_at: string;
}

export interface DocumentTemplate {
  id: string;
  template_name: string;
  template_type: 'contract' | 'invoice' | 'receipt' | 'specification' | 'report' | 'letter' | 'custom';
  description: string | null;
  fields: any;
  is_active: boolean;
  is_public: boolean;
  usage_count: number;
}

export interface AnalysisStats {
  total_analyses: number;
  completed: number;
  processing: number;
  failed: number;
  avg_accuracy: number;
  avg_confidence: number;
  avg_processing_time_ms: number;
  total_pages_processed: number;
  total_words_extracted: number;
  by_type: Record<string, number>;
  by_language: Record<string, number>;
  top_entities: Array<{ type: string; count: number }>;
}

export function useAIDocumentAnalysis() {
  const { user } = useApp();
  const [analyses, setAnalyses] = useState<DocumentAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [entities, setEntities] = useState<ExtractedEntity[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Загрузка списка анализов
  const loadAnalyses = useCallback(async (limit: number = 50) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('document_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  }, [user]);

  // Создание нового анализа
  const createAnalysis = useCallback(async (
    fileName: string,
    fileUrl: string,
    fileType: string,
    fileSize: number,
    documentId?: string,
    analysisType: DocumentAnalysis['analysis_type'] = 'full',
    priority: number = 5
  ): Promise<{ success: boolean; analysis_id?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('create_document_analysis', {
        p_user_id: user.id,
        p_document_id: documentId || null,
        p_file_name: fileName,
        p_file_url: fileUrl,
        p_file_type: fileType,
        p_file_size: fileSize,
        p_analysis_type: analysisType,
        p_priority: priority
      });

      if (error) throw error;

      await loadAnalyses();
      return { success: true, analysis_id: data };
    } catch (error) {
      console.error('Error creating analysis:', error);
      return { success: false, error: 'Failed to create analysis' };
    } finally {
      setLoading(false);
    }
  }, [user, loadAnalyses]);

  // Загрузка конкретного анализа
  const loadAnalysis = useCallback(async (analysisId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('document_analysis')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCurrentAnalysis(data);
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  }, [user]);

  // Загрузка результатов анализа
  const loadResults = useCallback(async (analysisId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }, [user]);

  // Загрузка извлечённых сущностей
  const loadEntities = useCallback(async (analysisId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('extracted_entities')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('confidence', { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Error loading entities:', error);
    }
  }, [user]);

  // Загрузка шаблонов
  const loadTemplates = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .or(`is_public.eq.true,user_id.eq.${user.id}`)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, [user]);

  // Применение шаблона
  const applyTemplate = useCallback(async (
    analysisId: string,
    templateId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('apply_template_to_document', {
        p_analysis_id: analysisId,
        p_template_id: templateId
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error applying template:', error);
      return { success: false, error: 'Failed to apply template' };
    }
  }, []);

  // Отмена анализа
  const cancelAnalysis = useCallback(async (analysisId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_analysis_status', {
        p_analysis_id: analysisId,
        p_status: 'cancelled'
      });

      if (error) throw error;
      await loadAnalyses();
    } catch (error) {
      console.error('Error cancelling analysis:', error);
    }
  }, [user, loadAnalyses]);

  // Загрузка статистики
  const loadStats = useCallback(async (days: number = 30) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_analysis_stats', {
        p_user_id: user.id,
        p_days: days
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
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Получение иконки для типа сущности
  const getEntityIcon = useCallback((entityType: string): string => {
    const icons: Record<string, string> = {
      person: '👤',
      organization: '🏢',
      location: '📍',
      date: '📅',
      money: '💰',
      phone: '📞',
      email: '📧',
      address: '🏠',
      contract_number: '📄',
      inn: '🔢',
      kpp: '🔢',
      account_number: '💳'
    };
    return icons[entityType] || '📌';
  }, []);

  // Получение цвета для статуса
  const getStatusColor = useCallback((status: string): string => {
    const colors: Record<string, string> = {
      pending: 'text-gray-500',
      processing: 'text-blue-500',
      completed: 'text-green-500',
      failed: 'text-red-500',
      cancelled: 'text-gray-400'
    };
    return colors[status] || 'text-gray-500';
  }, []);

  // Инициализация
  useEffect(() => {
    if (!user) return;

    loadAnalyses();
    loadTemplates();
    loadStats();
  }, [user, loadAnalyses, loadTemplates, loadStats]);

  // Подписка на изменения в реальном времени
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('ai-analysis-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_analysis',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && currentAnalysis?.id === payload.new.id) {
            setCurrentAnalysis(payload.new as DocumentAnalysis);
          }
          loadAnalyses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analysis_results'
        },
        (payload) => {
          if (currentAnalysis?.id === (payload.new as AnalysisResult).analysis_id) {
            loadResults(currentAnalysis.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentAnalysis, loadAnalyses, loadResults]);

  return {
    analyses,
    currentAnalysis,
    results,
    entities,
    templates,
    stats,
    loading,
    createAnalysis,
    loadAnalysis,
    loadResults,
    loadEntities,
    applyTemplate,
    cancelAnalysis,
    formatFileSize,
    getEntityIcon,
    getStatusColor,
    refresh: () => {
      loadAnalyses();
      loadTemplates();
      loadStats();
    }
  };
}
