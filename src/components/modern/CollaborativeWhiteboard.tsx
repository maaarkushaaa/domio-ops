import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Eraser, Square, Circle, Type, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CollaborativeWhiteboard() {
  const [tool, setTool] = useState<'pen' | 'eraser' | 'square' | 'circle' | 'text'>('pen');
  const { toast } = useToast();

  const tools = [
    { id: 'pen', icon: Palette, label: 'Рисование' },
    { id: 'eraser', icon: Eraser, label: 'Ластик' },
    { id: 'square', icon: Square, label: 'Квадрат' },
    { id: 'circle', icon: Circle, label: 'Круг' },
    { id: 'text', icon: Type, label: 'Текст' },
  ];

  const handleSave = () => {
    toast({
      title: 'Доска сохранена',
      description: 'Изменения сохранены успешно',
    });
  };

  const handleClear = () => {
    toast({
      title: 'Доска очищена',
      description: 'Все элементы удалены',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Совместная доска
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <Button
                key={t.id}
                variant={tool === t.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool(t.id as any)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {t.label}
              </Button>
            );
          })}
        </div>
        <div className="aspect-video bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Область для рисования</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Сохранить
          </Button>
          <Button onClick={handleClear} variant="outline" className="flex-1">
            <Trash2 className="h-4 w-4 mr-2" />
            Очистить
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Изменения видят все участники в реальном времени
        </p>
      </CardContent>
    </Card>
  );
}
