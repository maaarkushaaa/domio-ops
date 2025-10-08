import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Maximize2, RotateCw, ZoomIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ARViewer() {
  const { toast } = useToast();

  const launchAR = () => {
    toast({
      title: 'AR режим запущен',
      description: 'Наведите камеру на поверхность',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          AR/VR просмотр
        </CardTitle>
        <CardDescription>
          Просмотр 3D моделей в дополненной реальности
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="relative z-10 text-center space-y-2">
            <Eye className="h-16 w-16 text-primary mx-auto" />
            <p className="text-sm font-medium">3D модель продукта</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm">
            <RotateCw className="h-4 w-4 mr-1" />
            Повернуть
          </Button>
          <Button variant="outline" size="sm">
            <ZoomIn className="h-4 w-4 mr-1" />
            Увеличить
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4 mr-1" />
            Полный экран
          </Button>
        </div>
        <Button onClick={launchAR} className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          Запустить AR режим
        </Button>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Просмотр мебели в вашем интерьере</p>
          <p>• Реалистичные масштабы и освещение</p>
          <p>• Поддержка AR на iOS и Android</p>
        </div>
      </CardContent>
    </Card>
  );
}
