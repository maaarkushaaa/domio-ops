import { useApp } from '@/contexts/AppContext';

export const useProjects = () => {
  const { projects, addProject } = useApp();

  return {
    projects,
    isLoading: false,
    createProject: addProject,
  };
};
