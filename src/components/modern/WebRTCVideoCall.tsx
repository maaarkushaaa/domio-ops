import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Monitor,
  MessageSquare,
  Copy,
  UserPlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Participant {
  id: string;
  name: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export function WebRTCVideoCall() {
  const { toast } = useToast();
  const [inCall, setInCall] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; message: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Инициализация локального видеопотока
    if (inCall && localVideoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error('Ошибка доступа к камере:', error);
          toast({
            title: 'Ошибка',
            description: 'Не удалось получить доступ к камере',
            variant: 'destructive',
          });
        });
    }

    return () => {
      // Очистка
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [inCall]);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const startCall = () => {
    const newRoomId = roomId || generateRoomId();
    setCurrentRoom(newRoomId);
    setInCall(true);
    
    // Добавить себя как участника
    setParticipants([
      {
        id: '1',
        name: 'Вы',
        isAudioEnabled: true,
        isVideoEnabled: true,
      },
    ]);

    toast({
      title: 'Звонок начат',
      description: `Комната: ${newRoomId}`,
    });
  };

  const endCall = () => {
    setInCall(false);
    setCurrentRoom('');
    setParticipants([]);
    setScreenSharing(false);
    
    // Остановить все медиапотоки
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    toast({
      title: 'Звонок завершен',
      description: 'Видеоконференция завершена',
    });
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        setScreenSharing(true);
        toast({
          title: 'Демонстрация экрана',
          description: 'Начата трансляция экрана',
        });

        screenStream.getVideoTracks()[0].onended = () => {
          setScreenSharing(false);
        };
      } catch (error) {
        console.error('Ошибка демонстрации экрана:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось начать демонстрацию экрана',
          variant: 'destructive',
        });
      }
    } else {
      setScreenSharing(false);
      toast({
        title: 'Демонстрация экрана',
        description: 'Трансляция экрана остановлена',
      });
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(currentRoom);
    toast({
      title: 'Скопировано',
      description: 'ID комнаты скопирован в буфер обмена',
    });
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    setChatMessages([...chatMessages, { sender: 'Вы', message: chatInput }]);
    setChatInput('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Видеозвонки WebRTC
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!inCall ? (
          <div className="space-y-4">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              <div className="text-center space-y-4 relative z-10">
                <Users className="h-16 w-16 mx-auto text-primary" />
                <div>
                  <h3 className="text-lg font-medium">Создайте комнату</h3>
                  <p className="text-sm text-muted-foreground">
                    или присоединитесь к существующей
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="ID комнаты (необязательно)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  maxLength={8}
                />
                <Button onClick={startCall}>
                  <Video className="h-4 w-4 mr-2" />
                  Начать
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Если не указан ID, будет создана новая комната
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-medium">В эфире</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Комната:</span>
                <Badge variant="outline">{currentRoom}</Badge>
                <Button size="sm" variant="ghost" onClick={copyRoomId}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Локальное видео */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary">Вы</Badge>
                </div>
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Удаленное видео */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Ожидание участников...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Участники */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Участники ({participants.length})</span>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Пригласить
                </Button>
              </div>
              <div className="space-y-1">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                  >
                    <span className="text-sm">{participant.name}</span>
                    <div className="flex gap-1">
                      {participant.isAudioEnabled ? (
                        <Mic className="h-4 w-4 text-success" />
                      ) : (
                        <MicOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      {participant.isVideoEnabled ? (
                        <Video className="h-4 w-4 text-success" />
                      ) : (
                        <VideoOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Чат */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Чат</span>
              </div>
              <ScrollArea className="h-32 border rounded-lg p-3">
                <div className="space-y-2">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{msg.sender}:</span>{' '}
                      <span className="text-muted-foreground">{msg.message}</span>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Пока нет сообщений
                    </p>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  placeholder="Написать сообщение..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button size="sm" onClick={sendMessage}>
                  Отправить
                </Button>
              </div>
            </div>

            {/* Управление */}
            <div className="flex gap-2">
              <Button
                variant={videoEnabled ? 'default' : 'destructive'}
                size="icon"
                onClick={toggleVideo}
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={audioEnabled ? 'default' : 'destructive'}
                size="icon"
                onClick={toggleAudio}
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={screenSharing ? 'default' : 'outline'}
                size="icon"
                onClick={toggleScreenShare}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button variant="destructive" className="flex-1" onClick={endCall}>
                <PhoneOff className="h-4 w-4 mr-2" />
                Завершить
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
