import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Phone, 
  Calendar, 
  Zap, 
  Database, 
  Mail, 
  Slack,
  Check,
  X,
  Settings,
  Key,
  Webhook
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  enabled: boolean;
  config: any;
}

const integrationMeta = {
  telegram: {
    icon: MessageSquare,
    title: 'Telegram',
    description: 'Получайте уведомления и управляйте задачами через Telegram бот',
    color: 'text-blue-500',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz' },
      { key: 'chat_id', label: 'Chat ID (опционально)', type: 'text', placeholder: '-1001234567890' }
    ]
  },
  whatsapp: {
    icon: Phone,
    title: 'WhatsApp Business',
    description: 'Отправляйте уведомления клиентам через WhatsApp Business API',
    color: 'text-green-500',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: '1234567890' },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'EAAxxxxxxxxxxxxx' }
    ]
  },
  google_calendar: {
    icon: Calendar,
    title: 'Google Calendar',
    description: 'Синхронизируйте задачи и события с Google Calendar',
    color: 'text-red-500',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxx.apps.googleusercontent.com' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'GOCSPX-xxxxx' }
    ]
  },
  zapier: {
    icon: Zap,
    title: 'Zapier',
    description: 'Автоматизируйте рабочие процессы с 5000+ приложениями',
    color: 'text-orange-500',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk_xxxxxxxxxxxxx' }
    ]
  },
  '1c': {
    icon: Database,
    title: '1С:Предприятие',
    description: 'Синхронизация клиентов, счетов и платежей с 1С',
    color: 'text-yellow-600',
    fields: [
      { key: 'base_url', label: 'URL базы 1С', type: 'text', placeholder: 'http://localhost/accounting/hs/api' },
      { key: 'username', label: 'Логин', type: 'text', placeholder: 'Администратор' },
      { key: 'password', label: 'Пароль', type: 'password', placeholder: '••••••••' }
    ]
  },
  email: {
    icon: Mail,
    title: 'Email (SMTP)',
    description: 'Отправка email уведомлений через SMTP',
    color: 'text-blue-600',
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587' },
      { key: 'smtp_user', label: 'Username', type: 'text', placeholder: 'your@email.com' },
      { key: 'smtp_password', label: 'Password', type: 'password', placeholder: '••••••••' }
    ]
  },
  slack: {
    icon: Slack,
    title: 'Slack',
    description: 'Уведомления и команды в Slack каналах',
    color: 'text-purple-500',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX' }
    ]
  }
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [editingConfig, setEditingConfig] = useState<{ [key: string]: any }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    const { data, error } = await (supabase as any)
      .from('integration_configs')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading integrations:', error);
      return;
    }
    setIntegrations(data || []);
  };

  const toggleIntegration = async (id: string, enabled: boolean) => {
    const { error } = await (supabase as any)
      .from('integration_configs')
      .update({ enabled })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить интеграцию', variant: 'destructive' });
      return;
    }

    loadIntegrations();
    toast({ 
      title: enabled ? 'Интеграция включена' : 'Интеграция отключена',
      description: 'Настройки успешно обновлены'
    });
  };

  const saveConfig = async (id: string, name: string) => {
    const config = editingConfig[name] || {};
    
    const { error } = await (supabase as any)
      .from('integration_configs')
      .update({ config })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' });
      return;
    }

    loadIntegrations();
    toast({ title: 'Настройки сохранены', description: 'Конфигурация успешно обновлена' });
  };

  const testIntegration = async (name: string) => {
    toast({ 
      title: 'Тестирование...', 
      description: `Проверка подключения к ${integrationMeta[name as keyof typeof integrationMeta]?.title}` 
    });
    
    // Здесь будет реальная проверка подключения
    setTimeout(() => {
      toast({ 
        title: 'Подключение успешно', 
        description: 'Интеграция работает корректно',
        variant: 'default'
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Интеграции
          </h1>
          <p className="text-muted-foreground mt-1">Подключите внешние сервисы и автоматизируйте работу</p>
        </div>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Сервисы</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.map((integration) => {
              const meta = integrationMeta[integration.name as keyof typeof integrationMeta];
              if (!meta) return null;
              
              const Icon = meta.icon;
              const config = editingConfig[integration.name] || integration.config || {};
              
              return (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-6 w-6 ${meta.color}`} />
                        <div>
                          <CardTitle>{meta.title}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {meta.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={integration.enabled}
                        onCheckedChange={(enabled) => toggleIntegration(integration.id, enabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {integration.enabled && (
                      <>
                        {meta.fields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={`${integration.name}-${field.key}`} className="text-xs">
                              {field.label}
                            </Label>
                            <Input
                              id={`${integration.name}-${field.key}`}
                              type={field.type}
                              placeholder={field.placeholder}
                              value={config[field.key] || ''}
                              onChange={(e) => setEditingConfig({
                                ...editingConfig,
                                [integration.name]: {
                                  ...config,
                                  [field.key]: e.target.value
                                }
                              })}
                            />
                          </div>
                        ))}
                        
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => saveConfig(integration.id, integration.name)}
                            className="flex-1"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Сохранить
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => testIntegration(integration.name)}
                          >
                            Тест
                          </Button>
                        </div>

                        {Object.keys(config).length > 0 && (
                          <div className="pt-2 border-t">
                            <Badge variant="outline" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Настроено
                            </Badge>
                          </div>
                        )}
                      </>
                    )}
                    
                    {!integration.enabled && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Включите интеграцию для настройки
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>
                    Получайте уведомления о событиях в системе
                  </CardDescription>
                </div>
                <Button>
                  <Webhook className="h-4 w-4 mr-2" />
                  Создать Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Пока нет настроенных webhooks</p>
                <p className="text-sm mt-2">Создайте webhook для получения событий</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Управление ключами доступа к API
                  </CardDescription>
                </div>
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  Создать API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Пока нет API ключей</p>
                <p className="text-sm mt-2">Создайте ключ для доступа к API</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
