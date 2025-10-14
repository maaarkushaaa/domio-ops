import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

type DrawAction = { type: 'path'; color: string; size: number; opacity: number; points: Array<{ x: number; y: number }> };

export function WallGraffitiCanvas({ onSave, onCancel }: { onSave: (blob: Blob) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState<string>('#000000');
  const [size, setSize] = useState<number>(3);
  const [opacity, setOpacity] = useState<number>(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = 600 * ratio;
    canvas.height = 400 * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 600, 400);
    }
  }, []);

  useEffect(() => {
    redraw();
  }, [history]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 600, 400);
    history.forEach((action) => {
      if (action.type === 'path' && action.points.length > 1) {
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size;
        ctx.globalAlpha = action.opacity / 100;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 600;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 600;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    setCurrentPath((prev) => [...prev, { x, y }]);
    const ctx = canvas.getContext('2d');
    if (!ctx || currentPath.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.globalAlpha = opacity / 100;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const handlePointerUp = () => {
    if (isDrawing && currentPath.length > 1) {
      setHistory((prev) => [...prev, { type: 'path', color, size, opacity, points: currentPath }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  };

  const clear = () => {
    setHistory([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 600, 400);
  };

  const undo = () => {
    setHistory((prev) => prev.slice(0, -1));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <button onClick={clear} className="hover:underline">Начать сначала</button>
        <span>|</span>
        <button onClick={undo} disabled={history.length === 0} className="hover:underline disabled:opacity-40">Отменить последнее действие</button>
      </div>
      <div className="border border-gray-300 rounded overflow-hidden bg-gray-100">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair"
          style={{ height: '400px' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: color }} />
          <span>Цвет:</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-6 border-0 cursor-pointer" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span>Толщина:</span>
          <Slider value={[size]} onValueChange={(v) => setSize(v[0])} min={1} max={20} step={1} className="w-32" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span>Интенсивность:</span>
          <Slider value={[opacity]} onValueChange={(v) => setOpacity(v[0])} min={10} max={100} step={10} className="w-32" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Отмена</Button>
        <Button onClick={handleSave}>Сохранить</Button>
      </div>
    </div>
  );
}
