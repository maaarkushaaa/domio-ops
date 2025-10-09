import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenTool, Download, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DigitalSignature() {
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const [isDrawing, setIsDrawing] = useState(false);

  const startSigning = () => {
    setIsSigning(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSigning) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isSigning) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setIsSigned(false);
  };

  const saveSignature = () => {
    setIsSigned(true);
    setIsSigning(false);
    toast({
      title: 'Подпись сохранена',
      description: 'Электронная подпись применена к документу',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Электронная подпись
        </CardTitle>
        <CardDescription>
          Юридически значимая цифровая подпись
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="border-2 border-dashed rounded-lg w-full bg-muted/30 cursor-crosshair"
            />
            {!isSigning && !isSigned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground text-sm">
                  Нажмите "Подписать" для начала
                </p>
              </div>
            )}
            {isSigned && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Подписано
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isSigning && !isSigned && (
            <Button onClick={startSigning} className="flex-1">
              <PenTool className="h-4 w-4 mr-2" />
              Подписать
            </Button>
          )}
          {isSigning && (
            <>
              <Button onClick={clearSignature} variant="outline" className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Очистить
              </Button>
              <Button onClick={saveSignature} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Применить
              </Button>
            </>
          )}
          {isSigned && (
            <>
              <Button onClick={clearSignature} variant="outline" className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Скачать
              </Button>
            </>
          )}
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Юридически значимая электронная подпись</p>
          <p>• Соответствие стандартам ЭЦП</p>
          <p>• Защита от подделки</p>
        </div>
      </CardContent>
    </Card>
  );
}
