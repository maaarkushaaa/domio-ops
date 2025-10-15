import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { MessageCircle, Calendar as CalendarIcon, FileSpreadsheet, Zap, Settings, Activity, Plus, Power, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/use-integrations';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const INTEGRATION_CONFIGS = [
  {
    type: 'telegram' as const,
    name: 'Telegram',
    icon: MessageCircle,
    description: 'Получайте уведомления о задачах и проектах',
    color: 'text-blue-500',
    fields: [
      { name: 'bot_token', label: 'Bot Token', type: 'text', placeholder: '123456:ABC-DEF...' },
      { name: 'chat_id', label: 'Chat ID', type: 'text', placeholder: '123456789' }
    ]
  },
  {
    type: 'whatsapp' as const,
    name: 'WhatsApp',
    icon: MessageCircle,
    description: 'Отправка отчетов и уведомлений клиентам',
    color: 'text-green-500',
    fields: [
      { name: 'phone_number', label: 'Номер телефона', type: 'text', placeholder: '+79001234567' },
      { name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Ваш API ключ' }
    ]
  },
  {
    type: 'google_calendar' as const,
    name: 'Google Calendar',
    icon: CalendarIcon,
    description: 'Синхронизация событий и дедлайнов',
    color: 'text-red-500',
    fields: [
      { name: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Google OAuth Client ID' },
      { name: 'calendar_id', label: 'Calendar ID', type: 'text', placeholder: 'primary' }
    ]
  },
  {
    type: '1c' as const,
    name: '1С',
    icon: FileSpreadsheet,
    description: 'Интеграция с бухгалтерией и складом',
    color: 'text-orange-500',
    fields: [
      { name: 'server_url', label: 'URL сервера', type: 'text', placeholder: 'http://1c-server:port' },
      { name: 'username', label: 'Логин', type: 'text', placeholder: 'Пользователь' },
      { name: 'password', label: 'Пароль', type: 'password', placeholder: '••••••••' }
    ]
  },
  {
    type: 'zapier' as const,
    name: 'Zapier',
    icon: Zap,
    description: 'Автоматизация с 5000+ приложениями',
    color: 'text-yellow-500',
    fields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.zapier.com/...' }
    ]
  },
];

export function IntegrationHub() {
  const { toast } = useToast();
  const { integrations, events, stats, loading, upsertIntegration, toggleIntegration, deleteIntegration, getIntegrationIcon, getStatusColor } = useIntegrations();
  const [showConfig, setShowConfig] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<typeof INTEGRATION_CONFIGS[0] | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const handleConnect = (config: typeof INTEGRATION_CONFIGS[0]) => {
    setSelectedConfig(config);
    setConfigValues({});
    setShowConfig(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedConfig) return;

    const result = await upsertIntegration(
      selectedConfig.type,
      selectedConfig.name,
      configValues
    );

    if (result.success) {
      toast({
        title: 'Интеграция настроена',
        description: `${selectedConfig.name} успешно подключен`,
      });
      setShowConfig(false);
    } else {
      toast({
        title: 'Ошибка',
        description: result.error || 'Не удалось настроить интеграцию',
        variant: 'destructive'
      });
    }
  };

  const handleToggle = async (integrationId: string, isActive: boolean) => {
    await toggleIntegration(integrationId, !isActive);
    toast({
      title: isActive ? 'Интеграция отключена' : 'Интеграция включена',
      description: 'Статус интеграции обновлён',
    });
  };

  const handleDelete = async (integrationId: string) => {
    await deleteIntegration(integrationId);
    toast({
      title: 'Интеграция удалена',
      description: 'Настройки интеграции удалены',
    });
  };

  const getIntegrationConfig = (type: string) => {
    return INTEGRATION_CONFIGS.find(c => c.type === type);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Интеграции</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Доступные</TabsTrigger>
            <TabsTrigger value="connected">Подключённые</TabsTrigger>
            <TabsTrigger value="activity">Активность</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {INTEGRATION_CONFIGS.map((config) => {
                const Icon = config.icon;
                const existing = integrations.find(i => i.integration_type === config.type);
                
                return (
                  <Card key={config.type} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-muted ${config.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {config.name}
                            {existing?.is_configured && (
                              <Badge variant="default" className="text-xs">
                                Настроено
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        </div>
                        <Button
                          variant={existing?.is_configured ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleConnect(config)}
                          className="w-full"
                          disabled={loading}
                        >
                          {existing?.is_configured ? 'Настроить' : 'Подключить'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="connected" className="space-y-3">
            {integrations.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Нет подключённых интеграций</p>
              </div>
            ) : (
              integrations.map((integration) => {
                const config = getIntegrationConfig(integration.integration_type);
                const Icon = config?.icon || Zap;
                
                return (
                  <div key={integration.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-muted ${config?.color || 'text-gray-500'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{integration.integration_name}</h4>
                            {integration.is_active ? (
                              <Badge variant="default" className="text-xs">Активна</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Отключена</Badge>
                            )}
                          </div>
                          {integration.last_sync_at && (
                            <p className="text-xs text-muted-foreground">
                              Последняя синхронизация: {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true, locale: ru })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Успешных:</span>
                        <span className="font-medium text-green-500">{integration.success_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Ошибок:</span>
                        <span className="font-medium text-red-500">{integration.error_count}</span>
                      </div>
                    </div>

                    {integration.last_error && (
                      <div className="p-2 bg-destructive/10 rounded text-xs text-destructive">
                        {integration.last_error}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleConnect(config!)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Настроить
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(integration.id, integration.is_active)}
                      >
                        <Power className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(integration.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
            {stats && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground">Всего событий</p>
                  <p className="text-2xl font-bold">{stats.total_events}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground">Успешных</p>
                  <p className="text-2xl font-bold text-green-500">{stats.successful_events}</p>
                </div>
              </div>
            )}

            {events.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Нет активности</p>
              </div>
            ) : (
              events.slice(0, 10).map((event) => (
                <div key={event.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{event.event_type}</span>
                        <Badge variant={event.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ru })}
                      </p>
                    </div>
                  </div>
                  {event.error_message && (
                    <p className="text-xs text-destructive mt-2">{event.error_message}</p>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showConfig} onOpenChange={setShowConfig}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Настройка {selectedConfig?.name}</DialogTitle>
              <DialogDescription>
                {selectedConfig?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedConfig?.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={configValues[field.name] || ''}
                    onChange={(e) => setConfigValues({ ...configValues, [field.name]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveConfig} disabled={loading}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
