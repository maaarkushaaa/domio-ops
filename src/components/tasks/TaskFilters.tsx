import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

export interface TaskFiltersType {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  tags: string[];
  project: string;
}

interface Props {
  filters: TaskFiltersType;
  onChange: (filters: TaskFiltersType) => void;
}

export function TaskFilters({ filters, onChange }: Props) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: profs } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email');
      setProfiles(profs || []);

      const { data: projs } = await (supabase as any)
        .from('projects')
        .select('id, name')
        .eq('status', 'active');
      setProjects(projs || []);

      const { data: tasks } = await (supabase as any).from('tasks').select('tags');
      const tags = new Set<string>();
      (tasks || []).forEach((t: any) => {
        (t.tags || []).forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    })();
  }, []);

  const update = (partial: Partial<TaskFiltersType>) => {
    onChange({ ...filters, ...partial });
  };

  const reset = () => {
    onChange({
      search: '',
      status: 'all',
      priority: 'all',
      assignee: 'all',
      tags: [],
      project: 'all',
    });
  };

  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.priority !== 'all' ? 1 : 0) +
    (filters.assignee !== 'all' ? 1 : 0) +
    (filters.project !== 'all' ? 1 : 0) +
    filters.tags.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск задач..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <Filter className="h-4 w-4 mr-2" />
          Сбросить {activeCount > 0 && `(${activeCount})`}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="backlog">Бэклог</SelectItem>
            <SelectItem value="todo">К выполнению</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="review">На ревью</SelectItem>
            <SelectItem value="done">Готово</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => update({ priority: v })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Приоритет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все приоритеты</SelectItem>
            <SelectItem value="high">Высокий</SelectItem>
            <SelectItem value="medium">Средний</SelectItem>
            <SelectItem value="low">Низкий</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.assignee} onValueChange={(v) => update({ assignee: v })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Исполнитель" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все исполнители</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name || p.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.project} onValueChange={(v) => update({ project: v })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Проект" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все проекты</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => update({ tags: filters.tags.filter((t) => t !== tag) })}
              />
            </Badge>
          ))}
        </div>
      )}

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Теги:</span>
          {allTags
            .filter((tag) => !filters.tags.includes(tag))
            .map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer"
                onClick={() => update({ tags: [...filters.tags, tag] })}
              >
                {tag}
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}

