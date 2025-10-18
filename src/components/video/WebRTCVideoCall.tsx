import { useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVideoCallRealtime } from '@/providers/VideoCallRealtimeProvider';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Signal } from 'lucide-react';

export function WebRTCVideoCall() {
  const {
    session,
    participants,
    localStream,
    remoteStreams,
    connectionState,
    isAudioEnabled,
    isVideoEnabled,
    setAudioEnabled,
    setVideoEnabled,
    leaveSession,
  } = useVideoCallRealtime();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream) {
      video.srcObject = localStream;
      video.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    remoteRefs.current.forEach((node) => {
      node.srcObject = null;
    });

    remoteStreams.forEach(({ id, stream }) => {
      const node = remoteRefs.current.get(id);
      if (node) {
        node.srcObject = stream;
        node.play().catch(() => {});
      }
    });
  }, [remoteStreams]);

  const connectionBadge = useMemo(() => {
    switch (connectionState) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Связь установлена</Badge>;
      case 'connecting':
      case 'new':
        return <Badge variant="secondary">Подключение...</Badge>;
      case 'disconnected':
      case 'failed':
        return <Badge variant="destructive">Проблемы со связью</Badge>;
      default:
        return <Badge variant="outline">{connectionState}</Badge>;
    }
  }, [connectionState]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Signal className="h-5 w-5 text-primary" />
                {session?.title || 'Видеозвонок'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Участники: {participants.length}
              </p>
            </div>
            <div className="flex gap-2">{connectionBadge}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative aspect-video rounded-lg bg-muted overflow-hidden">
              <video
                ref={localVideoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                Вы
              </span>
            </div>
            <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
              {remoteStreams.length === 0 ? (
                <div className="aspect-video rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground border border-dashed">
                  Нет подключённых участников
                </div>
              ) : (
                remoteStreams.map(({ id }) => (
                  <div key={id} className="relative aspect-video rounded-lg bg-muted overflow-hidden">
                    <video
                      ref={(node) => {
                        if (node) {
                          remoteRefs.current.set(id, node);
                        } else {
                          remoteRefs.current.delete(id);
                        }
                      }}
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                      Участник
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant={isAudioEnabled ? 'secondary' : 'destructive'}
              className="gap-2"
              onClick={() => setAudioEnabled(!isAudioEnabled)}
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {isAudioEnabled ? 'Микрофон включён' : 'Микрофон выключен'}
            </Button>
            <Button
              variant={isVideoEnabled ? 'secondary' : 'destructive'}
              className="gap-2"
              onClick={() => setVideoEnabled(!isVideoEnabled)}
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              {isVideoEnabled ? 'Камера включена' : 'Камера выключена'}
            </Button>
            <Button variant="destructive" className="gap-2" onClick={leaveSession}>
              <PhoneOff className="h-4 w-4" />
              Завершить звонок
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
