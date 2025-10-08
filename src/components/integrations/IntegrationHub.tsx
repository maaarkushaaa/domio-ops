import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar as CalendarIcon, FileSpreadsheet, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const integrations = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: MessageCircle,
    description: 'Получайте уведомления о задачах и проектах',
    connected: true,
    color: 'text-blue-500',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    description: 'Отправка отчетов и уведомлений клиентам',
    connected: false,
    color: 'text-green-500',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: CalendarIcon,
    description: 'Синхронизация событий и дедлайнов',
    connected: false,
    color: 'text-red-500',
  },
  {
    id: '1c',
    name: '1С',
    icon: FileSpreadsheet,
    description: 'Интеграция с бухгалтерией и складом',
    connected: false,
    color: 'text-orange-500',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: Zap,
    description: 'Автоматизация с 5000+ приложениями',
    connected: false,
    color: 'text-yellow-500',
  },
];

export function IntegrationHub() {
  const { toast } = useToast();

  const handleConnect = (integration: typeof integrations[0]) => {
    toast({
      title: integration.connected ? 'Отключить интеграцию' : 'Подключить интеграцию',
      description: `${integration.name} ${integration.connected ? 'отключен' : 'подключен'}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Интеграции</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <Card key={integration.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-muted ${integration.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {integration.name}
                          {integration.connected && (
                            <Badge variant="default" className="text-xs">
                              Подключено
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={integration.connected ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleConnect(integration)}
                      className="w-full"
                    >
                      {integration.connected ? 'Настроить' : 'Подключить'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
