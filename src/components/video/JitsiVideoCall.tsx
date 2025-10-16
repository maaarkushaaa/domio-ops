import { useState, useEffect } from 'react';
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
  Copy,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoCallProps {
  roomName?: string;
  onLeave?: () => void;
}

export function JitsiVideoCall({ roomName, onLeave }: VideoCallProps) {
  const { toast } = useToast();
  const [inCall, setInCall] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');
  const [inputRoomName, setInputRoomName] = useState(roomName || '');

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
      const url = `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

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
      let room = inputRoomName;
      if (!room) {
        room = await createRoom();
        if (!room) return;
      }

      setInCall(true);
      toast({ title: 'Подключено', description: 'Видеоконференция запущена' });

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
    setInCall(false);
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

  // Генерируем ссылку при изменении inputRoomName
  useEffect(() => {
    if (inputRoomName) {
      const url = `https://meet.jit.si/${inputRoomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;
      setRoomUrl(url);
    }
  }, [inputRoomName]);

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
};
