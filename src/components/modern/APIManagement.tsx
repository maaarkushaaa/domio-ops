import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Key, Webhook, Copy, Plus, Trash2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  requests: number;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

export function APIManagement() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'sk_live_abc123...xyz789',
      created: '15 Окт 2025',
      lastUsed: '2 минуты назад',
      requests: 1523,
    },
    {
      id: '2',
      name: 'Development API',
      key: 'sk_test_def456...uvw012',
      created: '10 Окт 2025',
      lastUsed: '1 час назад',
      requests: 342,
    },
  ]);

  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: '1',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/...',
      events: ['task.created', 'task.completed', 'project.updated'],
      active: true,
    },
    {
      id: '2',
      name: 'Telegram Bot',
      url: 'https://api.telegram.org/bot.../sendMessage',
      events: ['client.created', 'invoice.paid'],
      active: true,
    },
  ]);

  const [testEndpoint, setTestEndpoint] = useState('/api/v1/projects');
  const [testMethod, setTestMethod] = useState('GET');
  const [testBody, setTestBody] = useState('');
  const [testResponse, setTestResponse] = useState('');

  const generateAPIKey = () => {
    const newKey: APIKey = {
      id: Date.now().toString(),
      name: `API Key ${apiKeys.length + 1}`,
      key: `sk_live_${Math.random().toString(36).substr(2, 20)}...${Math.random().toString(36).substr(2, 10)}`,
      created: new Date().toLocaleDateString('ru-RU'),
      lastUsed: 'Никогда',
      requests: 0,
    };

    setApiKeys([...apiKeys, newKey]);
    toast({
      title: 'API ключ создан',
      description: 'Новый ключ успешно сгенерирован',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Скопировано',
      description: 'Ключ скопирован в буфер обмена',
    });
  };

  const deleteAPIKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
    toast({
      title: 'Ключ удален',
      description: 'API ключ успешно удален',
    });
  };

  const testAPI = () => {
    // Симуляция API запроса
    const mockResponse = {
      status: 200,
      data: {
        success: true,
        message: 'API работает корректно',
        timestamp: new Date().toISOString(),
        endpoint: testEndpoint,
        method: testMethod,
      },
    };

    setTestResponse(JSON.stringify(mockResponse, null, 2));
    toast({
      title: 'Тест выполнен',
      description: 'API вернул успешный ответ',
    });
  };

  const addWebhook = () => {
    const newWebhook: WebhookConfig = {
      id: Date.now().toString(),
      name: `Webhook ${webhooks.length + 1}`,
      url: 'https://example.com/webhook',
      events: ['task.created'],
      active: true,
    };

    setWebhooks([...webhooks, newWebhook]);
    toast({
      title: 'Webhook добавлен',
      description: 'Новый webhook успешно создан',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          API и Webhooks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="keys">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="keys">API Ключи</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="test">Тестирование</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Управление API ключами для внешних интеграций
              </p>
              <Button size="sm" onClick={generateAPIKey}>
                <Plus className="h-4 w-4 mr-1" />
                Создать ключ
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{key.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{key.key}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(key.key)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAPIKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Создан:</span>
                        <p className="font-medium">{key.created}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Последнее использование:</span>
                        <p className="font-medium">{key.lastUsed}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Запросов:</span>
                        <p className="font-medium">{key.requests}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Документация API
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>Base URL:</strong> https://api.yourdomain.com/v1</p>
                <p><strong>Авторизация:</strong> Bearer Token</p>
                <p><strong>Формат:</strong> JSON</p>
              </div>
              <div className="space-y-1 text-sm mt-3">
                <p className="font-medium">Доступные endpoints:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>GET /projects - Список проектов</li>
                  <li>POST /projects - Создать проект</li>
                  <li>GET /tasks - Список задач</li>
                  <li>POST /tasks - Создать задачу</li>
                  <li>GET /clients - Список клиентов</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Настройка webhook для уведомлений о событиях
              </p>
              <Button size="sm" onClick={addWebhook}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить webhook
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-5 w-5" />
                        <div>
                          <h4 className="font-medium">{webhook.name}</h4>
                          <p className="text-sm text-muted-foreground">{webhook.url}</p>
                        </div>
                      </div>
                      <Badge variant={webhook.active ? 'default' : 'secondary'}>
                        {webhook.active ? 'Активен' : 'Отключен'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">События:</p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-1" />
                        Тест
                      </Button>
                      <Button size="sm" variant="ghost">
                        Настроить
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Метод</Label>
                  <Select value={testMethod} onValueChange={setTestMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input
                    value={testEndpoint}
                    onChange={(e) => setTestEndpoint(e.target.value)}
                    placeholder="/api/v1/resource"
                  />
                </div>
              </div>

              {(testMethod === 'POST' || testMethod === 'PUT') && (
                <div className="space-y-2">
                  <Label>Request Body (JSON)</Label>
                  <Textarea
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={4}
                  />
                </div>
              )}

              <Button onClick={testAPI} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Выполнить запрос
              </Button>

              {testResponse && (
                <div className="space-y-2">
                  <Label>Ответ сервера</Label>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-auto">{testResponse}</pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
