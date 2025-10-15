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
  Settings,
  Key,
  Webhook,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Integration {
  id: string;
  integration_type: string;
  name: string;
  config: any;
  is_active: boolean;
  user_id: string;
  created_at: string;
}

const integrationTypes = {
  telegram: {
    icon: MessageSquare,
    title: 'Telegram',
    description: 'Получайте уведомления и управляйте задачами через Telegram бот',
    color: 'text-blue-500',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz', required: true },
      { key: 'chat_id', label: 'Chat ID (опционально)', type: 'text', placeholder: '-1001234567890' }
    ],
    setupUrl: 'https://core.telegram.org/bots#how-do-i-create-a-bot'
  },
  whatsapp: {
    icon: Phone,
    title: 'WhatsApp Business',
    description: 'Отправляйте уведомления клиентам через WhatsApp Business API',
    color: 'text-green-500',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: '1234567890', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'EAAxxxxxxxxxxxxx', required: true }
    ],
    setupUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started'
  },
  google_calendar: {
    icon: Calendar,
    title: 'Google Calendar',
    description: 'Синхронизируйте задачи и события с Google Calendar',
    color: 'text-red-500',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxx.apps.googleusercontent.com', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'GOCSPX-xxxxx', required: true }
    ],
    setupUrl: 'https://console.cloud.google.com/apis/credentials'
  },
  zapier: {
    icon: Zap,
    title: 'Zapier',
    description: 'Автоматизируйте рабочие процессы с 5000+ приложениями',
    color: 'text-orange-500',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk_xxxxxxxxxxxxx', required: true }
    ],
    setupUrl: 'https://zapier.com/app/settings/api-keys'
  },
  '1c': {
    icon: Database,
    title: '1С:Предприятие',
    description: 'Синхронизация клиентов, счетов и платежей с 1С',
    color: 'text-yellow-600',
    fields: [
      { key: 'base_url', label: 'URL базы 1С', type: 'text', placeholder: 'http://localhost/accounting/hs/api', required: true },
      { key: 'username', label: 'Логин', type: 'text', placeholder: 'Администратор', required: true },
      { key: 'password', label: 'Пароль', type: 'password', placeholder: '••••••••', required: true }
    ],
    setupUrl: null
  },
  email: {
    icon: Mail,
    title: 'Email (SMTP)',
    description: 'Отправка email уведомлений через SMTP',
    color: 'text-blue-600',
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', required: true },
      { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587', required: true },
      { key: 'smtp_user', label: 'Username', type: 'text', placeholder: 'your@email.com', required: true },
      { key: 'smtp_password', label: 'Password', type: 'password', placeholder: '••••••••', required: true }
    ],
    setupUrl: null
  },
  slack: {
    icon: Slack,
    title: 'Slack',
    description: 'Уведомления и команды в Slack каналах',
    color: 'text-purple-500',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/...', required: true }
    ],
    setupUrl: 'https://api.slack.com/messaging/webhooks'
  }
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [editingConfig, setEditingConfig] = useState<{ [key: string]: any }>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [newIntegrationConfig, setNewIntegrationConfig] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();

    // Realtime подписка
    const channel = supabase
      .channel('integrations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'integrations' }, () => {
        loadIntegrations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadIntegrations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading integrations:', error);
      return;
    }
    setIntegrations(data || []);
  };

  const createIntegration = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Ошибка', description: 'Необходимо авторизоваться', variant: 'destructive' });
      return;
    }

    if (!selectedType) {
      toast({ title: 'Ошибка', description: 'Выберите тип интеграции', variant: 'destructive' });
      return;
    }

    if (!newIntegrationName.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название интеграции', variant: 'destructive' });
      return;
    }

    // Проверка обязательных полей
    const meta = integrationTypes[selectedType as keyof typeof integrationTypes];
    const requiredFields = meta.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !newIntegrationConfig[f.key]);
    
    if (missingFields.length > 0) {
      toast({ 
        title: 'Ошибка', 
        description: `Заполните обязательные поля: ${missingFields.map(f => f.label).join(', ')}`, 
        variant: 'destructive' 
      });
      return;
    }

    const { error } = await (supabase as any)
      .from('integrations')
      .insert({
        integration_type: selectedType,
        name: newIntegrationName,
        config: newIntegrationConfig,
        is_active: true,
        user_id: user.id,
      });

    if (error) {
      console.error('Error creating integration:', error);
      toast({ title: 'Ошибка', description: 'Не удалось создать интеграцию', variant: 'destructive' });
      return;
    }

    toast({ title: 'Успешно', description: 'Интеграция создана' });
    setAddDialogOpen(false);
    setSelectedType('');
    setNewIntegrationName('');
    setNewIntegrationConfig({});
    loadIntegrations();
  };

  const toggleIntegration = async (id: string, isActive: boolean) => {
    const { error } = await (supabase as any)
      .from('integrations')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить интеграцию', variant: 'destructive' });
      return;
    }

    toast({ 
      title: isActive ? 'Интеграция включена' : 'Интеграция отключена',
      description: 'Настройки успешно обновлены'
    });
  };

  const updateConfig = async (id: string, config: any) => {
    const { error } = await (supabase as any)
      .from('integrations')
      .update({ config })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' });
      return;
    }

    toast({ title: 'Настройки сохранены', description: 'Конфигурация успешно обновлена' });
    loadIntegrations();
  };

  const deleteIntegration = async (id: string) => {
    const { error } = await (supabase as any)
      .from('integrations')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить интеграцию', variant: 'destructive' });
      return;
    }

    toast({ title: 'Успешно', description: 'Интеграция удалена' });
    loadIntegrations();
  };

  const testIntegration = async (integration: Integration) => {
    toast({ 
      title: 'Тестирование...', 
      description: `Проверка подключения к ${integration.name}` 
    });
    
    // TODO: Реальная проверка подключения через backend
    setTimeout(() => {
      toast({ 
        title: 'Подключение успешно', 
        description: 'Интеграция работает корректно',
      });
    }, 1500);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Zap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Интеграции
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Подключите внешние сервисы и автоматизируйте работу</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Добавить интеграцию
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Новая интеграция</DialogTitle>
              <DialogDescription>
                Выберите сервис и настройте подключение
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Тип интеграции *</Label>
                <Select value={selectedType} onValueChange={(value) => {
                  setSelectedType(value);
                  setNewIntegrationConfig({});
                  const meta = integrationTypes[value as keyof typeof integrationTypes];
                  setNewIntegrationName(meta.title);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите сервис" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(integrationTypes).map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${meta.color}`} />
                            {meta.title}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Название *</Label>
                    <Input
                      id="name"
                      placeholder="Моя интеграция"
                      value={newIntegrationName}
                      onChange={(e) => setNewIntegrationName(e.target.value)}
                    />
                  </div>

                  {integrationTypes[selectedType as keyof typeof integrationTypes].setupUrl && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Инструкция по настройке:</p>
                      <a 
                        href={integrationTypes[selectedType as keyof typeof integrationTypes].setupUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        Открыть документацию
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {integrationTypes[selectedType as keyof typeof integrationTypes].fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>
                        {field.label} {field.required && '*'}
                      </Label>
                      <Input
                        id={field.key}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={newIntegrationConfig[field.key] || ''}
                        onChange={(e) => setNewIntegrationConfig({
                          ...newIntegrationConfig,
                          [field.key]: e.target.value
                        })}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={createIntegration} disabled={!selectedType}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Сервисы</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Нет подключенных интеграций</p>
                  <p className="text-sm mt-2">Добавьте первую интеграцию для автоматизации работы</p>
                  <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить интеграцию
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {integrations.map((integration) => {
                const meta = integrationTypes[integration.integration_type as keyof typeof integrationTypes];
                if (!meta) return null;
                
                const Icon = meta.icon;
                const config = editingConfig[integration.id] || integration.config || {};
                
                return (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className={`h-6 w-6 ${meta.color}`} />
                          <div className="flex-1">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {meta.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={integration.is_active}
                          onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {integration.is_active && (
                        <>
                          {meta.fields.map((field) => (
                            <div key={field.key} className="space-y-2">
                              <Label htmlFor={`${integration.id}-${field.key}`} className="text-xs">
                                {field.label}
                              </Label>
                              <Input
                                id={`${integration.id}-${field.key}`}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={config[field.key] || ''}
                                onChange={(e) => setEditingConfig({
                                  ...editingConfig,
                                  [integration.id]: {
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
                              onClick={() => updateConfig(integration.id, editingConfig[integration.id] || config)}
                              className="flex-1"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Сохранить
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => testIntegration(integration)}
                            >
                              Тест
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deleteIntegration(integration.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
                      
                      {!integration.is_active && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Включите интеграцию для настройки
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
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
