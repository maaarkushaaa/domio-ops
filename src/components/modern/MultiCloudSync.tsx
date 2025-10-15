import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cloud, Check, Plus, RefreshCw, AlertCircle, Loader2, Trash2, Power } from "lucide-react";
import { useCloudSync } from "@/hooks/use-cloud-sync";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const PROVIDER_LABELS = {
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  onedrive: 'OneDrive',
  aws_s3: 'AWS S3',
  yandex_disk: 'Яндекс.Диск',
  box: 'Box',
  icloud: 'iCloud'
};

export function MultiCloudSync() {
  const { providers, history, conflicts, stats, loading, toggleProvider, startSync, removeProvider, formatFileSize, getQuotaPercentage } = useCloudSync();
  const { toast } = useToast();
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const handleSync = async (providerId: string) => {
    const result = await startSync(providerId, 'manual');
    if (result.success) {
      toast({
        title: "Синхронизация запущена",
        description: "Файлы синхронизируются в фоновом режиме",
      });
    } else {
      toast({
        title: "Ошибка",
        description: result.error || "Не удалось запустить синхронизацию",
        variant: "destructive"
      });
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    await removeProvider(providerId);
    toast({
      title: "Провайдер удалён",
      description: "Облачное хранилище отключено",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'syncing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Синхронизация
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Ошибка
          </Badge>
        );
      case 'idle':
        return (
          <Badge variant="outline" className="gap-1">
            <Check className="h-3 w-3" />
            Синхронизировано
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Multi-Cloud синхронизация
            </CardTitle>
            <CardDescription>
              Единая точка доступа ко всем облачным хранилищам
            </CardDescription>
          </div>
          <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить облачное хранилище</DialogTitle>
                <DialogDescription>
                  Подключите облачный провайдер для синхронизации файлов
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Выберите провайдера</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите облачное хранилище" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddProvider(false)}>
                  Отмена
                </Button>
                <Button disabled={!selectedProvider}>
                  Подключить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">Провайдеры</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-3">
            {providers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Нет подключенных облачных хранилищ</p>
              </div>
            ) : (
              providers.map((provider) => (
                <div key={provider.id} className="p-3 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Cloud className="h-4 w-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {PROVIDER_LABELS[provider.provider_type] || provider.provider_name}
                          </p>
                          {!provider.is_active && (
                            <Badge variant="secondary" className="text-xs">Отключен</Badge>
                          )}
                        </div>
                        {provider.account_email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {provider.account_email}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(provider.sync_status)}
                  </div>

                  {provider.quota_total && provider.quota_used && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Использовано</span>
                        <span className="font-medium">
                          {formatFileSize(provider.quota_used)} / {formatFileSize(provider.quota_total)}
                        </span>
                      </div>
                      <Progress value={getQuotaPercentage(provider)} className="h-1" />
                    </div>
                  )}

                  {provider.last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                      Последняя синхронизация: {formatDistanceToNow(new Date(provider.last_sync_at), { addSuffix: true, locale: ru })}
                    </p>
                  )}

                  {provider.sync_error && (
                    <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{provider.sync_error}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 flex-1"
                      onClick={() => handleSync(provider.id)}
                      disabled={loading || provider.sync_status === 'syncing' || !provider.is_active}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Синхронизировать
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleProvider(provider.id, !provider.is_active)}
                    >
                      <Power className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveProvider(provider.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Нет истории синхронизаций</p>
              </div>
            ) : (
              history.slice(0, 10).map((sync) => {
                const provider = providers.find(p => p.id === sync.provider_id);
                return (
                  <div key={sync.id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {provider ? PROVIDER_LABELS[provider.provider_type] : 'Unknown'}
                          </p>
                          <Badge variant={sync.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {sync.status}
                          </Badge>
                        </div>
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {sync.files_processed} файлов обработано
                            {sync.files_uploaded > 0 && ` • ${sync.files_uploaded} загружено`}
                            {sync.files_downloaded > 0 && ` • ${sync.files_downloaded} скачано`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(sync.started_at), { addSuffix: true, locale: ru })}
                            {sync.duration_seconds && ` • ${sync.duration_seconds}с`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-3">
            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Провайдеров</p>
                    <p className="text-2xl font-bold">{stats.active_providers}/{stats.total_providers}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Всего файлов</p>
                    <p className="text-2xl font-bold">{stats.total_files}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Общий размер</p>
                    <p className="text-2xl font-bold">{formatFileSize(stats.total_size_bytes)}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Конфликтов</p>
                    <p className="text-2xl font-bold">{stats.unresolved_conflicts}</p>
                  </div>
                </div>

                {conflicts.length > 0 && (
                  <div className="p-3 rounded-lg border bg-yellow-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <p className="text-sm font-medium">Требуется внимание</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {conflicts.length} конфликтов синхронизации требуют разрешения
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>Загрузка статистики...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-3 mt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Автоматическая синхронизация • Версионирование • Резервное копирование
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
