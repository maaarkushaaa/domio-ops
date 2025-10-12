import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QualityChecklist {
  id: string;
  name: string;
  description?: string;
  product_type?: string;
  is_template: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QualityCheck {
  id: string;
  checklist_id: string;
  name: string;
  category: 'visual' | 'measurements' | 'functionality' | 'finish' | 'other';
  description?: string;
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface QualityInspection {
  id: string;
  product_id: string;
  checklist_id: string;
  inspector_id?: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed';
  score?: number;
  notes?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  product?: any;
  checklist?: QualityChecklist;
  inspector?: any;
}

export interface QualityInspectionResult {
  id: string;
  inspection_id: string;
  check_id: string;
  checked: boolean;
  notes?: string;
  checked_at?: string;
  created_at: string;
  check?: QualityCheck;
}

export function useQualityControl() {
  const [checklists, setChecklists] = useState<QualityChecklist[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка чек-листов
  const loadChecklists = async () => {
    const { data, error } = await (supabase as any)
      .from('quality_checklists')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setChecklists(data);
    }
  };

  // Загрузка проверок
  const loadInspections = async () => {
    const { data, error } = await (supabase as any)
      .from('quality_inspections')
      .select(`
        *,
        product:products(id, name, status),
        checklist:quality_checklists(id, name),
        inspector:profiles(id, full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setInspections(data);
    }
  };

  // Загрузка пунктов чек-листа
  const loadChecks = async (checklistId: string): Promise<QualityCheck[]> => {
    const { data, error } = await (supabase as any)
      .from('quality_checks')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('sort_order', { ascending: true });
    
    return error ? [] : data;
  };

  // Загрузка результатов проверки
  const loadInspectionResults = async (inspectionId: string): Promise<QualityInspectionResult[]> => {
    const { data, error } = await (supabase as any)
      .from('quality_inspection_results')
      .select(`
        *,
        check:quality_checks(*)
      `)
      .eq('inspection_id', inspectionId);
    
    return error ? [] : data;
  };

  // Создание чек-листа
  const createChecklist = async (checklist: Partial<QualityChecklist>) => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await (supabase as any)
      .from('quality_checklists')
      .insert({
        ...checklist,
        created_by: userData.user?.id
      })
      .select()
      .single();
    
    if (!error) {
      await loadChecklists();
      return data;
    }
    return null;
  };

  // Обновление чек-листа
  const updateChecklist = async (id: string, updates: Partial<QualityChecklist>) => {
    const { error } = await (supabase as any)
      .from('quality_checklists')
      .update(updates)
      .eq('id', id);
    
    if (!error) {
      await loadChecklists();
      return true;
    }
    return false;
  };

  // Удаление чек-листа
  const deleteChecklist = async (id: string) => {
    const { error } = await (supabase as any)
      .from('quality_checklists')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await loadChecklists();
      return true;
    }
    return false;
  };

  // Добавление пункта проверки
  const addCheck = async (check: Partial<QualityCheck>) => {
    const { data, error } = await (supabase as any)
      .from('quality_checks')
      .insert(check)
      .select()
      .single();
    
    return error ? null : data;
  };

  // Обновление пункта проверки
  const updateCheck = async (id: string, updates: Partial<QualityCheck>) => {
    const { error } = await (supabase as any)
      .from('quality_checks')
      .update(updates)
      .eq('id', id);
    
    return !error;
  };

  // Удаление пункта проверки
  const deleteCheck = async (id: string) => {
    const { error } = await (supabase as any)
      .from('quality_checks')
      .delete()
      .eq('id', id);
    
    return !error;
  };

  // Создание проверки изделия
  const createInspection = async (productId: string, checklistId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const { data: inspection, error } = await (supabase as any)
      .from('quality_inspections')
      .insert({
        product_id: productId,
        checklist_id: checklistId,
        inspector_id: userData.user?.id,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error || !inspection) return null;

    // Загружаем пункты чек-листа и создаём результаты
    const checks = await loadChecks(checklistId);
    const results = checks.map(check => ({
      inspection_id: inspection.id,
      check_id: check.id,
      checked: false
    }));

    await (supabase as any)
      .from('quality_inspection_results')
      .insert(results);
    
    await loadInspections();
    return inspection;
  };

  // Обновление результата проверки
  const toggleCheckResult = async (resultId: string, checked: boolean) => {
    const { error } = await (supabase as any)
      .from('quality_inspection_results')
      .update({
        checked,
        checked_at: checked ? new Date().toISOString() : null
      })
      .eq('id', resultId);
    
    return !error;
  };

  // Завершение проверки
  const completeInspection = async (inspectionId: string, status: 'passed' | 'failed', notes?: string) => {
    // Загружаем результаты для подсчёта оценки
    const results = await loadInspectionResults(inspectionId);
    const totalChecks = results.length;
    const checkedCount = results.filter(r => r.checked).length;
    const score = totalChecks > 0 ? Math.round((checkedCount / totalChecks) * 100) : 0;

    const { error } = await (supabase as any)
      .from('quality_inspections')
      .update({
        status,
        score,
        notes,
        completed_at: new Date().toISOString()
      })
      .eq('id', inspectionId);
    
    if (!error) {
      await loadInspections();
      return true;
    }
    return false;
  };

  // Начальная загрузка
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadChecklists(), loadInspections()]);
      setIsLoading(false);
    };
    load();

    // Realtime подписки
    const checklistsChannel = supabase
      .channel('quality_checklists_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quality_checklists' }, loadChecklists)
      .subscribe();

    const inspectionsChannel = supabase
      .channel('quality_inspections_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quality_inspections' }, loadInspections)
      .subscribe();

    return () => {
      supabase.removeChannel(checklistsChannel);
      supabase.removeChannel(inspectionsChannel);
    };
  }, []);

  return {
    checklists,
    inspections,
    isLoading,
    loadChecks,
    loadInspectionResults,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    addCheck,
    updateCheck,
    deleteCheck,
    createInspection,
    toggleCheckResult,
    completeInspection,
  };
}

