import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  CheckSquare,
  Package,
  Users,
  DollarSign,
  FileText,
  Mail,
} from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { useProducts } from '@/hooks/use-products';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'task' | 'project' | 'client' | 'product' | 'email' | 'document';
  icon: React.ReactNode;
  action: () => void;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { clients } = useClients();
  const { products } = useProducts();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search tasks
    tasks
      .filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery) ||
          task.description?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .forEach((task) => {
        newResults.push({
          id: `task-${task.id}`,
          title: task.title,
          subtitle: task.description,
          type: 'task',
          icon: <CheckSquare className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate('/tasks');
          },
        });
      });

    // Search projects
    projects
      .filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery) ||
          project.description?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .forEach((project) => {
        newResults.push({
          id: `project-${project.id}`,
          title: project.name,
          subtitle: project.description,
          type: 'project',
          icon: <Package className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate('/');
          },
        });
      });

    // Search clients
    clients
      .filter(
        (client) =>
          client.name.toLowerCase().includes(searchQuery) ||
          client.company?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .forEach((client) => {
        newResults.push({
          id: `client-${client.id}`,
          title: client.name,
          subtitle: client.company,
          type: 'client',
          icon: <Users className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate('/clients');
          },
        });
      });

    // Search products
    products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery) ||
          product.description?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .forEach((product) => {
        newResults.push({
          id: `product-${product.id}`,
          title: product.name,
          subtitle: product.description,
          type: 'product',
          icon: <Package className="h-4 w-4" />,
          action: () => {
            setOpen(false);
            navigate('/production');
          },
        });
      });

    setResults(newResults);
  }, [query, tasks, projects, clients, products, navigate]);

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels = {
    task: 'Задачи',
    project: 'Проекты',
    client: 'Клиенты',
    product: 'Продукты',
    email: 'Почта',
    document: 'Документы',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Глобальный поиск
          </DialogTitle>
          <DialogDescription>
            Поиск по задачам, проектам, клиентам и продуктам
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Начните вводить для поиска... (Ctrl/Cmd + F)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-base"
            autoFocus
          />

          {results.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {typeLabels[type as keyof typeof typeLabels]}
                    </h4>
                    <div className="space-y-1">
                      {items.map((result) => (
                        <button
                          key={result.id}
                          onClick={result.action}
                          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="mt-0.5">{result.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-sm text-muted-foreground truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[result.type]}
                          </Badge>
                        </button>
                      ))}
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : query ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Ничего не найдено по запросу "{query}"</p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Начните вводить для поиска</p>
              <p className="text-sm mt-2">Ctrl/Cmd + F для быстрого доступа</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
