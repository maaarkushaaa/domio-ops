import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type WallScope = 'project' | 'task';
export type WallAttachment = { id: string; type: 'image'|'video'|'audio'|'file'; url: string; meta?: any; created_at: string };
export type WallComment = { id: string; post_id: string; author_id: string; content: string; created_at: string; author?: { id: string; full_name: string; email: string } };
export type WallPoll = { id: string; post_id: string; question: string; is_anonymous: boolean; is_multiple: boolean; options: Array<{ id: string; text: string; votes_count: number; user_voted: boolean }>; total_votes: number };
export type WallPost = {
  id: string;
  author_id: string;
  project_id: string | null;
  task_id: string | null;
  content: string;
  created_at: string;
  attachments: WallAttachment[];
  comments_count: number;
  likes_count: number;
  user_liked: boolean;
  author?: { id: string; full_name: string; email: string };
  poll?: WallPoll;
};

async function listPosts(scope: WallScope, scopeId?: string | null, offset = 0, limit = 20): Promise<WallPost[]> {
  const user = (await supabase.auth.getUser()).data.user;
  let query = (supabase as any)
    .from('wall_posts')
    .select('id, author_id, project_id, task_id, content, created_at, wall_comments(count), wall_attachments(id,type,url,meta,created_at), wall_reactions(count)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (scope === 'project' && scopeId) query = query.eq('project_id', scopeId);
  if (scope === 'task' && scopeId) query = query.eq('task_id', scopeId);
  const { data, error } = await query;
  if (error) throw error;
  const authorIds = [...new Set((data || []).map((p: any) => p.author_id))];
  const { data: profiles } = await (supabase as any).from('profiles').select('id,full_name,email').in('id', authorIds);
  const profilesMap = new Map((profiles || []).map((pr: any) => [pr.id, pr]));
  const postIds = (data || []).map((p: any) => p.id);
  const { data: userLikes } = user ? await (supabase as any).from('wall_reactions').select('post_id').eq('user_id', user.id).in('post_id', postIds).eq('type', 'like') : { data: [] };
  const likedSet = new Set((userLikes || []).map((l: any) => l.post_id));
  const { data: polls } = await (supabase as any).from('wall_polls').select('id,post_id,question,is_anonymous,is_multiple').in('post_id', postIds);
  const pollsMap = new Map((polls || []).map((poll: any) => [poll.post_id, poll]));
  const pollIds = (polls || []).map((poll: any) => poll.id);
  const { data: pollOptions } = pollIds.length > 0 ? await (supabase as any).from('wall_poll_options').select('id,poll_id,text,position').in('poll_id', pollIds).order('position') : { data: [] };
  const { data: pollVotesCounts } = pollIds.length > 0 ? await (supabase as any).from('wall_poll_votes').select('option_id').in('poll_id', pollIds) : { data: [] };
  const votesCountMap = new Map<string, number>();
  (pollVotesCounts || []).forEach((v: any) => votesCountMap.set(v.option_id, (votesCountMap.get(v.option_id) || 0) + 1));
  const { data: userVotes } = user && pollIds.length > 0 ? await (supabase as any).from('wall_poll_votes').select('option_id').eq('user_id', user.id).in('poll_id', pollIds) : { data: [] };
  const userVotedSet = new Set((userVotes || []).map((v: any) => v.option_id));
  const pollOptionsMap = new Map<string, any[]>();
  (pollOptions || []).forEach((opt: any) => {
    if (!pollOptionsMap.has(opt.poll_id)) pollOptionsMap.set(opt.poll_id, []);
    pollOptionsMap.get(opt.poll_id)!.push({ id: opt.id, text: opt.text, votes_count: votesCountMap.get(opt.id) || 0, user_voted: userVotedSet.has(opt.id) });
  });
  return (data || []).map((p: any) => {
    const poll: any = pollsMap.get(p.id);
    const pollData = poll ? {
      id: poll.id,
      post_id: poll.post_id,
      question: poll.question,
      is_anonymous: poll.is_anonymous,
      is_multiple: poll.is_multiple,
      options: pollOptionsMap.get(poll.id) || [],
      total_votes: (pollOptionsMap.get(poll.id) || []).reduce((sum: number, opt: any) => sum + opt.votes_count, 0),
    } : undefined;
    return {
      id: p.id,
      author_id: p.author_id,
      project_id: p.project_id,
      task_id: p.task_id,
      content: p.content,
      created_at: p.created_at,
      attachments: (p.wall_attachments || []).map((a: any) => ({ id: a.id, type: a.type, url: a.url, meta: a.meta, created_at: a.created_at })),
      comments_count: p.wall_comments?.[0]?.count || 0,
      likes_count: p.wall_reactions?.[0]?.count || 0,
      user_liked: likedSet.has(p.id),
      author: profilesMap.get(p.author_id),
      poll: pollData,
    };
  });
}

export function useWallFeed(scope: WallScope, scopeId?: string, offset = 0, limit = 20) {
  return useQuery({
    queryKey: ['wall_feed', scope, scopeId || null, offset, limit],
    queryFn: () => listPosts(scope, scopeId || null, offset, limit),
  });
}

export async function createWallPost(params: { scope: WallScope; scopeId?: string | null; content: string; files?: Array<{ file: File | Blob; type: 'image'|'video'|'audio'|'file'; name?: string }>; poll?: { question: string; options: string[]; is_anonymous: boolean; is_multiple: boolean }; }) {
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
      const fileName = f.name || `file-${Date.now()}`;
      const folder = f.type === 'image' ? 'images' : f.type === 'video' ? 'videos' : f.type === 'audio' ? 'audio' : 'files';
      const path = `${folder}/${fileName}`;
      console.log('[WALL] Uploading file:', { type: f.type, path, size: f.file.size });
      const { error: upErr } = await supabase.storage.from('wall').upload(path, f.file, { upsert: true });
      if (upErr) {
        console.error('[WALL] Upload error:', upErr);
        throw upErr;
      }
      const { data: signed, error: signErr } = await supabase.storage.from('wall').createSignedUrl(path, 60 * 60 * 24 * 7); // 7 дней
      if (signErr) {
        console.error('[WALL] Signed URL error:', signErr);
        throw signErr;
      }
      const url = signed?.signedUrl || '';
      console.log('[WALL] File uploaded, signed URL:', url);
      const { error: attErr } = await (supabase as any)
        .from('wall_attachments')
        .insert({ post_id: post.id, type: f.type, url, meta: { path, name: fileName } });
      if (attErr) {
        console.error('[WALL] Attachment insert error:', attErr);
        throw attErr;
      }
    }
  }

  if (params.poll) {
    const { data: pollData, error: pollErr } = await (supabase as any).from('wall_polls').insert({ post_id: post.id, question: params.poll.question, is_anonymous: params.poll.is_anonymous, is_multiple: params.poll.is_multiple }).select().single();
    if (pollErr) throw pollErr;
    for (let i = 0; i < params.poll.options.length; i++) {
      await (supabase as any).from('wall_poll_options').insert({ poll_id: pollData.id, text: params.poll.options[i], position: i });
    }
  }
  return post;
}

