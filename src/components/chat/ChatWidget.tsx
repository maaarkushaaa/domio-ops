import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { MessageCircle, Send, X, Minimize2, Mic, Square, Hash, List, Play, Pause, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  type?: 'text' | 'audio';
  audioUrl?: string;
  channel?: string;
  taskId?: string | null;
}

function AudioMessage({ url }: { url: string | undefined }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!url) return;
    setIsLoading(true);
    const audio = new Audio(url);
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    (audio as any).playsInline = true;
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setIsLoading(false);
      }
    };
    const onDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setIsLoading(false);
      }
    };
    const onCanPlay = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setIsLoading(false);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrent(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    const onError = () => {
      console.error('Audio loading error');
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.load();

    // Fallback timeout in case metadata never fires (unsupported codec)
    const timeout = setTimeout(() => setIsLoading(false), 2500);

    return () => {
      clearTimeout(timeout);
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [url]);

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;
    const update = () => {
      const a = audioRef.current!;
      if (isFinite(a.currentTime)) setCurrent(a.currentTime);
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.error('Audio play error:', e);
      }
    }
  };

  if (!url || isLoading) {
    return (
      <div className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs text-muted-foreground">{!url ? 'Загрузка аудио...' : 'Загрузка метаданных...'}</span>
      </div>
    );
  }

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    if (isFinite(t) && t >= 0 && t <= (duration || 0)) {
      audio.currentTime = t;
      setCurrent(t);
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  };

  return (
    <div className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted">
      <Button type="button" size="icon" variant="secondary" className="h-8 w-8" onClick={toggle}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <input type="range" min={0} max={duration || 0} step={0.1} value={Math.min(current, duration || 0)} onChange={onSeek} className="w-full accent-primary" />
      <div className="text-xs text-muted-foreground min-w-[68px] text-right">{fmt(current)} / {fmt(duration)}</div>
    </div>
  );
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unread, setUnread] = useState(0);
  // Per-channel unread counters
  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [unreadTasks, setUnreadTasks] = useState<Record<string, number>>({});
  const getUnreadCurrent = () => (channel === 'global' ? unreadGlobal : (taskId ? (unreadTasks[taskId] || 0) : 0));
  const getUnreadTasksTotal = () => Object.values(unreadTasks).reduce((a, b) => a + b, 0);
  const [channel, setChannel] = useState<'global' | 'task'>('global');
  const [taskId, setTaskId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string }>>([]);
  const [typingOthers, setTypingOthers] = useState<string[]>([]);
  const [recordingOthers, setRecordingOthers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<number | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesWrapRef = useRef<HTMLDivElement>(null);
  // Drag/resize state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const draggingRef = useRef<{ type: 'fab' | 'chat' | 'resize' | null; dx: number; dy: number }>({ type: null, dx: 0, dy: 0 });
  const [fabPos, setFabPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 88 : 300,
    y: typeof window !== 'undefined' ? window.innerHeight - 88 : 300,
  }));
  const [chatPos, setChatPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 520 : 200,
    y: typeof window !== 'undefined' ? window.innerHeight - 620 : 100,
  }));
  const [chatSize, setChatSize] = useState<{ w: number; h: number }>({ w: 420, h: 560 });

  // Detect mobile resize
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Adjust chat width when task mode is selected
  useEffect(() => {
    if (channel === 'task') {
      // Increase width for task selector
      setChatSize(prev => ({ w: Math.max(prev.w, 520), h: prev.h }));
    } else if (channel === 'global') {
      // Reset to default width
      setChatSize(prev => ({ w: 420, h: prev.h }));
    }
  }, [channel]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load messages from Supabase and subscribe to realtime
  useEffect(() => {
    let rtChannel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      try {
        setLoadingMessages(true);
        const filters: any = { };
        // Channel filtering composed after fetch call

        const baseQuery = (supabase as any)
          .from('team_messages')
          .select('id, user_id, content, created_at, channel, task_id, type, audio_url')
          .order('created_at', { ascending: true })
          .limit(300);

        let query = baseQuery;
        if (channel === 'global') {
          query = query.eq('channel', 'global');
        } else if (channel === 'task' && taskId) {
          query = query.eq('channel', 'task').eq('task_id', taskId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const loaded: ChatMessage[] = (data || []).map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          userName: '',
          message: m.content || '',
          timestamp: m.created_at,
          type: (m.type as any) || 'text',
          audioUrl: m.audio_url || undefined,
          channel: m.channel,
          taskId: m.task_id,
        }));
        setMessages(loaded);
        // Ensure scroll after first paint
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToBottom(false)));

        // Backfill names
        const uniqueUserIds = Array.from(new Set(loaded.map(m => m.userId)));
        if (uniqueUserIds.length > 0) {
          const { data: profiles } = await (supabase as any)
            .from('profiles')
            .select('id, full_name, email')
            .in('id', uniqueUserIds);
          const map = new Map<string, string>();
          (profiles || []).forEach((p: any) => {
            map.set(p.id, p.full_name || (p.email ? String(p.email).split('@')[0] : ''));
          });
          setMessages(prev => prev.map(m => ({ ...m, userName: map.get(m.userId) || m.userName || 'Пользователь' })));
        }
      } catch (e) {
        console.error('Chat load error:', e);
      } finally {
        setLoadingMessages(false);
      }

      // Realtime subscription (listen to all new messages to raise notifications)
      rtChannel = supabase
        .channel('team_messages_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages' }, async (payload) => {
          const m = payload.new as any;
          // Ignore self realtime echo (уже отрисовали оптимистично)
          if (m.user_id === user?.id) return;

          const base: ChatMessage = {
            id: m.id,
            userId: m.user_id,
            userName: '',
            message: m.content || '',
            timestamp: m.created_at,
            type: (m.type as any) || 'text',
            audioUrl: m.audio_url || undefined,
            channel: m.channel,
            taskId: m.task_id,
          };

          // Try get name for the new author
          let name = '';
          try {
            const { data: prof } = await (supabase as any)
              .from('profiles')
              .select('full_name, email')
              .eq('id', m.user_id)
              .maybeSingle();
            name = (prof && (prof.full_name || (prof.email ? String(prof.email).split('@')[0] : ''))) || '';
          } catch {}

          const enriched = { ...base, userName: name || base.userName || 'Пользователь' };

          // Prevent duplicates
          let alreadyHas = false;
          setMessages(prev => {
            alreadyHas = prev.some(mm => mm.id === enriched.id);
            if (alreadyHas) return prev;
            return [...prev, enriched];
          });
          if (alreadyHas) return;

          const isInCurrentChannel = (channel === 'global' && enriched.channel === 'global') ||
            (channel === 'task' && enriched.channel === 'task' && taskId && enriched.taskId === taskId);
          const isVisibleCurrent = isOpen && isInCurrentChannel;

          if (isVisibleCurrent) {
            requestAnimationFrame(() => scrollToBottom(true));
          } else {
            if (enriched.channel === 'global') setUnreadGlobal(c => c + 1);
            else if (enriched.channel === 'task' && enriched.taskId) setUnreadTasks(prev => ({ ...prev, [enriched.taskId!]: (prev[enriched.taskId!] || 0) + 1 }));
            setUnread(prev => prev + 1);
            try {
              toast({
                title: enriched.channel === 'global' ? 'Новое сообщение в Общем' : 'Новое сообщение в Задачах',
                description: enriched.message ? enriched.message.slice(0, 80) : 'Голосовое сообщение',
              });
            } catch {}
          }

          // Sound only if not visible
          try {
            if (!isVisibleCurrent) {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.value = 880;
              gain.gain.value = 0.05;
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              setTimeout(() => { osc.stop(); ctx.close(); }, 150);
            }
          } catch {}
        })
        .subscribe();
    };

    load();

    return () => {
      if (rtChannel) supabase.removeChannel(rtChannel);
    };
  }, [channel, taskId, isOpen]);

  // Load tasks list for selector when task channel is active
  useEffect(() => {
    const loadTasks = async () => {
      if (channel !== 'task') return;
      try {
        const { data, error } = await (supabase as any)
          .from('tasks')
          .select('id, title')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setTasks((data || []).map((t: any) => ({ id: t.id, title: t.title })));
      } catch (e) {
        console.error('Load tasks error:', e);
        setTasks([]);
      }
    };
    loadTasks();
  }, [channel]);

  // Presence (typing/recording)
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel('chat_presence', { config: { presence: { key: user.id } } });
    presenceChannelRef.current = ch;
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as any;
      const othersTyping: string[] = [];
      const othersRec: string[] = [];
      Object.values(state).forEach((arr: any) => {
        (arr as any[]).forEach((s: any) => {
          if (s.user_id !== user.id) {
            const sameChannel = (s.channel === channel) && (channel !== 'task' || s.task_id === taskId);
            if (sameChannel && s.typing) othersTyping.push(s.name || 'Кто-то');
            if (sameChannel && s.recording) othersRec.push(s.name || 'Кто-то');
          }
        });
      });
      setTypingOthers(othersTyping);
      setRecordingOthers(othersRec);
    });
    ch.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ user_id: user.id, name: user.name, typing: false, recording: false, channel, task_id: taskId || null });
      }
    });
    return () => { supabase.removeChannel(ch); };
  }, [user, channel, taskId]);

  const bumpTyping = (flag: boolean) => {
    const ch = presenceChannelRef.current;
    if (!ch || !user) return;
    ch.track({ user_id: user.id, name: user.name, typing: flag, recording: isRecording, channel, task_id: taskId || null });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    const content = newMessage.trim();
    setNewMessage('');
    
    // Optimistic UI: add message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      userId: user.id,
      userName: user.name,
      message: content,
      timestamp: new Date().toISOString(),
      type: 'text',
      channel: channel === 'task' ? 'task' : 'global',
      taskId: channel === 'task' && taskId ? taskId : null,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      const { data, error } = await (supabase as any)
        .from('team_messages')
        .insert({
          user_id: user.id,
          content,
          channel: channel === 'task' ? 'task' : 'global',
          task_id: channel === 'task' && taskId ? taskId : null,
          type: 'text',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Replace temp message with real one from DB
      if (data) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? {
            id: data.id,
            userId: data.user_id,
            userName: user.name,
            message: data.content,
            timestamp: data.created_at,
            type: data.type,
            audioUrl: data.audio_url,
            channel: data.channel,
            taskId: data.task_id,
          } : msg
        ));
      }
    } catch (e: any) {
      console.error('Chat send error:', e);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      toast({ title: 'Ошибка', description: e.message || 'Не удалось отправить сообщение', variant: 'destructive' });
    }
  };

  // Helper: last read key per channel
  const getLastReadKey = () => (channel === 'task' ? `chat:lastRead:task:${taskId || 'none'}` : 'chat:lastRead:global');

  // Scroll helpers (robust)
  const scrollContainerTo = (top: number) => {
    const el = messagesWrapRef.current;
    if (!el) return;
    el.scrollTop = top;
  };
  const scrollToBottom = (smooth = false) => {
    const el = messagesWrapRef.current;
    if (!el) {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
      return;
    }
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };
  const scrollToMessage = (id: string) => {
    const wrap = messagesWrapRef.current;
    const el = document.getElementById(`msg-${id}`);
    if (wrap && el) {
      const parentTop = wrap.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const current = wrap.scrollTop;
      const delta = elTop - parentTop - 16; // padding offset
      wrap.scrollTop = current + delta;
    } else if (el) {
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  };
  const ensureScrollBottom = (attempts = 3) => {
    const run = (left: number) => {
      if (left <= 0) return;
      requestAnimationFrame(() => {
        scrollToBottom(false);
        setTimeout(() => run(left - 1), 32);
      });
    };
    run(attempts);
  };
  const ensureScrollToMsg = (id: string, attempts = 3) => {
    const run = (left: number) => {
      if (left <= 0) return;
      requestAnimationFrame(() => {
        scrollToMessage(id);
        setTimeout(() => run(left - 1), 32);
      });
    };
    run(attempts);
  };

  // After loading messages: go to first unread or bottom
  useEffect(() => {
    if (loadingMessages) return;
    if (!isOpen) return;
    const key = getLastReadKey();
    const lastReadAt = localStorage.getItem(key);
    if (messages.length === 0) return;

    if (lastReadAt) {
      const ts = new Date(lastReadAt).getTime();
      const target = messages.find(m => new Date(m.timestamp).getTime() > ts);
      if (target) {
        ensureScrollToMsg(target.id, 4);
        return;
      }
    }
    ensureScrollBottom(4);
  }, [loadingMessages, channel, taskId, isOpen]);

  // On new message appended by self -> scroll to bottom
  useEffect(() => {
    if (!isOpen) return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.userId === user?.id) ensureScrollBottom(2);
  }, [messages.length, isOpen]);

  // Also trigger when чат открывается без перезагрузки данных
  useEffect(() => {
    if (!isOpen) return;
    if (messages.length === 0) return;
    const key = getLastReadKey();
    const lastReadAt = localStorage.getItem(key);
    if (lastReadAt) {
      const ts = new Date(lastReadAt).getTime();
      const target = messages.find(m => new Date(m.timestamp).getTime() > ts);
      if (target) {
        ensureScrollToMsg(target.id, 4);
        return;
      }
    }
    ensureScrollBottom(4);
  }, [isOpen]);

  // Persist last read when closing or switching channel
  useEffect(() => {
    const save = () => {
      const key = getLastReadKey();
      localStorage.setItem(key, new Date().toISOString());
      // Reset unread counter for current channel
      if (channel === 'global') setUnreadGlobal(0);
      else if (channel === 'task' && taskId) setUnreadTasks(prev => ({ ...prev, [taskId]: 0 }));
    };
    window.addEventListener('beforeunload', save);
    return () => {
      save();
      window.removeEventListener('beforeunload', save);
    };
  }, [channel, taskId]);

  // Recording - choose best supported MIME (iOS first)
  const pickAudioMime = (): { mime: string; ext: string } => {
    const candidates = [
      'audio/mp4;codecs=aac',
      'audio/aac',
      'audio/mpeg',
      'audio/ogg;codecs=opus',
      'audio/webm;codecs=opus',
      'audio/webm'
    ];
    for (const t of candidates) {
      if ((window as any).MediaRecorder && (MediaRecorder as any).isTypeSupported?.(t)) {
        const ext = t.includes('mp4') || t.includes('aac') ? 'm4a' : t.includes('mpeg') ? 'mp3' : t.includes('ogg') ? 'ogg' : 'webm';
        return { mime: t, ext };
      }
    }
    return { mime: 'audio/webm', ext: 'webm' };
  };

  const startRecording = async () => {
    if (isRecording || !user) return;
    try {
      const { mime, ext } = pickAudioMime();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const tempId = `temp-audio-${Date.now()}`;
        try {
          setIsUploadingAudio(true);
          const blob = new Blob(chunks, { type: mime });
          const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

          const optimisticMsg: ChatMessage = {
            id: tempId,
            userId: user.id,
            userName: user.name,
            message: '',
            timestamp: new Date().toISOString(),
            type: 'audio',
            audioUrl: undefined,
            channel: channel === 'task' ? 'task' : 'global',
            taskId: channel === 'task' && taskId ? taskId : null,
          };
          setMessages(prev => [...prev, optimisticMsg]);

          const { error: uploadError } = await supabase.storage.from('chat-audio').upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: mime
          });
          if (uploadError) throw uploadError;

          const { data: publicUrl } = supabase.storage.from('chat-audio').getPublicUrl(fileName);
          const { data, error: insertError } = await (supabase as any)
            .from('team_messages')
            .insert({
              user_id: user.id,
              content: '',
              channel: channel === 'task' ? 'task' : 'global',
              task_id: channel === 'task' && taskId ? taskId : null,
              type: 'audio',
              audio_url: publicUrl.publicUrl
            })
            .select()
            .single();
          if (insertError) throw insertError;

          if (data) {
            setMessages(prev => prev.map(msg => msg.id === tempId ? {
              id: data.id,
              userId: data.user_id,
              userName: user.name,
              message: data.content,
              timestamp: data.created_at,
              type: data.type,
              audioUrl: data.audio_url,
              channel: data.channel,
              taskId: data.task_id,
            } : msg));
          }
        } catch (e: any) {
          console.error('Audio send error:', e);
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          toast({ title: 'Ошибка', description: e.message || 'Не удалось отправить голосовое', variant: 'destructive' });
        } finally {
          setIsRecording(false);
          setIsUploadingAudio(false);
          bumpTyping(false);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      bumpTyping(false);
      const ch = presenceChannelRef.current; if (ch && user) ch.track({ user_id: user.id, name: user.name, typing: false, recording: true, channel, task_id: taskId || null });
    } catch (e: any) {
      console.error('Mic error:', e);
      toast({ title: 'Микрофон недоступен', description: e.message || 'Проверьте разрешения', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
      rec.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const totalUnread = unreadGlobal + getUnreadTasksTotal();

  if (!isOpen) {
    const totalUnread = unreadGlobal + getUnreadTasksTotal();
    const fabStyle = isMobile
      ? { right: 24, bottom: 'calc(24px + env(safe-area-inset-bottom))' }
      : { left: fabPos.x, top: fabPos.y };
    return (
      <Button
        onMouseDown={!isMobile ? (e) => {
          draggingRef.current = { type: 'fab', dx: e.clientX - fabPos.x, dy: e.clientY - fabPos.y };
          const onMove = (ev: MouseEvent) => setFabPos({ x: ev.clientX - draggingRef.current.dx, y: ev.clientY - draggingRef.current.dy });
          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); draggingRef.current.type = null; };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        } : undefined}
        onClick={() => setIsOpen(true)}
        className="fixed h-14 w-14 rounded-full shadow-glow hover-lift animate-scale-in z-[60]"
        style={fabStyle as any}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
            {totalUnread}
          </span>
        )}
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 w-80 glass-card shadow-glow hover-lift z-50 animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer" onClick={() => setIsMinimized(false)}>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Чат команды
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    );
  }

  // Make chat responsive to screen size
  const chatStyle = isMobile 
    ? { left: 0, top: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', maxHeight: '100dvh' }
    : { left: chatPos.x, top: chatPos.y, width: chatSize.w, height: chatSize.h };

  const chatClasses = isMobile
    ? "fixed inset-0 flex flex-col z-50 overflow-hidden border-0 rounded-none bg-background"
    : "fixed flex flex-col glass-card shadow-glow hover-lift z-50 animate-scale-in overflow-hidden";

  return (
    <Card className={chatClasses} style={chatStyle}>
      <CardHeader className="relative flex flex-row items-center justify-between p-4 border-b cursor-move flex-shrink-0"
        onMouseDown={!isMobile ? (e) => {
          draggingRef.current = { type: 'chat', dx: e.clientX - chatPos.x, dy: e.clientY - chatPos.y };
          const onMove = (ev: MouseEvent) => setChatPos({ x: ev.clientX - draggingRef.current.dx, y: ev.clientY - draggingRef.current.dy });
          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); draggingRef.current.type = null; };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        } : undefined}>
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Чат команды
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap pr-16">
          <div className="flex items-center gap-1 text-xs flex-wrap">
            <Button variant={channel==='global'? 'default':'outline'} size="sm" onClick={() => { setChannel('global'); setUnread(0); }}>
              <Hash className="h-3 w-3 mr-1" /> Общий
              {unreadGlobal > 0 && <span className="ml-1 inline-flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-white text-[10px]">{unreadGlobal}</span>}
            </Button>
            <Button variant={channel==='task'? 'default':'outline'} size="sm" onClick={() => { setChannel('task'); setUnread(0); }}>
              <List className="h-3 w-3 mr-1" /> Задача
              {getUnreadTasksTotal() > 0 && <span className="ml-1 inline-flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-white text-[10px]">{getUnreadTasksTotal()}</span>}
            </Button>
          </div>
        </div>
        {/* Absolute controls on the right to avoid wrapping under buttons */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      {channel === 'task' && (
        <div className="px-4 py-2 border-b flex-shrink-0">
          <Select value={taskId} onValueChange={(v) => setTaskId(v)}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Выберите задачу" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <CardContent className="flex-1 p-0 flex flex-col min-h-0 overflow-hidden">
        <div ref={messagesWrapRef} className="flex-1 p-4 min-h-0 overflow-y-auto">
          <div className="space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Загружаем сообщения…
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Нет сообщений. Начните общение!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`flex gap-3 ${
                    msg.userId === user?.id ? 'flex-row-reverse' : ''
                  } animate-fade-in`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {msg.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 max-w-[70%] ${
                    msg.userId === user?.id ? 'items-end' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{msg.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {msg.type === 'audio' ? (
                      <AudioMessage url={msg.audioUrl} />
                    ) : (
                    <div className={`p-3 rounded-lg ${
                      msg.userId === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
            {(typingOthers.length > 0 || recordingOthers.length > 0) && (
              <div className="text-xs text-muted-foreground pl-1">
                {typingOthers.length > 0 && (<span>{typingOthers.join(', ')} печатает… </span>)}
                {recordingOthers.length > 0 && (<span>{recordingOthers.join(', ')} записывает…</span>)}
              </div>
            )}
          </div>
          </div>

        <div className={`border-t relative flex-shrink-0 bg-background ${isMobile ? 'p-2 pb-safe' : 'p-3'}`}>
          <div className="flex gap-2 items-center w-full">
            <Input
              placeholder="Сообщение..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
                bumpTyping(true);
                typingTimeoutRef.current = window.setTimeout(() => bumpTyping(false), 1200);
              }}
              onKeyPress={handleKeyPress}
              className={`interactive focus-elegant flex-1 min-w-0 ${isMobile ? 'h-10 text-base' : ''}`}
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              className={`hover-lift flex-shrink-0 ${isMobile ? 'h-10 w-10' : ''}`} 
              disabled={isUploadingAudio}
            >
              <Send className="h-4 w-4" />
            </Button>
            {!isRecording ? (
              <Button 
                onClick={startRecording} 
                size="icon" 
                variant="outline" 
                title="Записать голосовое" 
                disabled={isUploadingAudio} 
                className={`flex-shrink-0 ${isMobile ? 'h-10 w-10' : ''}`}
              >
                {isUploadingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              </Button>
            ) : (
              <Button 
                onClick={stopRecording} 
                size="icon" 
                variant="destructive" 
                title="Остановить запись" 
                className={`flex-shrink-0 ${isMobile ? 'h-10 w-10' : ''}`}
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Resize handle - hide on mobile */}
          {!isMobile && (
            <div
              className="absolute bottom-1 right-1 w-3 h-3 cursor-se-resize"
              onMouseDown={(e) => {
                draggingRef.current = { type: 'resize', dx: chatSize.w - e.clientX, dy: chatSize.h - e.clientY };
                const onMove = (ev: MouseEvent) => setChatSize({
                  w: Math.max(360, ev.clientX + draggingRef.current.dx),
                  h: Math.max(360, ev.clientY + draggingRef.current.dy)
                });
                const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); draggingRef.current.type = null; };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
