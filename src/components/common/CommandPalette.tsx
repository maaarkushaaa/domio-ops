import { useEffect, useState, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  Package,
  DollarSign,
  ShoppingCart,
  Users,
  FileText,
  Mail,
  BookOpen,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Search,
  Plus,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { tasks } = useTasks();
  const { projects } = useProjects();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigationCommands: Command[] = [
    {
      id: 'nav-dashboard',
      label: 'Перейти на Дашборд',
      icon: <Home className="h-4 w-4" />,
      action: () => navigate('/'),
      keywords: ['dashboard', 'home', 'главная'],
    },
    {
      id: 'nav-tasks',
      label: 'Перейти к Задачам',
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => navigate('/tasks'),
      keywords: ['tasks', 'задачи', 'todo'],
    },
    {
      id: 'nav-production',
      label: 'Перейти в Производство',
      icon: <Package className="h-4 w-4" />,
      action: () => navigate('/production'),
      keywords: ['production', 'производство'],
    },
    {
      id: 'nav-finance',
      label: 'Перейти в Финансы',
      icon: <DollarSign className="h-4 w-4" />,
      action: () => navigate('/finance'),
      keywords: ['finance', 'финансы', 'деньги'],
    },
    {
      id: 'nav-procurement',
      label: 'Перейти в Закупки',
      icon: <ShoppingCart className="h-4 w-4" />,
      action: () => navigate('/procurement'),
      keywords: ['procurement', 'закупки', 'suppliers'],
    },
    {
      id: 'nav-clients',
      label: 'Перейти к Клиентам',
      icon: <Users className="h-4 w-4" />,
      action: () => navigate('/clients'),
      keywords: ['clients', 'клиенты', 'crm'],
    },
    {
      id: 'nav-documents',
      label: 'Перейти к Документам',
      icon: <FileText className="h-4 w-4" />,
      action: () => navigate('/documents'),
      keywords: ['documents', 'документы', 'files'],
    },
    {
      id: 'nav-email',
      label: 'Открыть Почту',
      icon: <Mail className="h-4 w-4" />,
      action: () => navigate('/email'),
      keywords: ['email', 'почта', 'mail'],
    },
    {
      id: 'nav-knowledge',
      label: 'Перейти в Базу знаний',
      icon: <BookOpen className="h-4 w-4" />,
      action: () => navigate('/knowledge'),
      keywords: ['knowledge', 'база знаний', 'docs'],
    },
    {
      id: 'nav-calendar',
      label: 'Открыть Календарь',
      icon: <Calendar className="h-4 w-4" />,
      action: () => navigate('/calendar'),
      keywords: ['calendar', 'календарь', 'events'],
    },
    {
      id: 'nav-analytics',
      label: 'Перейти в Аналитику',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => navigate('/analytics'),
      keywords: ['analytics', 'аналитика', 'stats'],
    },
    {
      id: 'nav-reports',
      label: 'Открыть Отчеты',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      action: () => navigate('/reports'),
      keywords: ['reports', 'отчеты', 'export'],
    },
    {
      id: 'nav-settings',
      label: 'Открыть Настройки',
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate('/settings'),
      keywords: ['settings', 'настройки', 'config'],
    },
  ];

  const actionCommands: Command[] = [
    {
      id: 'action-new-task',
      label: 'Создать новую задачу',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        navigate('/tasks');
        // TODO: Open task dialog
      },
      keywords: ['new task', 'новая задача', 'create'],
    },
    {
      id: 'action-new-project',
      label: 'Создать новый проект',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        navigate('/');
        // TODO: Open project dialog
      },
      keywords: ['new project', 'новый проект'],
    },
    {
      id: 'action-search',
      label: 'Глобальный поиск',
      icon: <Search className="h-4 w-4" />,
      action: () => {
        // TODO: Open search
      },
      keywords: ['search', 'поиск', 'find'],
    },
  ];

  const themeCommands: Command[] = [
    {
      id: 'theme-light',
      label: 'Светлая тема',
      icon: <Sun className="h-4 w-4" />,
      action: () => setTheme('light'),
      keywords: ['light', 'светлая', 'theme'],
    },
    {
      id: 'theme-dark',
      label: 'Темная тема',
      icon: <Moon className="h-4 w-4" />,
      action: () => setTheme('dark'),
      keywords: ['dark', 'темная', 'theme'],
    },
    {
      id: 'theme-system',
      label: 'Системная тема',
      icon: <Settings className="h-4 w-4" />,
      action: () => setTheme('system'),
      keywords: ['system', 'системная', 'auto'],
    },
  ];

  const recentTasksCommands: Command[] = tasks.slice(0, 5).map((task) => ({
    id: `task-${task.id}`,
    label: `Открыть задачу: ${task.title}`,
    icon: <CheckSquare className="h-4 w-4" />,
    action: () => navigate('/tasks'),
    keywords: [task.title, 'task', 'задача'],
  }));

  const recentProjectsCommands: Command[] = projects.slice(0, 5).map((project) => ({
    id: `project-${project.id}`,
    label: `Открыть проект: ${project.name}`,
    icon: <Package className="h-4 w-4" />,
    action: () => navigate('/'),
    keywords: [project.name, 'project', 'проект'],
  }));

  const handleSelect = useCallback((command: Command) => {
    setOpen(false);
    command.action();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Поиск команд, страниц, задач..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        
        <CommandGroup heading="Навигация">
          {navigationCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => handleSelect(command)}
              className="flex items-center gap-2"
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Действия">
          {actionCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => handleSelect(command)}
              className="flex items-center gap-2"
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Тема">
          {themeCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => handleSelect(command)}
              className="flex items-center gap-2"
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {recentTasksCommands.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Недавние задачи">
              {recentTasksCommands.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => handleSelect(command)}
                  className="flex items-center gap-2"
                >
                  {command.icon}
                  <span>{command.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {recentProjectsCommands.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Недавние проекты">
              {recentProjectsCommands.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => handleSelect(command)}
                  className="flex items-center gap-2"
                >
                  {command.icon}
                  <span>{command.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