export async function toggleLike(postId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');
  const { data: existing } = await (supabase as any).from('wall_reactions').select('id').eq('post_id', postId).eq('user_id', user.id).eq('type', 'like').maybeSingle();
  if (existing) {
    await (supabase as any).from('wall_reactions').delete().eq('id', existing.id);
  } else {
    await (supabase as any).from('wall_reactions').insert({ post_id: postId, user_id: user.id, type: 'like' });
  }
}

export async function listComments(postId: string): Promise<WallComment[]> {
  const { data, error } = await (supabase as any).from('wall_comments').select('id,post_id,author_id,content,created_at').eq('post_id', postId).order('created_at', { ascending: true });
  if (error) throw error;
  const authorIds = [...new Set((data || []).map((c: any) => c.author_id))];
  const { data: profiles } = await (supabase as any).from('profiles').select('id,full_name,email').in('id', authorIds);
  const profilesMap = new Map((profiles || []).map((pr: any) => [pr.id, pr]));
  return (data || []).map((c: any) => ({ ...c, author: profilesMap.get(c.author_id) }));
}

export async function createComment(postId: string, content: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await (supabase as any).from('wall_comments').insert({ post_id: postId, author_id: user.id, content }).select().single();
  if (error) throw error;
  return data;
}

export async function deletePost(postId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');
  const { error } = await (supabase as any).from('wall_posts').delete().eq('id', postId).eq('author_id', user.id);
  if (error) throw error;
}

export async function votePoll(pollId: string, optionIds: string[]) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');
  await (supabase as any).from('wall_poll_votes').delete().eq('poll_id', pollId).eq('user_id', user.id);
  for (const optionId of optionIds) {
    await (supabase as any).from('wall_poll_votes').insert({ poll_id: pollId, option_id: optionId, user_id: user.id });
  }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wall_reactions' }, () => {
        qc.invalidateQueries({ queryKey: ['wall_feed'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const evt = (payload.new as any)?.event;
        if (evt === 'wall_post_created' || evt === 'wall_comment_created') {
          qc.invalidateQueries({ queryKey: ['wall_feed'] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, scope, scopeId]);
}
