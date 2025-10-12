import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

export const useProjects = () => {
  const { projects, addProject, updateProject } = useApp();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('projects')
          .select('id, name, description, status, start_date, end_date, created_at')
          .order('created_at', { ascending: true });
        if (error) throw error;
        const seen = new Set<string>();
        (data || []).forEach((p: any) => {
          if (seen.has(p.id)) return; seen.add(p.id);
          addProject({ id: p.id, name: p.name, description: p.description, status: p.status, start_date: p.start_date, created_at: p.created_at } as any);
        });
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
      console.log('Updating project', projectId, 'status to', status);
      const { data, error } = await (supabase as any)
        .from('projects')
        .update({ status })
        .eq('id', projectId)
        .select()
        .single();
      if (error) {
        console.error('Update project error:', error);
        throw error;
      }
      console.log('Project updated successfully', data);
      updateProject(projectId, data);
      return data;
    } catch (err) {
      console.error('Update project failed:', err);
      throw err;
    }
  };

  return {
    projects,
    isLoading: false,
    createProject,
    updateProjectStatus,
  };
};
