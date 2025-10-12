import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

export const useProjects = () => {
  const { projects, addProject, setProjects, updateProject, deleteProject } = useApp();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('projects')
          .select('id, name, description, status, start_date, end_date, created_at')
          .order('created_at', { ascending: true });
        if (error) throw error;
        
        // Используем setProjects для полной перезаписи списка (решает проблему с удалением)
        setProjects((data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          start_date: p.start_date,
          end_date: p.end_date,
          created_at: p.created_at
        })));
      } catch (e) {
        console.error('load projects error', e);
      }

      channel = supabase
        .channel('projects_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, (payload) => {
          const row: any = payload.new;
          addProject({ id: row.id, name: row.name, description: row.description, status: row.status, start_date: row.start_date, created_at: row.created_at } as any);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects' }, (payload) => {
          const row: any = payload.new;
          updateProject(row.id, row);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'projects' }, (payload) => {
          const row: any = payload.old;
          deleteProject(row.id);
        })
        .subscribe();
    };

    load();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const createProject = async (project: any) => {
    try {
      const { data, error } = await (supabase as any)
        .from('projects')
        .insert({
          name: project.name,
          description: project.description || null,
          status: project.status || 'active',
          start_date: project.start_date || new Date().toISOString(),
          end_date: project.end_date || null,
        })
        .select()
        .single();
      if (error) throw error;
      addProject({ id: data.id, name: data.name, description: data.description, status: data.status, start_date: data.start_date, created_at: data.created_at } as any);
      return data;
    } catch (e) {
      console.error('createProject error', e);
      throw e;
    }
  };

  const updateProjectStatus = async (projectId: string, status: 'active' | 'archived') => {
    try {
      console.log('[PROJECT-UPDATE] Updating project', projectId, 'status to', status);
      const { data, error } = await (supabase as any)
        .from('projects')
        .update({ status })
        .eq('id', projectId)
        .select()
        .single();
      if (error) {
        console.error('[PROJECT-UPDATE] Update project error:', error);
        throw error;
      }
      console.log('[PROJECT-UPDATE] Project updated successfully, received data:', data);
      updateProject(projectId, data);
      console.log('[PROJECT-UPDATE] Local state updated');
      return data;
    } catch (err) {
      console.error('[PROJECT-UPDATE] Update project failed:', err);
      throw err;
    }
  };

  const deleteProjectFromDB = async (projectId: string) => {
    try {
      console.log('[PROJECT-DELETE] Starting delete for project', projectId);
      
      // Сначала проверяем, существует ли проект
      const { data: existing, error: checkError } = await (supabase as any)
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();
      
      if (checkError) {
        console.error('[PROJECT-DELETE] Project check failed:', checkError);
        throw checkError;
      }
      
      console.log('[PROJECT-DELETE] Project exists:', existing);
      
      const { data: deleteResult, error } = await (supabase as any)
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select(); // Получаем удалённый проект для подтверждения
      
      if (error) {
        console.error('[PROJECT-DELETE] Delete failed:', error);
        throw error;
      }
      
      console.log('[PROJECT-DELETE] Delete successful, deleted:', deleteResult);
      
      // Удаляем из локального стейта немедленно (оптимистичное обновление)
      deleteProject(projectId);
      console.log('[PROJECT-DELETE] Local state updated');
      
      return true;
    } catch (err) {
      console.error('[PROJECT-DELETE] Delete project failed:', err);
      throw err;
    }
  };

  return {
    projects,
    isLoading: false,
    createProject,
    updateProjectStatus,
    deleteProject: deleteProjectFromDB,
  };
};
