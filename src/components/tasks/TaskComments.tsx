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
        console.log('[COMMENTS] Loading comments for task', taskId);
        const rows = await listComments(taskId);
        console.log('[COMMENTS] Loaded', rows?.length || 0, 'comments:', rows);
        setComments(rows || []);
      } catch (e) {
        console.error('[COMMENTS] Load comments error', e);
      }
    };
    load();

    // Realtime для комментариев
    console.log('[COMMENTS] Setting up Realtime subscription for task', taskId);
    const channel = (supabase as any)
      .channel(`comments:${taskId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` }, (payload: any) => {
        console.log('[COMMENTS] Realtime INSERT event:', payload);
        const newComment = payload.new;
        // Подтянуть автора и добавить (с дедупликацией)
        (async () => {
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('full_name, email')
            .eq('id', newComment.author_id)
            .single();
          console.log('[COMMENTS] Fetched author profile:', profile);
          setComments(prev => {
            // Не добавлять дубликаты
            if (prev.some(c => c.id === newComment.id)) {
              console.log('[COMMENTS] Duplicate comment detected, skipping');
              return prev;
            }
            console.log('[COMMENTS] Adding new comment to state');
            return [...prev, { ...newComment, author: profile }];
          });
        })();
      })
      .subscribe((status: string) => {
        console.log('[COMMENTS] Realtime subscription status:', status);
      });

    return () => {
      console.log('[COMMENTS] Cleaning up Realtime subscription');
      (supabase as any).removeChannel(channel);
    };
  }, [taskId, listComments]);

  const add = async () => {
    if (!text.trim() || !user) {
      console.log('[COMMENTS] Cannot add comment: empty text or no user');
      return;
    }
    setLoading(true);
    try {
      console.log('[COMMENTS] Adding comment, user:', user.id, 'text:', text.trim());
      await createComment(taskId, user.id, text.trim());
      console.log('[COMMENTS] Comment added successfully');
      // Не добавляем локально — Realtime сделает это автоматически
      setText('');
    } catch (e) {
      console.error('[COMMENTS] Create comment error', e);
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
