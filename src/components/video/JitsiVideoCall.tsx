import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  Copy,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoCallProps {
  roomName?: string;
  onLeave?: () => void;
}

// Загрузка Jitsi API
const loadJitsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Jitsi script'));
    document.body.appendChild(script);
  });
};

export function JitsiVideoCall({ roomName, onLeave }: VideoCallProps) {
  const { toast } = useToast();
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [inCall, setInCall] = useState(false);
  const [participants, setParticipants] = useState<number>(0);
  const [roomUrl, setRoomUrl] = useState('');
  const [inputRoomName, setInputRoomName] = useState(roomName || '');
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  // Создание комнаты
  const createRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Ошибка', description: 'Необходимо авторизоваться', variant: 'destructive' });
        return null;
      }

      // Генерируем уникальное имя комнаты
      const room = inputRoomName || `domio-${Date.now()}`;
      const url = `https://meet.jit.si/${room}`;
      
      setRoomUrl(url);
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      toast({ title: 'Ошибка', description: 'Не удалось создать комнату', variant: 'destructive' });
      return null;
    }
  };

  // Присоединиться к звонку
  const joinCall = async () => {
    try {
      await loadJitsiScript();

      let room = inputRoomName;
      if (!room) {
        room = await createRoom();
        if (!room) return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Пользователь';

      if (!jitsiContainerRef.current) return;

      const domain = 'meet.jit.si';
      const options = {
        roomName: room,
        width: '100%',
        height: 600,
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'chat',
            'recording',
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'invite',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
        userInfo: {
          displayName: displayName,
        },
      };

      const api = new (window as any).JitsiMeetExternalAPI(domain, options);

      api.addEventListener('videoConferenceJoined', () => {
        setInCall(true);
        toast({ title: 'Подключено', description: 'Вы присоединились к звонку' });
      });

      api.addEventListener('videoConferenceLeft', () => {
        setInCall(false);
        api.dispose();
        setJitsiApi(null);
        onLeave?.();
        toast({ title: 'Звонок завершён', description: 'Вы покинули видеоконференцию' });
      });

      api.addEventListener('participantJoined', () => {
        const count = api.getNumberOfParticipants();
        setParticipants(count);
      });

      api.addEventListener('participantLeft', () => {
        const count = api.getNumberOfParticipants();
        setParticipants(count);
      });

      setJitsiApi(api);

    } catch (error) {
      console.error('Error joining call:', error);
      toast({ 
        title: 'Ошибка подключения', 
        description: 'Не удалось присоединиться к звонку', 
        variant: 'destructive' 
      });
    }
  };

  // Покинуть звонок
  const leaveCall = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('hangup');
    }
  };

  // Копировать ссылку на комнату
  const copyRoomLink = () => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
      toast({ title: 'Скопировано', description: 'Ссылка на комнату скопирована в буфер обмена' });
    }
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
    };
  }, [jitsiApi]);

  if (inCall) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-green-500" />
                Видеозвонок активен
                {participants > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    <Users className="h-3 w-3 mr-1" />
                    {participants}
                  </Badge>
                )}
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
          <CardContent>
            <div 
              ref={jitsiContainerRef} 
              className="relative rounded-lg overflow-hidden bg-black"
              style={{ minHeight: '600px' }}
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
          <Button onClick={joinCall} className="flex-1">
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
}
