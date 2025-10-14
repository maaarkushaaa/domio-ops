import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function WallGraffitiCanvas({ onSave, onCancel }: { onSave: (blob: Blob) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState<string>('#6d28d9');
  const [size, setSize] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // HiDPI support
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    draw(e);
  };
  const handlePointerUp = () => setIsDrawing(false);
  const handlePointerLeave = () => setIsDrawing(false);

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left), (e.clientY - rect.top));
    const move = (ev: PointerEvent) => {
      ctx.lineTo((ev.clientX - rect.left), (ev.clientY - rect.top));
      ctx.stroke();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Цвет</Label>
          <Input className="w-24 h-8" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Толщина</Label>
          <Input className="w-20 h-8" type="number" min={1} max={40} value={size} onChange={(e) => setSize(Math.max(1, Math.min(40, Number(e.target.value) || 4)))} />
        </div>
        <Button variant="outline" size="sm" onClick={clear}>Очистить</Button>
      </div>
      <div className="border rounded-md overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-72 touch-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerMove={draw}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Отмена</Button>
        <Button onClick={handleSave}>Сохранить граффити</Button>
      </div>
    </div>
  );
}
