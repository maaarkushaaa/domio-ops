import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';

export function TaskComments({ taskId }: { taskId: string }) {
  const { listComments, createComment } = useTasks();
  const { user } = useAuth() as any;
  const [comments, setComments] = useState<Array<any>>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await listComments(taskId);
        setComments(rows || []);
      } catch (e) {
        console.error('load comments', e);
      }
    };
    load();
  }, [taskId]);

  const add = async () => {
    if (!text.trim() || !user) return;
    setLoading(true);
    try {
      const row = await createComment(taskId, user.id, text.trim());
      setComments(prev => [...prev, row]);
      setText('');
    } catch (e) {
      console.error('create comment', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="text-sm font-medium">Комментарии</div>
      <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">Пока нет комментариев</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="rounded-md border p-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{c.author?.full_name || c.author?.email || 'Пользователь'}</span>
                <span>{new Date(c.created_at).toLocaleString('ru-RU')}</span>
              </div>
              <div className="text-sm whitespace-pre-wrap mt-1">{c.content}</div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите комментарий..." onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } }} />
        <Button onClick={add} disabled={loading || !text.trim()}>Добавить</Button>
      </div>
    </div>
  );
}
