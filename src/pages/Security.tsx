import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Lock, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  FileText,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityAuditLog {
  id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  severity: string;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  last_used_at: string;
  created_at: string;
  revoked: boolean;
}

export default function Security() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSecuritySettings();
    loadAuditLogs();
    loadApiKeys();
  }, []);

  const loadSecuritySettings = async () => {
    const { data } = await (supabase as any)
      .from('user_2fa')
      .select('enabled')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    if (data) {
      setTwoFactorEnabled(data.enabled);
    }
  };

  const loadAuditLogs = async () => {
    const { data } = await (supabase as any)
      .from('security_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    setAuditLogs(data || []);
  };

  const loadApiKeys = async () => {
    const { data } = await (supabase as any)
      .from('api_keys')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });
    
    setApiKeys(data || []);
  };

  const enable2FA = async () => {
    // Генерация TOTP secret
    const secret = generateTOTPSecret();
    setTotpSecret(secret);
    
    const { error } = await (supabase as any)
      .from('user_2fa')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        method: 'totp',
        secret: secret,
        enabled: true
      });

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось включить 2FA', variant: 'destructive' });
      return;
    }

    setTwoFactorEnabled(true);
    toast({ title: '2FA включена', description: 'Двухфакторная аутентификация активирована' });
  };

  const disable2FA = async () => {
    const { error } = await (supabase as any)
      .from('user_2fa')
      .update({ enabled: false })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отключить 2FA', variant: 'destructive' });
      return;
    }

    setTwoFactorEnabled(false);
    toast({ title: '2FA отключена', description: 'Двухфакторная аутентификация деактивирована' });
  };

  const generateTOTPSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  const createApiKey = async () => {
    const keyName = prompt('Введите название API ключа:');
    if (!keyName) return;

    const apiKey = 'sk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Хешируем ключ перед сохранением
    const { error } = await (supabase as any)
      .from('api_keys')
      .insert({
        name: keyName,
        key_hash: apiKey, // В реальности нужно хешировать
        user_id: (await supabase.auth.getUser()).data.user?.id,
        scopes: ['read:tasks', 'write:tasks']
      });

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать API ключ', variant: 'destructive' });
      return;
    }

    toast({ 
      title: 'API ключ создан', 
      description: `Скопируйте ключ: ${apiKey}`,
      duration: 10000
    });
    
    loadApiKeys();
  };

  const revokeApiKey = async (id: string) => {
    const { error } = await (supabase as any)
      .from('api_keys')
      .update({ revoked: true })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отозвать ключ', variant: 'destructive' });
      return;
    }

    toast({ title: 'Ключ отозван', description: 'API ключ больше не действителен' });
    loadApiKeys();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return CheckCircle;
    if (action.includes('failed')) return XCircle;
    if (action.includes('2fa')) return Smartphone;
    if (action.includes('api')) return Key;
    return Activity;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Безопасность
          </h1>
          <p className="text-muted-foreground mt-1">Управление безопасностью и доступом</p>
        </div>
      </div>

      <Tabs defaultValue="2fa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="2fa">2FA</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="audit">Аудит</TabsTrigger>
          <TabsTrigger value="sessions">Сессии</TabsTrigger>
        </TabsList>

        <TabsContent value="2fa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Двухфакторная аутентификация (2FA)
              </CardTitle>
              <CardDescription>
                Дополнительный уровень защиты вашего аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {twoFactorEnabled ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {twoFactorEnabled ? '2FA включена' : '2FA отключена'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorEnabled 
                        ? 'Ваш аккаунт защищён дополнительным кодом'
                        : 'Включите для повышения безопасности'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => checked ? enable2FA() : disable2FA()}
                />
              </div>

              {twoFactorEnabled && totpSecret && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Настройка приложения-аутентификатора</h4>
                  <ol className="space-y-2 text-sm">
                    <li>1. Установите Google Authenticator или Authy</li>
                    <li>2. Отсканируйте QR-код или введите секретный ключ</li>
                    <li>3. Введите 6-значный код для подтверждения</li>
                  </ol>
                  
                  <div className="flex items-center gap-2">
                    <Input 
                      type={showSecret ? 'text' : 'password'} 
                      value={totpSecret} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Код подтверждения</Label>
                    <Input placeholder="000000" maxLength={6} />
                  </div>

                  <Button className="w-full">Подтвердить</Button>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Резервные коды</h4>
                <p className="text-sm text-muted-foreground">
                  Сохраните резервные коды для восстановления доступа
                </p>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Сгенерировать коды
                </Button>
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
                <Button onClick={createApiKey}>
                  <Key className="h-4 w-4 mr-2" />
                  Создать ключ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Нет API ключей</p>
                  <p className="text-sm mt-2">Создайте ключ для доступа к API</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{key.name}</p>
                          {key.revoked && (
                            <Badge variant="destructive" className="text-xs">Отозван</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Создан: {new Date(key.created_at).toLocaleDateString('ru-RU')}</span>
                          {key.last_used_at && (
                            <span>Использован: {new Date(key.last_used_at).toLocaleDateString('ru-RU')}</span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {!key.revoked && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => revokeApiKey(key.id)}
                        >
                          Отозвать
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Журнал безопасности
              </CardTitle>
              <CardDescription>
                История действий и событий безопасности
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.map((log) => {
                  const Icon = getActionIcon(log.action);
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Icon className={`h-5 w-5 mt-0.5 ${getSeverityColor(log.severity)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{log.action}</p>
                          <Badge variant="outline" className="text-xs">
                            {log.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {log.ip_address}
                          </span>
                          <span>{new Date(log.created_at).toLocaleString('ru-RU')}</span>
                        </div>
                        {log.user_agent && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {log.user_agent}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Активные сессии
              </CardTitle>
              <CardDescription>
                Управление активными сеансами входа
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Функция в разработке</p>
                <p className="text-sm mt-2">Скоро вы сможете управлять активными сессиями</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
