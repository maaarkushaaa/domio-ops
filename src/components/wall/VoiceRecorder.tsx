import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause } from 'lucide-react';

export function VoiceRecorder({ onSave, onCancel }: { onSave: (blob: Blob) => void; onCancel: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Не удалось получить доступ к микрофону');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSave = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onSave(audioBlob);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        {!isRecording && !audioURL && (
          <Button onClick={startRecording} size="lg" className="gap-2">
            <Mic className="h-5 w-5" />
            Начать запись
          </Button>
        )}
        {isRecording && (
          <Button onClick={stopRecording} size="lg" variant="destructive" className="gap-2">
            <Square className="h-5 w-5" />
            Остановить
          </Button>
        )}
      </div>

      {audioURL && (
        <div className="space-y-3">
          <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} className="hidden" />
          <div className="flex items-center justify-center gap-2">
            <Button onClick={togglePlayback} variant="outline" size="sm" className="gap-2">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Пауза' : 'Прослушать'}
            </Button>
            <Button onClick={() => { setAudioURL(null); audioChunksRef.current = []; }} variant="outline" size="sm">
              Записать заново
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Отмена</Button>
        <Button onClick={handleSave} disabled={!audioURL}>Сохранить</Button>
      </div>
    </div>
  );
}
