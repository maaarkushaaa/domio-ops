import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskComments } from '@/components/tasks/TaskComments';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    if (open) {
      const loadAttachments = async () => {
        const { data } = await (supabase as any)
          .from('task_attachments')
          .select('*')
          .eq('task_id', task.id);
        setAttachments(data || []);
      };
      loadAttachments();
    }
  }, [open, task.id]);

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
          <DialogTitle className="flex items-center justify-between">
            <span>{task.title}</span>
            <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)}>Редактировать</Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {task.description && <div className="text-sm">{task.description}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm"><b>Статус:</b> {ruStatus(task.status)}</div>
            <div className="text-sm"><b>Приоритет:</b> {ruPriority(task.priority)}</div>
            <div className="text-sm"><b>Проект:</b> {task.project?.name || 'Без проекта'}</div>
            <div className="text-sm"><b>Дедлайн:</b> {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '—'}</div>
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
                  <a href={supabase.storage.from('task-files').getPublicUrl(att.object_path).data.publicUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex-1">
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

          <TaskComments taskId={task.id} />
        </div>
      </DialogContent>

      <TaskDialog mode="edit" openExternal={openEdit} onOpenChangeExternal={setOpenEdit} initialTask={task} />
    </Dialog>
  );
}
