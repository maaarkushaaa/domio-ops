import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskComments } from '@/components/tasks/TaskComments';
import { TaskChecklists } from '@/components/tasks/TaskChecklists';
import { supabase } from '@/integrations/supabase/client';
import { TaskDependencyManager } from '@/components/tasks/TaskDependencyManager';

function ruStatus(s?: string) {
  switch (s) {
    case 'backlog': return 'Бэклог';
    case 'todo': return 'К выполнению';
    case 'in_progress': return 'В работе';
    case 'review': return 'На ревью';
    case 'done': return 'Готово';
    default: return s || '—';
  }
}

function ruPriority(p?: string) {
  switch (p) {
    case 'high': return 'Высокий';
    case 'medium': return 'Средний';
    case 'low': return 'Низкий';
    default: return p || '—';
  }
}

export function TaskDetailsDialog({ task, trigger }: { task: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parent, setParent] = useState<any>(null);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      const load = async () => {
        const { data: atts } = await (supabase as any)
          .from('task_attachments')
          .select('*')
          .eq('task_id', task.id);
        setAttachments(atts || []);

        if (task.parent_task_id) {
          const { data: p } = await (supabase as any)
            .from('tasks')
            .select('id, title')
            .eq('id', task.parent_task_id)
            .single();
          setParent(p);
        }

        const { data: subs } = await (supabase as any)
          .from('tasks')
          .select('id, title, status')
          .eq('parent_task_id', task.id);
        setSubtasks(subs || []);

        const { data: acts } = await (supabase as any)
          .from('task_activity')
          .select('*, actor:profiles(full_name,email)')
          .eq('task_id', task.id)
          .order('created_at', { ascending: false })
          .limit(10);
        setActivity(acts || []);
      };
      load();
    }
  }, [open, task.id, task.parent_task_id]);

  const addTag = async () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return;
    const newTags = [...tags, tagInput.trim()];
    setTags(newTags);
    setTagInput('');
    await (supabase as any).from('tasks').update({ tags: newTags }).eq('id', task.id);
  };

  const removeTag = async (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    await (supabase as any).from('tasks').update({ tags: newTags }).eq('id', task.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${task.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: meta, error: metaError } = await (supabase as any)
        .from('task_attachments')
        .insert({
          task_id: task.id,
          object_path: path,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single();
      if (metaError) throw metaError;
      setAttachments(prev => [...prev, meta]);
    } catch (err) {
      console.error('Upload error', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="flex-1">{task.title}</span>
            <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)} className="mr-2">
              Редактировать
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {task.description && <div className="text-sm">{task.description}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm"><b>Статус:</b> {ruStatus(task.status)}</div>
            <div className="text-sm"><b>Приоритет:</b> {ruPriority(task.priority)}</div>
            <div className="text-sm"><b>Проект:</b> {task.project?.name || 'Без проекта'}</div>
            <div className="text-sm">
              <b>Период:</b>{' '}
              {task.due_date ? (
                <>
                  {new Date(task.due_date).toLocaleDateString('ru-RU')}
                  {(task as any).due_end && (task as any).due_end !== task.due_date ? (
                    <> — {new Date((task as any).due_end).toLocaleDateString('ru-RU')}</>
                  ) : null}
                </>
              ) : '—'}
            </div>
          </div>

          {/* Теги */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Теги</div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Добавить тег..."
                onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
              />
              <Button size="sm" onClick={addTag}>Добавить</Button>
            </div>
          </div>

          {/* Вложения */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Вложения</div>
            <div className="space-y-1">
              {attachments.map(att => (
                <div key={att.id} className="text-sm flex items-center gap-2 p-2 rounded border">
                  <Upload className="h-4 w-4" />
                  <a 
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const { data, error } = await supabase.storage
                          .from('task-files')
                          .download(att.object_path);
                        if (error) throw error;
                        const url = URL.createObjectURL(data);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = att.object_path.split('/').pop() || 'file';
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error('Download error', err);
                        alert('Ошибка при скачивании файла');
                      }
                    }}
                    className="hover:underline flex-1 cursor-pointer">
                    {att.object_path.split('/').pop()}
                  </a>
                  <span className="text-xs text-muted-foreground">{(att.size_bytes / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
            <div>
              <Input type="file" onChange={handleFileUpload} disabled={uploading} />
              {uploading && <span className="text-xs text-muted-foreground">Загрузка...</span>}
            </div>
          </div>

          <TaskChecklists taskId={task.id} />

          <TaskDependencyManager task={task} />

          {/* Родительская/подзадачи */}
          {(parent || subtasks.length > 0) && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Связи</div>
              {parent && (
                <div className="text-sm p-2 border rounded">
                  <span className="text-muted-foreground">Родительская: </span>
                  <span className="font-medium">{parent.title}</span>
                </div>
              )}
              {subtasks.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Подзадачи ({subtasks.length}):</div>
                  {subtasks.map(sub => (
                    <div key={sub.id} className="text-sm p-2 border rounded flex items-center justify-between">
                      <span>{sub.title}</span>
                      <Badge variant="outline">{ruStatus(sub.status)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Аудит-лог */}
          {activity.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">История изменений</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {activity.map(act => (
                  <div key={act.id} className="text-xs p-2 border rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{act.actor?.full_name || act.actor?.email || 'Система'}</span>
                      <span className="text-muted-foreground">{new Date(act.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="text-muted-foreground">{act.event}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TaskComments taskId={task.id} />
        </div>
      </DialogContent>

      <TaskDialog mode="edit" openExternal={openEdit} onOpenChangeExternal={setOpenEdit} initialTask={task} />
    </Dialog>
  );
}
