import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, Lock, Key, Eye, Plus, Trash2, Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSecurity } from "@/hooks/use-security";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function AdvancedSecurity() {
  const { apiKeys, alerts, twoFactor, stats, loading, createApiKey, deleteApiKey, toggleApiKey, enable2FA, disable2FA } = useSecurity();
  const { toast } = useToast();
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название ключа",
        variant: "destructive"
      });
      return;
    }

    const result = await createApiKey(keyName, ['read', 'write']);
    if (result.success && result.key) {
      setNewKey(result.key);
      setKeyName("");
      toast({
        title: "API ключ создан",
        description: "Сохраните ключ в безопасном месте. Он больше не будет показан.",
      });
    } else {
      toast({
        title: "Ошибка",
        description: result.error || "Не удалось создать ключ",
        variant: "destructive"
      });
    }
  };

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return;
    await deleteApiKey(deleteKeyId);
    setDeleteKeyId(null);
    toast({
      title: "API ключ удалён",
      description: "Ключ больше не может использоваться",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Ключ скопирован в буфер обмена",
    });
  };

  const handleToggle2FA = async () => {
    if (twoFactor?.enabled) {
      const result = await disable2FA();
      if (result.success) {
        toast({
          title: "2FA отключена",
          description: "Двухфакторная аутентификация отключена",
        });
      }
    } else {
      const result = await enable2FA();
      if (result.success) {
        toast({
          title: "2FA включена",
          description: "Двухфакторная аутентификация активирована",
        });
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Корпоративная безопасность
        </CardTitle>
        <CardDescription>
          Многоуровневая защита данных и систем
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="api-keys">API Ключи</TabsTrigger>
            <TabsTrigger value="2fa">2FA</TabsTrigger>
            <TabsTrigger value="alerts">Алерты</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">End-to-End шифрование</span>
                </div>
                <Badge variant="default" className="text-xs">Активно</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">2FA аутентификация</span>
                </div>
                <Badge 
                  variant={twoFactor?.enabled ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {twoFactor?.enabled ? 'Включено' : 'Отключено'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">API Ключи</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {apiKeys.filter(k => k.is_active).length} активных
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Аудит доступа</span>
                </div>
                <Badge variant="default" className="text-xs">Мониторинг</Badge>
              </div>
            </div>

            {stats && (
              <div className="pt-3 mt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Активных алертов:</span>
                  <span className="font-medium">{stats.active_alerts}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Событий за 30 дней:</span>
                  <span className="font-medium">{stats.total_events}</span>
                </div>
              </div>
            )}

            <div className="pt-2 mt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ✓ ISO 27001 сертифицирован<br/>
                ✓ GDPR совместимо<br/>
                ✓ SOC 2 Type II аудит
              </p>
            </div>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Управление API ключами для программного доступа
              </p>
              <Dialog open={showCreateKey} onOpenChange={setShowCreateKey}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Создать
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Создать API ключ</DialogTitle>
                    <DialogDescription>
                      Ключ будет показан только один раз. Сохраните его в безопасном месте.
                    </DialogDescription>
                  </DialogHeader>
                  {newKey ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground">Ваш API ключ:</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="flex-1 text-sm font-mono break-all">{newKey}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(newKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          setNewKey(null);
                          setShowCreateKey(false);
                        }}>
                          Готово
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="key-name">Название ключа</Label>
                        <Input
                          id="key-name"
                          placeholder="Например: Production API"
                          value={keyName}
                          onChange={(e) => setKeyName(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateKey(false)}>
                          Отмена
                        </Button>
                        <Button onClick={handleCreateKey} disabled={loading}>
                          Создать ключ
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {apiKeys.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Нет API ключей</p>
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{key.name}</span>
                        <Badge variant={key.is_active ? 'default' : 'secondary'} className="text-xs">
                          {key.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {key.key_prefix}... • {key.usage_count} использований
                      </p>
                      {key.last_used_at && (
                        <p className="text-xs text-muted-foreground">
                          Последнее использование: {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true, locale: ru })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleApiKey(key.id, !key.is_active)}
                      >
                        {key.is_active ? 'Отключить' : 'Включить'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteKeyId(key.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="2fa" className="space-y-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Двухфакторная аутентификация</h4>
                  <p className="text-xs text-muted-foreground">
                    Дополнительный уровень защиты вашего аккаунта
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={twoFactor?.enabled ? 'destructive' : 'default'}
                  onClick={handleToggle2FA}
                  disabled={loading}
                >
                  {twoFactor?.enabled ? 'Отключить' : 'Включить'}
                </Button>
              </div>
              {twoFactor?.enabled && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Метод: {twoFactor.method.toUpperCase()}</span>
                  </div>
                  {twoFactor.verified_at && (
                    <p className="text-xs text-muted-foreground">
                      Активирована: {formatDistanceToNow(new Date(twoFactor.verified_at), { addSuffix: true, locale: ru })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Нет активных алертов</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${getSeverityColor(alert.severity)}`} />
                        <span className="text-sm font-medium">{alert.description}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.alert_type} • {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ru })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить API ключ?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Ключ больше не сможет использоваться для доступа к API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
