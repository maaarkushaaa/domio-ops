import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

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

    // Realtime для комментариев
    const channel = (supabase as any)
      .channel(`comments:${taskId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` }, (payload: any) => {
        const newComment = payload.new;
        // Подтянуть автора и добавить (с дедупликацией)
        (async () => {
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('full_name, email')
            .eq('id', newComment.author_id)
            .single();
          setComments(prev => {
            // Не добавлять дубликаты
            if (prev.some(c => c.id === newComment.id)) return prev;
            return [...prev, { ...newComment, author: profile }];
          });
        })();
      })
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [taskId, listComments]);

  const add = async () => {
    if (!text.trim() || !user) return;
    setLoading(true);
    try {
      await createComment(taskId, user.id, text.trim());
      // Не добавляем локально — Realtime сделает это автоматически
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
        <Button onClick={add} disabled={loading || !text.trim() || !user}>Добавить</Button>
      </div>
    </div>
  );
}
