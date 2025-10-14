import { useState } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface QuickCallButtonProps {
  taskId?: string;
  projectId?: string;
  participantName?: string;
}

export function QuickCallButton({ taskId, projectId, participantName }: QuickCallButtonProps) {
  const [callOpen, setCallOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { toast } = useToast();

  const startCall = () => {
    setInCall(true);
    toast({
      title: 'Звонок начат',
      description: participantName ? `Звоним ${participantName}` : 'Видеоконференция активна',
    });
  };

  const endCall = () => {
    setInCall(false);
    setCallOpen(false);
    toast({
      title: 'Звонок завершен',
      description: 'Видеоконференция завершена',
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCallOpen(true)}
        className="gap-2"
      >
        <Video className="h-4 w-4" />
        Звонок
      </Button>

      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {participantName ? `Видеозвонок с ${participantName}` : 'Видеозвонок'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!inCall ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Video className="h-16 w-16 text-white mx-auto" />
                    <p className="text-white text-sm">
                      {participantName || 'Участник'} будет уведомлен о звонке
                    </p>
                  </div>
                </div>
                <Button onClick={startCall} className="w-full" size="lg">
                  <Video className="h-5 w-5 mr-2" />
                  Начать звонок
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Имитация видео */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse" />
                  <Video className="h-20 w-20 text-white z-10" />
                  
                  {/* Индикатор "В эфире" */}
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 animate-pulse">
                    <div className="h-2 w-2 bg-white rounded-full" />
                    В эфире
                  </div>

                  {/* Превью локального видео */}
                  <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-800 rounded-lg border-2 border-white/20 flex items-center justify-center">
                    <Video className="h-8 w-8 text-white/60" />
                  </div>

                  {/* Имя участника */}
                  {participantName && (
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                      {participantName}
                    </div>
                  )}
                </div>

                {/* Управление звонком */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant={videoEnabled ? 'default' : 'destructive'}
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                  >
                    {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant={audioEnabled ? 'default' : 'destructive'}
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="px-8 rounded-full"
                    onClick={endCall}
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    Завершить
                  </Button>
                </div>

                {/* Информация о звонке */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>Длительность: 00:42</p>
                  {taskId && <p className="text-xs mt-1">Задача: {taskId.slice(0, 8)}</p>}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
