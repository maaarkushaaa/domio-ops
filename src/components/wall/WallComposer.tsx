import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, Video, Mic, Poll as PollIcon, Brush } from 'lucide-react';
import { WallGraffitiCanvas } from './WallGraffitiCanvas';

export function WallComposer({ scope, scopeId }: { scope: 'project' | 'task'; scopeId?: string }) {
  const [text, setText] = useState('');
  const [isGraffitiOpen, setGraffitiOpen] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string }>>([]);

  const handleSubmit = async () => {
    // TODO: upload attachments to Storage and insert into wall_posts + wall_attachments
    setText('');
    setAttachments([]);
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: upload to Storage and get URL
    const url = URL.createObjectURL(file);
    setAttachments((a) => [...a, { type: 'image', url }]);
  };

  const handlePickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachments((a) => [...a, { type: 'video', url }]);
  };

  const handleGraffitiSave = async (blob: Blob) => {
    // TODO: upload blob to Storage and add to attachments
    const url = URL.createObjectURL(blob);
    setAttachments((a) => [...a, { type: 'image', url }]);
    setGraffitiOpen(false);
  };

  return (
    <div className="space-y-3">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите что-нибудь..." />
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div key={i} className="border rounded p-1 text-xs">
              {att.type.toUpperCase()}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" /> Фото
            <input type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
          </label>
          <label className="cursor-pointer inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Video className="h-4 w-4" /> Видео
            <input type="file" accept="video/*" className="hidden" onChange={handlePickVideo} />
          </label>
          <button type="button" className="inline-flex items-center gap-1 text-sm text-muted-foreground" onClick={() => setGraffitiOpen(true)}>
            <Brush className="h-4 w-4" /> Граффити
          </button>
          <button type="button" className="inline-flex items-center gap-1 text-sm text-muted-foreground" disabled>
            <Mic className="h-4 w-4" /> Голос
          </button>
          <button type="button" className="inline-flex items-center gap-1 text-sm text-muted-foreground" disabled>
            <PollIcon className="h-4 w-4" /> Опрос
          </button>
        </div>
        <Button onClick={handleSubmit} disabled={!text && attachments.length === 0}>Опубликовать</Button>
      </div>

      <Dialog open={isGraffitiOpen} onOpenChange={setGraffitiOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Нарисовать граффити</DialogTitle>
          </DialogHeader>
          <WallGraffitiCanvas onSave={handleGraffitiSave} onCancel={() => setGraffitiOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
