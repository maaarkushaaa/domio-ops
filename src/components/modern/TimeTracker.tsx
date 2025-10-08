import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TimeTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsTracking(true);
    setIsPaused(false);
    toast({
      title: 'Трекер времени запущен',
      description: 'Время работы отслеживается',
    });
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsTracking(false);
    setIsPaused(false);
    toast({
      title: 'Работа завершена',
      description: `Отработано времени: ${formatTime(seconds)}`,
    });
    setSeconds(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Трекер времени
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="text-5xl font-mono font-bold">
            {formatTime(seconds)}
          </div>
          {isTracking && (
            <Badge variant={isPaused ? 'outline' : 'default'}>
              {isPaused ? 'Приостановлено' : 'Отслеживание активно'}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={handleStart} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Начать
            </Button>
          ) : (
            <>
              <Button onClick={handlePause} variant="outline" className="flex-1">
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? 'Продолжить' : 'Пауза'}
              </Button>
              <Button onClick={handleStop} variant="destructive" className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                Остановить
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
