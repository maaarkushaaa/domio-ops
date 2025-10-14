import { useState } from 'react';
import { Heart, MessageCircle, X } from 'lucide-react';
import { WallPost as WallPostType, toggleLike, listComments, createComment, WallComment, deletePost } from '@/hooks/use-wall';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

export function WallPost({ post }: { post: WallPostType }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<WallComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  });

  const handleLike = async () => {
    await toggleLike(post.id);
    qc.invalidateQueries({ queryKey: ['wall_feed'] });
  };

  const handleDelete = async () => {
    if (!confirm('Удалить пост?')) return;
    await deletePost(post.id);
    qc.invalidateQueries({ queryKey: ['wall_feed'] });
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      const c = await listComments(post.id);
      setComments(c);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    await createComment(post.id, commentText);
    setCommentText('');
    const c = await listComments(post.id);
    setComments(c);
    qc.invalidateQueries({ queryKey: ['wall_feed'] });
    setSubmitting(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shrink-0">
            {post.author?.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <div className="text-blue-600 font-medium hover:underline cursor-pointer">{post.author?.full_name || 'Пользователь'}</div>
            <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        {currentUserId === post.author_id && (
          <button onClick={handleDelete} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        )}
      </div>

      {/* Content */}
      {post.content && <div className="text-sm whitespace-pre-wrap">{post.content}</div>}

      {/* Attachments */}
      {post.attachments?.length > 0 && (
        <div className="space-y-2">
          {post.attachments.map((a) => (
            <div key={a.id} className="rounded overflow-hidden border border-gray-200">
              {a.type === 'image' ? (
                <img src={a.url} alt="att" className="w-full" />
              ) : a.type === 'video' ? (
                <video src={a.url} controls className="w-full" />
              ) : (
                <a href={a.url} target="_blank" rel="noreferrer" className="text-xs p-2 inline-block text-blue-600">Вложение</a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={handleToggleComments} className="flex items-center gap-1 hover:text-blue-600">
            <MessageCircle className="h-4 w-4" />
            Комментировать
          </button>
        </div>
        <button onClick={handleLike} className={`flex items-center gap-1 ${post.user_liked ? 'text-red-500' : 'hover:text-red-500'}`}>
          <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
          Мне нравится {post.likes_count > 0 && <span className="font-medium">{post.likes_count}</span>}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          {loadingComments ? (
            <div className="text-xs text-gray-500">Загрузка комментариев...</div>
          ) : (
            <>
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs shrink-0">
                    {c.author?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded p-2">
                    <div className="text-xs font-medium text-blue-600">{c.author?.full_name || 'Пользователь'}</div>
                    <div className="text-xs text-gray-700">{c.content}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2">
                <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Написать комментарий..." className="text-xs" rows={2} />
                <Button size="sm" onClick={handleSubmitComment} disabled={submitting || !commentText.trim()}>
                  {submitting ? '...' : 'Отправить'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
