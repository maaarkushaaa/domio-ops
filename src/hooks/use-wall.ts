import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type WallScope = 'project' | 'task';
export type WallAttachment = { id: string; type: 'image'|'video'|'audio'|'file'; url: string; meta?: any; created_at: string };
export type WallPost = {
  id: string;
  author_id: string;
  project_id: string | null;
  task_id: string | null;
  content: string;
  created_at: string;
  attachments: WallAttachment[];
  comments_count: number;
};

async function listPosts(scope: WallScope, scopeId?: string | null): Promise<WallPost[]> {
  let query = (supabase as any)
    .from('wall_posts')
    .select('id, author_id, project_id, task_id, content, created_at, wall_comments(count), wall_attachments(id,type,url,meta,created_at)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (scope === 'project' && scopeId) query = query.eq('project_id', scopeId);
  if (scope === 'task' && scopeId) query = query.eq('task_id', scopeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    author_id: p.author_id,
    project_id: p.project_id,
    task_id: p.task_id,
    content: p.content,
    created_at: p.created_at,
    attachments: (p.wall_attachments || []).map((a: any) => ({ id: a.id, type: a.type, url: a.url, meta: a.meta, created_at: a.created_at })),
    comments_count: p.wall_comments?.[0]?.count || 0,
  }));
}

export function useWallFeed(scope: WallScope, scopeId?: string) {
  return useQuery({
    queryKey: ['wall_feed', scope, scopeId || null],
    queryFn: () => listPosts(scope, scopeId || null),
  });
}

export async function createWallPost(params: { scope: WallScope; scopeId?: string | null; content: string; files?: Array<{ file: File | Blob; type: 'image'|'video'|'audio'|'file'; name?: string }>; }) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');
  const insertPayload: any = {
    author_id: user.id,
    content: params.content,
    project_id: params.scope === 'project' ? (params.scopeId || null) : null,
    task_id: params.scope === 'task' ? (params.scopeId || null) : null,
  };
  const { data: post, error } = await (supabase as any)
    .from('wall_posts')
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;

  if (params.files && params.files.length > 0) {
    for (const f of params.files) {
      const fileName = f.name || `blob-${Date.now()}.png`;
      const path = `${user.id}/${post.id}/${fileName}`;
      const { error: upErr } = await supabase.storage.from('wall').upload(path, f.file, { upsert: true, contentType: (f as any).file?.type });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from('wall').createSignedUrl(path, 60 * 60 * 24 * 7); // 7 дней
      const url = signed?.signedUrl || '';
      const { error: attErr } = await (supabase as any)
        .from('wall_attachments')
        .insert({ post_id: post.id, type: f.type, url, meta: { path, name: fileName } });
      if (attErr) throw attErr;
    }
  }

  return post;
}

export function useWallRealtime(scope: WallScope, scopeId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('wall_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wall_posts' }, () => {
        qc.invalidateQueries({ queryKey: ['wall_feed'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wall_comments' }, () => {
        qc.invalidateQueries({ queryKey: ['wall_feed'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const evt = (payload.new as any)?.event;
        if (evt === 'wall_post_created' || evt === 'wall_comment_created') {
          qc.invalidateQueries({ queryKey: ['wall_feed'] });
          // noop: визуальные уведомления будут показаны существующей подсистемой уведомлений, если подключена
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, scope, scopeId]);
}
