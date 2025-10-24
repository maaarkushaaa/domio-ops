import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks, TaskStatus, TaskPriority } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { DragDropZone } from '@/components/files/DragDropZone';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TaskDialogProps {
  trigger?: React.ReactNode;
  onClose?: () => void;
  defaultStatus?: TaskStatus;
  openExternal?: boolean;
  onOpenChangeExternal?: (open: boolean) => void;
  mode?: 'create' | 'edit';
  initialTask?: any;
}

export function TaskDialog({ trigger, onClose, defaultStatus = 'backlog', openExternal, onOpenChangeExternal, mode = 'create', initialTask }: TaskDialogProps) {
  const [open, setOpenState] = useState(false);
  const openState = openExternal ?? open;
  const setOpen = (v: boolean) => {
    if (onOpenChangeExternal) onOpenChangeExternal(v);
    else setOpenState(v);
  };
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>([]);
  const [dueRange, setDueRange] = useState<{ from?: Date; to?: Date }>({});
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const { createTask, updateTask } = useTasks();
  const { projects } = useProjects();

  useEffect(() => { setStatus(defaultStatus); }, [defaultStatus]);

  useEffect(() => {
    if (mode === 'edit' && initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setStatus(initialTask.status || defaultStatus);
      setPriority(initialTask.priority || 'medium');
      setProjectId(initialTask.project_id || '');
      setAssigneeId(initialTask.assignee_id || '');
      if (initialTask.due_date) {
        setDueDate(initialTask.due_date);
        try { 
          setDueRange({ 
            from: new Date(initialTask.due_date),
            to: initialTask.due_end ? new Date(initialTask.due_end) : undefined
          }); 
        } catch {}
      }
    }
  }, [mode, initialTask, defaultStatus]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
      setProfiles((data || []).map((p: any) => ({ id: p.id, name: p.full_name || (p.email ? String(p.email).split('@')[0] : 'Пользователь') })));
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    // Форматируем даты без timezone issues
    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const due_from = dueRange.from ? formatDateLocal(dueRange.from) : (dueDate || null);
    const due_to = dueRange.to ? formatDateLocal(dueRange.to) : null;

    if (mode === 'edit' && initialTask?.id) {
      await updateTask({
        id: initialTask.id,
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        project_id: projectId,
        assignee_id: assigneeId || null,
        due_date: due_from || null,
        due_end: due_to as any,
        order: initialTask.order || 0,
      });
    } else {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        project_id: projectId,
        assignee_id: assigneeId || null,
        due_date: due_from || null,
        due_end: due_to as any,
        order: 0,
      } as any);
    }

    setTitle('');
    setDescription('');
    setStatus(defaultStatus);
    setPriority('medium');
    setProjectId('');
    setAssigneeId('');
    setDueDate('');
    setDueRange({});
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={openState} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Редактировать задачу' : 'Создать задачу'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название задачи"
                required
                className="flex-1"
              />
              <VoiceInput onTranscript={(text) => setTitle(text)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <div className="flex gap-2">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание задачи"
                rows={3}
                className="flex-1"
              />
              <VoiceInput onTranscript={(text) => setDescription(text)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Проект</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите проект" />
                </SelectTrigger>
                <SelectContent>
                  {(projects || []).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">К выполнению</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="review">На ревью</SelectItem>
                  <SelectItem value="done">Готово</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите исполнителя" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Дедлайн</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueRange.from || dueDate
                      ? `${(dueRange.from ? dueRange.from : new Date(dueDate)).toLocaleDateString('ru-RU')}${dueRange.to ? ' — ' + dueRange.to.toLocaleDateString('ru-RU') : ''}`
                      : 'Выберите дату/период'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dueRange as any}
                    onSelect={(r: any) => setDueRange(r || {})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Tabs defaultValue="main" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Основное</TabsTrigger>
              <TabsTrigger value="files">Файлы ({attachedFiles.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="main" className="mt-4">
              {/* Основная форма уже выше */}
            </TabsContent>
            <TabsContent value="files" className="mt-4">
              <DragDropZone onFilesAdded={(files) => setAttachedFiles(prev => [...prev, ...files])} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">{mode === 'edit' ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createProject } = useProjects() as any;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject({ name: name.trim(), description: description.trim() || undefined, status: 'active', start_date: new Date().toISOString(), created_at: new Date().toISOString() } as any);
    setName('');
    setDescription('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Новый проект</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать проект</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pname">Название</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название проекта" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdesc">Описание</Label>
            <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание проекта" rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
