import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Monitor, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Meeting {
  id: string;
  title: string;
  participants: number;
  duration: string;
  status: 'live' | 'scheduled' | 'ended';
}

export function VideoConferencing() {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [meetings] = useState<Meeting[]>([
    { id: '1', title: 'Планерка команды', participants: 8, duration: '45 мин', status: 'live' },
    { id: '2', title: 'Презентация клиенту', participants: 3, duration: '1 ч', status: 'scheduled' },
  ]);
  const { toast } = useToast();

  const startMeeting = () => {
    toast({
      title: 'Встреча началась',
      description: 'Приглашения отправлены участникам',
    });
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Видеоконференции
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center space-y-3">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Нажмите начать для запуска встречи</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant={isVideoOn ? 'default' : 'outline'}
                size="icon"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={isMicOn ? 'default' : 'outline'}
                size="icon"
                onClick={() => setIsMicOn(!isMicOn)}
              >
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon">
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={startMeeting} className="hover-lift">
              Начать встречу
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Активные встречи</h4>
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-3 rounded-lg border border-border/50 flex items-center justify-between animate-fade-in"
            >
              <div>
                <p className="font-medium text-sm">{meeting.title}</p>
                <p className="text-xs text-muted-foreground">
                  {meeting.participants} участников • {meeting.duration}
                </p>
              </div>
              <Badge variant={meeting.status === 'live' ? 'default' : 'outline'}>
                {meeting.status === 'live' ? 'В эфире' : 'Запланировано'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
