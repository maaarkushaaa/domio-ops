import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function VideoCallWidget() {
  const [inCall, setInCall] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { toast } = useToast();

  const startCall = () => {
    setInCall(true);
    toast({
      title: 'Звонок начат',
      description: 'Видеоконференция активна',
    });
  };

  const endCall = () => {
    setInCall(false);
    toast({
      title: 'Звонок завершен',
      description: 'Видеоконференция завершена',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Видеозвонки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!inCall ? (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <Users className="h-16 w-16 text-muted-foreground" />
            </div>
            <Button onClick={startCall} className="w-full">
              <Video className="h-4 w-4 mr-2" />
              Начать звонок
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center relative">
              <Video className="h-16 w-16 text-primary" />
              <div className="absolute top-2 right-2 bg-destructive text-white px-2 py-1 rounded text-xs font-medium">
                В эфире
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={videoEnabled ? 'default' : 'destructive'}
                size="icon"
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={audioEnabled ? 'default' : 'destructive'}
                size="icon"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
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
