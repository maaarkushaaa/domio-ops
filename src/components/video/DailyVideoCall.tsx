import { useState, useEffect, useCallback } from 'react';
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
  Settings,
  Maximize2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoCallProps {
  roomName?: string;
  onLeave?: () => void;
}

export function DailyVideoCall({ roomName, onLeave }: VideoCallProps) {
  const { toast } = useToast();
  const [callFrame, setCallFrame] = useState<any>(null);
  const [inCall, setInCall] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<number>(0);
  const [roomUrl, setRoomUrl] = useState('');
  const [inputRoomName, setInputRoomName] = useState(roomName || '');

  // Создание комнаты
  const createRoom = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Ошибка', description: 'Необходимо авторизоваться', variant: 'destructive' });
        return;
      }

      // Генерируем уникальное имя комнаты
      const roomName = inputRoomName || `domio-${Date.now()}`;
      
      // В production здесь должен быть вызов к вашему backend для создания комнаты через Daily API
      // Пока используем прямую ссылку (требует настройки Daily.co аккаунта)
      const url = `https://domio.daily.co/${roomName}`;
      
      setRoomUrl(url);
      return url;
    } catch (error) {
      console.error('Error creating room:', error);
      toast({ title: 'Ошибка', description: 'Не удалось создать комнату', variant: 'destructive' });
      return null;
    }
  }, [inputRoomName, toast]);

  // Присоединиться к звонку
  const joinCall = useCallback(async () => {
    try {
      // Проверяем доступность Daily.co скрипта
      if (typeof window === 'undefined' || !(window as any).DailyIframe) {
        toast({ 
          title: 'Загрузка...', 
          description: 'Подключение модуля видеозвонков' 
        });
        
        // Загружаем Daily.co скрипт динамически
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@daily-co/daily-js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const DailyIframe = (window as any).DailyIframe;
      
      let url = roomUrl;
      if (!url) {
        url = await createRoom() || '';
        if (!url) return;
      }

      // Создаем iframe для видеозвонка
      const frame = DailyIframe.createFrame({
        showLeaveButton: true,
        iframeStyle: {
          position: 'relative',
          width: '100%',
          height: '600px',
          border: '0',
          borderRadius: '8px',
        },
      });

      // Подписываемся на события
      frame
        .on('joined-meeting', () => {
          setInCall(true);
          toast({ title: 'Подключено', description: 'Вы присоединились к звонку' });
        })
        .on('left-meeting', () => {
          setInCall(false);
          frame.destroy();
          setCallFrame(null);
          onLeave?.();
          toast({ title: 'Звонок завершён', description: 'Вы покинули видеоконференцию' });
        })
        .on('participant-joined', () => {
          const participantCount = Object.keys(frame.participants()).length;
          setParticipants(participantCount);
        })
        .on('participant-left', () => {
          const participantCount = Object.keys(frame.participants()).length;
          setParticipants(participantCount);
        })
        .on('error', (error: any) => {
          console.error('Daily error:', error);
          toast({ 
            title: 'Ошибка видеозвонка', 
            description: error.errorMsg || 'Произошла ошибка', 
            variant: 'destructive' 
          });
        });

      // Присоединяемся к комнате
      await frame.join({ url });
      setCallFrame(frame);

    } catch (error) {
      console.error('Error joining call:', error);
      toast({ 
        title: 'Ошибка подключения', 
        description: 'Не удалось присоединиться к звонку', 
        variant: 'destructive' 
      });
    }
  }, [roomUrl, createRoom, onLeave, toast]);

  // Покинуть звонок
  const leaveCall = useCallback(() => {
    if (callFrame) {
      callFrame.leave();
    }
  }, [callFrame]);

  // Управление микрофоном
  const toggleAudio = useCallback(() => {
    if (callFrame) {
      callFrame.setLocalAudio(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  }, [callFrame, audioEnabled]);

  // Управление видео
  const toggleVideo = useCallback(() => {
    if (callFrame) {
      callFrame.setLocalVideo(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  }, [callFrame, videoEnabled]);

  // Демонстрация экрана
  const toggleScreenShare = useCallback(async () => {
    if (callFrame) {
      try {
        if (screenSharing) {
          await callFrame.stopScreenShare();
          setScreenSharing(false);
        } else {
          await callFrame.startScreenShare();
          setScreenSharing(true);
        }
      } catch (error) {
        console.error('Screen share error:', error);
        toast({ 
          title: 'Ошибка', 
          description: 'Не удалось начать демонстрацию экрана', 
          variant: 'destructive' 
        });
      }
    }
  }, [callFrame, screenSharing, toast]);

  // Копировать ссылку на комнату
  const copyRoomLink = useCallback(() => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
      toast({ title: 'Скопировано', description: 'Ссылка на комнату скопирована в буфер обмена' });
    }
  }, [roomUrl, toast]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [callFrame]);

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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div id="daily-call-container" className="relative rounded-lg overflow-hidden bg-black" />
            
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                size="lg"
                variant={audioEnabled ? 'default' : 'destructive'}
                onClick={toggleAudio}
                className="rounded-full w-14 h-14"
              >
                {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              
              <Button
                size="lg"
                variant={videoEnabled ? 'default' : 'destructive'}
                onClick={toggleVideo}
                className="rounded-full w-14 h-14"
              >
                {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              
              <Button
                size="lg"
                variant={screenSharing ? 'secondary' : 'outline'}
                onClick={toggleScreenShare}
                className="rounded-full w-14 h-14"
              >
                <Monitor className="h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="destructive"
                onClick={leaveCall}
                className="rounded-full w-14 h-14"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
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
