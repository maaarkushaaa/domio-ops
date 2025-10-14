import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, Video, Mic, ListChecks as PollIcon, Brush } from 'lucide-react';
import { WallGraffitiCanvas } from './WallGraffitiCanvas';
import { VoiceRecorder } from './VoiceRecorder';
import { PollCreator, PollData } from './PollCreator';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { createWallPost } from '@/hooks/use-wall';
import { useQueryClient } from '@tanstack/react-query';

export function WallComposer({ scope, scopeId }: { scope: 'project' | 'task'; scopeId?: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [isGraffitiOpen, setGraffitiOpen] = useState(false);
  const [isVoiceOpen, setVoiceOpen] = useState(false);
  const [isPollOpen, setPollOpen] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; file?: File | Blob; name?: string }>>([]);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text && attachments.length === 0 && !poll) return;
    try {
      setSubmitting(true);
      await createWallPost({
        scope,
        scopeId: scopeId || null,
        content: text,
        files: attachments.map(a => ({ file: a.file!, type: a.type, name: a.name })),
        poll: poll || undefined,
      });
      setText('');
      setAttachments([]);
      setPoll(null);
      qc.invalidateQueries({ queryKey: ['wall_feed'] });
    } catch (e) {
      alert('Ошибка публикации поста');
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachments((a) => [...a, { type: 'image', url, file, name: file.name }]);
  };

  const handlePickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachments((a) => [...a, { type: 'video', url, file, name: file.name }]);
  };

  const handleGraffitiSave = async (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setAttachments((a) => [...a, { type: 'image', url, file: blob, name: `graffiti-${Date.now()}.png` }]);
    setGraffitiOpen(false);
  };

  const handleVoiceSave = async (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setAttachments((a) => [...a, { type: 'audio', url, file: blob, name: `voice-${Date.now()}.webm` }]);
    setVoiceOpen(false);
  };

  const handlePollSave = (pollData: PollData) => {
    setPoll(pollData);
    setPollOpen(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать сообщение..." className="text-sm flex-1" />
        <VoiceInput onTranscript={(transcript) => setText(prev => prev ? `${prev} ${transcript}` : transcript)} />
      </div>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div key={i} className="relative border rounded overflow-hidden bg-gray-50 group">
              {att.type === 'image' ? (
                <img src={att.url} alt="preview" className="h-20 w-20 object-cover" />
              ) : att.type === 'video' ? (
                <video src={att.url} className="h-20 w-20 object-cover" />
              ) : att.type === 'audio' ? (
                <div className="h-20 w-20 flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-medium">
                  🎤 Голос
                </div>
              ) : (
                <div className="h-20 w-20 flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-medium">
                  📎 Файл
                </div>
              )}
              <button
                type="button"
                onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {poll && (
        <div className="border rounded p-2 bg-blue-50 text-xs">
          <strong>Опрос:</strong> {poll.question} ({poll.options.length} вариантов)
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600">
            <ImageIcon className="h-4 w-4" /> Фото
            <input type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
          </label>
          <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600">
            <Video className="h-4 w-4" /> Видео
            <input type="file" accept="video/*" className="hidden" onChange={handlePickVideo} />
          </label>
          <button type="button" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600" onClick={() => setGraffitiOpen(true)}>
            <Brush className="h-4 w-4" /> Граффити
          </button>
          <button type="button" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600" onClick={() => setVoiceOpen(true)}>
            <Mic className="h-4 w-4" /> Голос
          </button>
          <button type="button" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600" onClick={() => setPollOpen(true)}>
            <PollIcon className="h-4 w-4" /> Опрос
          </button>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting || (!text && attachments.length === 0 && !poll)} size="sm">
          {isSubmitting ? 'Публикация…' : 'Опубликовать'}
        </Button>
      </div>

      <Dialog open={isGraffitiOpen} onOpenChange={setGraffitiOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Нарисовать граффити</DialogTitle>
          </DialogHeader>
          <WallGraffitiCanvas onSave={handleGraffitiSave} onCancel={() => setGraffitiOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isVoiceOpen} onOpenChange={setVoiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Записать голосовое сообщение</DialogTitle>
          </DialogHeader>
          <VoiceRecorder onSave={handleVoiceSave} onCancel={() => setVoiceOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isPollOpen} onOpenChange={setPollOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Создать опрос</DialogTitle>
          </DialogHeader>
          <PollCreator onSave={handlePollSave} onCancel={() => setPollOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
