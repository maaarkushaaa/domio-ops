import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: number;
}

export function AIAutomation() {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Автоматическое создание задач',
      description: 'AI создает задачи на основе писем клиентов',
      enabled: true,
      triggers: 12,
    },
    {
      id: '2',
      name: 'Прогноз загрузки производства',
      description: 'Предсказание узких мест в производстве',
      enabled: true,
      triggers: 8,
    },
    {
      id: '3',
      name: 'Оптимизация закупок',
      description: 'Автоматический заказ материалов при низких остатках',
      enabled: false,
      triggers: 0,
    },
  ]);
  const { toast } = useToast();

  const toggleAutomation = (id: string) => {
    setAutomations(
      automations.map((auto) =>
        auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
      )
    );
    toast({
      title: 'Автоматизация обновлена',
      description: 'Настройки сохранены',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          AI Автоматизация
        </CardTitle>
        <CardDescription>
          Умные автоматические действия на основе AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="p-4 bg-muted rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{auto.name}</p>
                    {auto.enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {auto.description}
                  </p>
                  {auto.enabled && (
                    <Badge variant="outline" className="text-xs">
                      Сработало {auto.triggers} раз
                    </Badge>
                  )}
                </div>
                <Switch
                  checked={auto.enabled}
                  onCheckedChange={() => toggleAutomation(auto.id)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Экономия времени на рутинных задачах</p>
          <p>• Машинное обучение на ваших данных</p>
          <p>• Непрерывное улучшение точности</p>
        </div>
      </CardContent>
    </Card>
  );
}
