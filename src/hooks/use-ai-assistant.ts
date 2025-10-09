import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TaskSuggestion {
  title: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface DeadlinePrediction {
  estimated_days: number;
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
}

interface ResourceAllocation {
  people_needed: number;
  materials: string[];
  budget_estimate?: number;
  recommendations: string[];
}

export function useAIAssistant() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const suggestTasks = async (text: string): Promise<TaskSuggestion[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { text, type: 'suggest' }
      });

      if (error) throw error;

      return data.suggestions || [];
    } catch (error) {
      console.error('Error suggesting tasks:', error);
      toast({
        title: 'Ошибка AI',
        description: 'Не удалось сгенерировать предложения задач',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const predictDeadline = async (text: string): Promise<DeadlinePrediction | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { text, type: 'deadline' }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error predicting deadline:', error);
      toast({
        title: 'Ошибка AI',
        description: 'Не удалось спрогнозировать срок',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const allocateResources = async (text: string): Promise<ResourceAllocation | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { text, type: 'allocate' }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error allocating resources:', error);
      toast({
        title: 'Ошибка AI',
        description: 'Не удалось распределить ресурсы',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    suggestTasks,
    predictDeadline,
    allocateResources,
  };
}