import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Smartphone, Wifi, WifiOff, Bell, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PWAManager() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    // Online/Offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Estimate cache size
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        setCacheSize(Math.round((estimate.usage || 0) / 1024 / 1024));
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: 'Приложение установлено',
        description: 'DOMIO Ops теперь доступен на вашем устройстве',
      });
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Не поддерживается',
        description: 'Ваш браузер не поддерживает push-уведомления',
        variant: 'destructive',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      
      // Register push notifications if on Capacitor
      if ('PushNotifications' in window) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.register();
      }

      toast({
        title: 'Уведомления включены',
        description: 'Вы будете получать важные обновления',
      });

      // Show test notification
      new Notification('DOMIO Ops', {
        body: 'Push-уведомления успешно настроены!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    } else {
      toast({
        title: 'Разрешение отклонено',
        description: 'Уведомления не будут отображаться',
        variant: 'destructive',
      });
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      setCacheSize(0);
      toast({
        title: 'Кэш очищен',
        description: 'Все кэшированные данные удалены',
      });
    }
  };

  const syncData = async () => {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await (registration as any).sync.register('sync-data');
        toast({
          title: 'Синхронизация запущена',
          description: 'Данные будут синхронизированы в фоновом режиме',
        });
      } catch (error) {
        toast({
          title: 'Ошибка синхронизации',
          description: 'Не удалось запустить фоновую синхронизацию',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          PWA Управление
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-destructive" />
            )}
            <div>
              <div className="font-medium">
                {isOnline ? 'Онлайн' : 'Офлайн'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isOnline ? 'Подключено к интернету' : 'Работа в офлайн-режиме'}
              </div>
            </div>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Активно' : 'Отключено'}
          </Badge>
        </div>

        {/* Install App */}
        {isInstallable && (
          <div className="p-3 border rounded-lg bg-accent/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <Download className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Установить приложение</div>
                  <div className="text-sm text-muted-foreground">
                    Установите DOMIO Ops на ваше устройство для быстрого доступа
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={handleInstall}>
                Установить
              </Button>
            </div>
          </div>
        )}

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <div>
              <div className="font-medium">Push-уведомления</div>
              <div className="text-xs text-muted-foreground">
                {notificationsEnabled
                  ? 'Уведомления включены'
                  : 'Получайте важные обновления'}
              </div>
            </div>
          </div>
          {notificationsEnabled ? (
            <Badge variant="default">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Включено
            </Badge>
          ) : (
            <Button size="sm" onClick={handleEnableNotifications}>
              Включить
            </Button>
          )}
        </div>

        {/* Cache Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Кэшированные данные</div>
              <div className="text-xs text-muted-foreground">
                Размер кэша: {cacheSize} МБ
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={clearCache}>
              Очистить
            </Button>
          </div>
        </div>

        {/* Background Sync */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Фоновая синхронизация</div>
              <div className="text-xs text-muted-foreground">
                Синхронизация данных в фоне
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={syncData}>
              Синхронизировать
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="font-medium text-sm">Доступные функции PWA:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Офлайн-режим
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Push-уведомления
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Установка на устройство
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Фоновая синхронизация
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
