import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, PhoneOff, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVideoCallRealtime } from '@/providers/VideoCallRealtimeProvider';

const buildJitsiUrl = (room: string) =>
  `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

interface VideoCallProps {
  roomName?: string;
  roomUrl?: string;
  title?: string;
  autoJoin?: boolean;
  onJoin?: (room: string, payload: { url: string; id?: string; title: string }) => void;
  onLeave?: () => void;
}

export function JitsiVideoCall({ roomName, roomUrl: initialRoomUrl, title, autoJoin = false, onJoin, onLeave }: VideoCallProps) {
  const { toast } = useToast();
  const { setActiveCall: setRealtimeActive } = useVideoCallRealtime();
  const [inCall, setInCall] = useState(false);
  const [roomUrl, setRoomUrl] = useState(initialRoomUrl || '');
  const [inputRoomName, setInputRoomName] = useState(roomName || '');
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [isBroadcastOwner, setIsBroadcastOwner] = useState(false);
  const [joining, setJoining] = useState(false);

  const ensureRoom = () => {
    let room = roomName || inputRoomName;
    if (!room) {
      room = `domio-${Date.now()}`;
      setInputRoomName(room);
    }
    const url = buildJitsiUrl(room);
    setRoomUrl(url);
    return { room, url };
  };

  const fetchExistingBroadcast = async (room: string) => {
    const { data, error } = await (supabase as any)
      .from('video_quick_calls')
      .select('*')
      .eq('room_name', room)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error fetching existing quick call:', error);
      return null;
    }
    return data;
  };

  const joinCall = async (options?: { auto?: boolean }) => {
    if (joining || inCall) return;
    setJoining(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({ title: 'Ошибка', description: 'Необходимо авторизоваться', variant: 'destructive' });
        return;
      }
      const { room, url } = ensureRoom();
      let createdId: string | null = null;
      let createdTitle = title || inputRoomName || 'Быстрый звонок';

      if (!roomName) {
        const insertPayload = {
          title: createdTitle,
          room_name: room,
          room_url: url,
          created_by: userData.user.id,
        };

        const { data, error } = await (supabase as any)
          .from('video_quick_calls')
          .insert(insertPayload)
          .select()
          .single();

        if (error && error.code !== '23505') {
          throw error;
        }

        if (error && error.code === '23505') {
          const existing = await fetchExistingBroadcast(room);
          if (existing) {
            createdId = existing.id;
            createdTitle = existing.title;
            setRealtimeActive(existing);
            setIsBroadcastOwner(existing.created_by === userData.user.id);
          }
        } else if (data) {
          createdId = data.id;
          createdTitle = data.title;
          setRealtimeActive(data);
          setIsBroadcastOwner(true);
        }

        setBroadcastId(createdId);
      } else {
        const existing = await fetchExistingBroadcast(room);
        if (existing) {
          createdId = existing.id;
          createdTitle = existing.title;
          setRealtimeActive(existing);
        }
        setBroadcastId(createdId);
        setIsBroadcastOwner(false);
      }

      setInCall(true);
      toast({ title: 'Подключено', description: 'Видеоконференция запущена' });
      onJoin?.(room, { url, id: createdId ?? undefined, title: createdTitle });
    } catch (error) {
      console.error('Error joining call:', error);
      toast({
        title: 'Ошибка подключения',
        description: 'Не удалось присоединиться к звонку',
        variant: 'destructive'
      });
    }
    setJoining(false);
  };

  const leaveCall = async () => {
    setInCall(false);
    if (isBroadcastOwner && broadcastId) {
      const { error } = await (supabase as any)
        .from('video_quick_calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', broadcastId);
      if (error) {
        console.error('Error ending quick call:', error);
      }
    }
    setRealtimeActive(null);
    onLeave?.();
    toast({ title: 'Звонок завершён', description: 'Вы покинули видеоконференцию' });
  };

  // Копировать ссылку на комнату
  const copyRoomLink = () => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
      toast({ title: 'Скопировано', description: 'Ссылка на комнату скопирована в буфер обмена' });
    }
  };

  useEffect(() => {
    if (initialRoomUrl) {
      setRoomUrl(initialRoomUrl);
    }
  }, [initialRoomUrl]);

  useEffect(() => {
    if (roomName) {
      setInputRoomName(roomName);
      if (!initialRoomUrl) {
        setRoomUrl(buildJitsiUrl(roomName));
      }
    }
  }, [roomName, initialRoomUrl]);

  useEffect(() => {
    if (!roomName && inputRoomName) {
      setRoomUrl(buildJitsiUrl(inputRoomName));
    }
  }, [inputRoomName, roomName]);

  useEffect(() => {
    if (autoJoin && roomName) {
      joinCall({ auto: true });
    }
  }, [autoJoin, roomName]);

  if (inCall) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-green-500" />
                Видеозвонок активен
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyRoomLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Ссылка
                </Button>
                <Button size="sm" variant="destructive" onClick={leaveCall}>
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Завершить
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              src={roomUrl}
              allow="camera; microphone; fullscreen; display-capture"
              style={{
                width: '100%',
                height: '600px',
                border: 'none',
                borderRadius: '8px',
              }}
              title="Jitsi Meet"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Начать видеозвонок
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Название комнаты (необязательно)</label>
          <Input
            placeholder="Введите название или оставьте пустым"
            value={inputRoomName}
            onChange={(e) => setInputRoomName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Если оставить пустым, будет создана комната с уникальным названием
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => joinCall()} className="flex-1" disabled={joining}>
            <Video className="h-4 w-4 mr-2" />
            Создать и присоединиться
          </Button>
        </div>

        {roomUrl && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Ссылка на комнату:</p>
            <div className="flex gap-2">
              <Input value={roomUrl} readOnly className="font-mono text-xs" />
              <Button size="sm" variant="outline" onClick={copyRoomLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Поделитесь этой ссылкой с участниками
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Преимущества Jitsi Meet:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✅ Полностью бесплатно, без ограничений</li>
            <li>✅ Не требует регистрации</li>
            <li>✅ Шифрование end-to-end</li>
            <li>✅ Демонстрация экрана</li>
            <li>✅ Запись звонков</li>
            <li>✅ Чат и реакции</li>
          </ul>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Требования:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Разрешите доступ к камере и микрофону</li>
            <li>• Используйте современный браузер (Chrome, Firefox, Safari, Edge)</li>
            <li>• Стабильное интернет-соединение</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
