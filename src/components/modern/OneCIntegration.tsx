import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, RefreshCw, Upload, Download, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SyncRecord {
  id: string;
  type: string;
  entity: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
  details: string;
}

export function OneCIntegration() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([
    {
      id: '1',
      type: 'import',
      entity: 'Контрагенты',
      status: 'success',
      timestamp: new Date(Date.now() - 3600000).toLocaleString('ru-RU'),
      details: 'Импортировано 45 контрагентов',
    },
    {
      id: '2',
      type: 'export',
      entity: 'Счета',
      status: 'success',
      timestamp: new Date(Date.now() - 7200000).toLocaleString('ru-RU'),
      details: 'Экспортировано 12 счетов',
    },
    {
      id: '3',
      type: 'import',
      entity: 'Номенклатура',
      status: 'error',
      timestamp: new Date(Date.now() - 10800000).toLocaleString('ru-RU'),
      details: 'Ошибка подключения к базе',
    },
  ]);

  const handleConnect = () => {
    if (!serverUrl || !username || !password) {
      toast({
        title: 'Ошибка подключения',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setIsConnected(true);
    toast({
      title: 'Подключено к 1С',
      description: `Успешное подключение к ${serverUrl}`,
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: 'Отключено от 1С',
      description: 'Соединение закрыто',
    });
  };

  const handleSync = async (type: 'import' | 'export', entity: string) => {
    if (!isConnected) {
      toast({
        title: 'Ошибка',
        description: 'Сначала подключитесь к 1С',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    
    // Симуляция синхронизации
    setTimeout(() => {
      const newRecord: SyncRecord = {
        id: Date.now().toString(),
        type,
        entity,
        status: 'success',
        timestamp: new Date().toLocaleString('ru-RU'),
        details: `${type === 'import' ? 'Импортировано' : 'Экспортировано'} данных: ${entity}`,
      };
      
      setSyncHistory([newRecord, ...syncHistory]);
      setIsSyncing(false);
      
      toast({
        title: 'Синхронизация завершена',
        description: newRecord.details,
      });
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Интеграция с 1С
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="connection">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection">Подключение</TabsTrigger>
            <TabsTrigger value="sync">Синхронизация</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted'}`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Подключено' : 'Не подключено'}
                </span>
              </div>
              {isConnected && (
                <Badge variant="outline" className="text-success border-success">
                  Активно
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="server-url">Адрес сервера 1С</Label>
                <Input
                  id="server-url"
                  placeholder="http://localhost:8080/erp"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  disabled={isConnected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isConnected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isConnected}
                />
              </div>

              {!isConnected ? (
                <Button onClick={handleConnect} className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Подключиться
                </Button>
              ) : (
                <Button onClick={handleDisconnect} variant="destructive" className="w-full">
                  Отключиться
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <div className="grid gap-3">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Контрагенты</h4>
                    <p className="text-sm text-muted-foreground">Клиенты и поставщики</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSync('import', 'Контрагенты')}
                    disabled={isSyncing || !isConnected}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Импорт
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync('export', 'Контрагенты')}
                    disabled={isSyncing || !isConnected}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Экспорт
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Номенклатура</h4>
                    <p className="text-sm text-muted-foreground">Товары и услуги</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSync('import', 'Номенклатура')}
                    disabled={isSyncing || !isConnected}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Импорт
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync('export', 'Номенклатура')}
                    disabled={isSyncing || !isConnected}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Экспорт
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Документы</h4>
                    <p className="text-sm text-muted-foreground">Счета и акты</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSync('import', 'Документы')}
                    disabled={isSyncing || !isConnected}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Импорт
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync('export', 'Документы')}
                    disabled={isSyncing || !isConnected}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Экспорт
                  </Button>
                </div>
              </div>

              {isConnected && (
                <Button
                  onClick={() => {
                    handleSync('import', 'Все данные');
                  }}
                  disabled={isSyncing}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Синхронизация...' : 'Полная синхронизация'}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {syncHistory.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{record.entity}</span>
                            <Badge variant={record.type === 'import' ? 'default' : 'secondary'}>
                              {record.type === 'import' ? 'Импорт' : 'Экспорт'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{record.details}</p>
                          <p className="text-xs text-muted-foreground mt-1">{record.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
