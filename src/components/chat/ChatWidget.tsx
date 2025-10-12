import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { MessageCircle, Send, X, Minimize2, Mic, Square, Hash, List } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unread, setUnread] = useState(0);
  const [channel, setChannel] = useState<'global' | 'task'>('global');
  const [taskId, setTaskId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from Supabase and subscribe to realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      try {
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
      }

      // Realtime subscription (listen to all new messages to raise notifications)
      channel = supabase
        .channel('team_messages_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages' }, async (payload) => {
          const m = payload.new as any;
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

          // If message belongs to current view, append; otherwise, increment unread
          const isForCurrent = (channel === 'global' && enriched.channel === 'global') ||
            (channel === 'task' && enriched.channel === 'task' && taskId && enriched.taskId === taskId);

          if (isForCurrent) {
            setMessages(prev => [...prev, enriched]);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          } else {
            setUnread(prev => prev + 1);
          }

          // Play a short notification sound
          try {
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
          } catch {}
        })
        .subscribe();
    };

    load();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [channel, taskId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      // Optimistic UI is optional; rely on realtime insert event
      const { error } = await (supabase as any)
        .from('team_messages')
        .insert({
          user_id: user.id,
          content,
          channel: channel === 'task' ? 'task' : 'global',
          task_id: channel === 'task' && taskId ? taskId : null,
          type: 'text',
        });
      if (error) throw error;
      toast({ title: 'Сообщение отправлено' });
    } catch (e: any) {
      console.error('Chat send error:', e);
      toast({ title: 'Ошибка', description: e.message || 'Не удалось отправить сообщение', variant: 'destructive' });
    }
  };

  const startRecording = async () => {
    if (isRecording || !user) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const fileName = `${user.id}/${crypto.randomUUID()}.webm`;
          const { error: uploadError } = await supabase.storage.from('chat-audio').upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'audio/webm'
          });
          if (uploadError) throw uploadError;
          const { data: publicUrl } = supabase.storage.from('chat-audio').getPublicUrl(fileName);
          const { error: insertError } = await (supabase as any)
            .from('team_messages')
            .insert({
              user_id: user.id,
              content: '',
              channel: channel === 'task' ? 'task' : 'global',
              task_id: channel === 'task' && taskId ? taskId : null,
              type: 'audio',
              audio_url: publicUrl.publicUrl
            });
          if (insertError) throw insertError;
          toast({ title: 'Голосовое отправлено' });
        } catch (e: any) {
          console.error('Audio send error:', e);
          toast({ title: 'Ошибка', description: e.message || 'Не удалось отправить голосовое', variant: 'destructive' });
        } finally {
          setIsRecording(false);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-glow hover-lift animate-scale-in z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
            {unread}
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

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col glass-card shadow-glow hover-lift z-50 animate-scale-in">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Чат команды
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <Button variant={channel==='global'? 'default':'outline'} size="sm" onClick={() => { setChannel('global'); setUnread(0); }}>
              <Hash className="h-3 w-3 mr-1" /> Общий
            </Button>
            <Button variant={channel==='task'? 'default':'outline'} size="sm" onClick={() => { setChannel('task'); setUnread(0); }}>
              <List className="h-3 w-3 mr-1" /> Задача
            </Button>
            {channel === 'task' && (
              <Input
                placeholder="Task ID"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="h-7 w-40"
              />
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Нет сообщений. Начните общение!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.userId === user?.id ? 'flex-row-reverse' : ''
                  } animate-fade-in`}
                >
                  <Avatar className="h-8 w-8">
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
                      <div className={`p-2 rounded-lg bg-muted w-full`}>
                        <audio src={msg.audioUrl} controls preload="metadata" className="w-full" />
                      </div>
                    ) : (
                      <div className={`p-3 rounded-lg ${
                        msg.userId === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Напишите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="interactive focus-elegant"
            />
            <Button onClick={handleSend} size="icon" className="hover-lift">
              <Send className="h-4 w-4" />
            </Button>
            {!isRecording ? (
              <Button onClick={startRecording} size="icon" variant="outline" title="Записать голосовое">
                <Mic className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={stopRecording} size="icon" variant="destructive" title="Остановить запись">
                <Square className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
