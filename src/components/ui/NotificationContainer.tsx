import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info, Bell, BellOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

// Иконки для разных типов уведомлений
const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// Цвета для разных типов уведомлений
const notificationColors = {
  success: 'border-green-500 bg-green-50 text-green-900',
  error: 'border-red-500 bg-red-50 text-red-900',
  warning: 'border-yellow-500 bg-yellow-50 text-yellow-900',
  info: 'border-blue-500 bg-blue-50 text-blue-900',
};

// Компонент отдельного уведомления
function NotificationItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotifications();
  const Icon = notificationIcons[notification.type];

  return (
    <Card className={cn(
      'w-full max-w-sm shadow-lg border-l-4 transition-all duration-300 ease-in-out transform hover:scale-105',
      notificationColors[notification.type]
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-sm truncate">{notification.title}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-black/10"
                onClick={() => removeNotification(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm mt-1 opacity-90">{notification.message}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs opacity-75">
                {notification.timestamp.toLocaleTimeString('ru-RU')}
              </span>
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex gap-1">
                  {notification.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'default'}
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={action.action}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Компонент настроек уведомлений
function NotificationSettings() {
  const { settings, updateSettings } = useNotifications();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Настройки
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Уведомления
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Включение уведомлений */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Уведомления</Label>
              <p className="text-xs text-muted-foreground">
                Включить систему уведомлений
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>

          {/* Звуки */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                {settings.sounds ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Звуки
              </Label>
              <p className="text-xs text-muted-foreground">
                Воспроизводить звуки для уведомлений
              </p>
            </div>
            <Switch
              checked={settings.sounds}
              onCheckedChange={(checked) => updateSettings({ sounds: checked })}
              disabled={!settings.enabled}
            />
          </div>

          {/* Desktop уведомления */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                {settings.desktop ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                Desktop уведомления
              </Label>
              <p className="text-xs text-muted-foreground">
                Показывать системные уведомления
              </p>
            </div>
            <Switch
              checked={settings.desktop}
              onCheckedChange={(checked) => updateSettings({ desktop: checked })}
              disabled={!settings.enabled}
            />
          </div>

          {/* Позиция уведомлений */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Позиция</Label>
            <Select
              value={settings.position}
              onValueChange={(value: any) => updateSettings({ position: value })}
              disabled={!settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-right">Верхний правый</SelectItem>
                <SelectItem value="top-left">Верхний левый</SelectItem>
                <SelectItem value="bottom-right">Нижний правый</SelectItem>
                <SelectItem value="bottom-left">Нижний левый</SelectItem>
                <SelectItem value="top-center">Верхний центр</SelectItem>
                <SelectItem value="bottom-center">Нижний центр</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Длительность показа */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Длительность показа: {settings.duration / 1000}с
            </Label>
            <Slider
              value={[settings.duration]}
              onValueChange={([value]) => updateSettings({ duration: value })}
              min={1000}
              max={10000}
              step={500}
              disabled={!settings.enabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1с</span>
              <span>10с</span>
            </div>
          </div>

          {/* Максимальное количество */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Максимум уведомлений: {settings.maxNotifications}
            </Label>
            <Slider
              value={[settings.maxNotifications]}
              onValueChange={([value]) => updateSettings({ maxNotifications: value })}
              min={1}
              max={10}
              step={1}
              disabled={!settings.enabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Основной компонент контейнера уведомлений
export function NotificationContainer() {
  const { notifications, clearAllNotifications, settings, addNotification } = useNotifications();

  // Временно показываем контейнер для отладки
  console.log('NotificationContainer render:', { 
    enabled: settings.enabled, 
    notificationsCount: notifications.length,
    notifications: notifications 
  });

  // Всегда показываем контейнер для отладки
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Индикатор состояния */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-xs">
        <div className="font-semibold mb-1">Состояние уведомлений:</div>
        <div>• Уведомления: {settings.enabled ? '✅ Включены' : '❌ Отключены'}</div>
        <div>• Активных: {notifications.length}</div>
        <div>• Звуки: {settings.sounds ? '✅ Включены' : '❌ Отключены'}</div>
        <div>• Desktop: {settings.desktop ? '✅ Включены' : '❌ Отключены'}</div>
      </div>

      {/* Уведомления */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}

      {/* Кнопки управления */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {notifications.length}
            </Badge>
            <span className="text-sm font-medium">Уведомления</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationSettings />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="h-6 px-2 text-xs"
            >
              Очистить все
            </Button>
          </div>
        </div>
      )}

      {/* Кнопка для принудительного тестирования */}
      <Button
        onClick={() => {
          console.log('Force test notification');
          addNotification({
            type: 'info',
            title: 'Принудительный тест',
            message: 'Это принудительное тестовое уведомление',
            sound: true
          });
        }}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs"
      >
        🧪 Принудительный тест
      </Button>
    </div>
  );
}

// Компонент для тестирования уведомлений
export function NotificationTester() {
  const { addNotification } = useNotifications();

  const testNotifications = [
    {
      type: 'success' as const,
      title: 'Тест успеха',
      message: 'Это тестовое уведомление об успешном действии',
    },
    {
      type: 'error' as const,
      title: 'Тест ошибки',
      message: 'Это тестовое уведомление об ошибке',
    },
    {
      type: 'warning' as const,
      title: 'Тест предупреждения',
      message: 'Это тестовое уведомление-предупреждение',
    },
    {
      type: 'info' as const,
      title: 'Тест информации',
      message: 'Это тестовое информационное уведомление',
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Тест уведомлений</h3>
      <div className="flex gap-2 flex-wrap">
        {testNotifications.map((test, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => addNotification(test)}
          >
            {test.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
