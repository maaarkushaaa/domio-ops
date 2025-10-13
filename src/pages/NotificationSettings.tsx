import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationTester } from '@/components/ui/NotificationContainer';

export function NotificationSettingsPage() {
  const { settings, updateSettings, notifications, clearAllNotifications } = useNotifications();

  const testNotifications = [
    {
      type: 'success' as const,
      title: 'Тест успеха',
      message: 'Это тестовое уведомление об успешном действии',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      type: 'error' as const,
      title: 'Тест ошибки',
      message: 'Это тестовое уведомление об ошибке',
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      type: 'warning' as const,
      title: 'Тест предупреждения',
      message: 'Это тестовое уведомление-предупреждение',
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      type: 'info' as const,
      title: 'Тест информации',
      message: 'Это тестовое информационное уведомление',
      icon: Info,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Уведомления
          </h1>
          <p className="text-muted-foreground mt-2">
            Управление системой оповещений и уведомлений
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {notifications.length} активных
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Основные настройки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Основные настройки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Включение уведомлений */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Система уведомлений
                </Label>
                <p className="text-xs text-muted-foreground">
                  Включить или отключить все уведомления
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSettings({ enabled: checked })}
              />
            </div>

            <Separator />

            {/* Звуки */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {settings.sounds ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Звуковые уведомления
                </Label>
                <p className="text-xs text-muted-foreground">
                  Воспроизводить звуки для разных типов событий
                </p>
              </div>
              <Switch
                checked={settings.sounds}
                onCheckedChange={(checked) => updateSettings({ sounds: checked })}
                disabled={!settings.enabled}
              />
            </div>

            <Separator />

            {/* Desktop уведомления */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Системные уведомления
                </Label>
                <p className="text-xs text-muted-foreground">
                  Показывать уведомления операционной системы
                </p>
              </div>
              <Switch
                checked={settings.desktop}
                onCheckedChange={(checked) => updateSettings({ desktop: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Настройки отображения */}
        <Card>
          <CardHeader>
            <CardTitle>Настройки отображения</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Позиция уведомлений */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Позиция на экране</Label>
              <Select
                value={settings.position}
                onValueChange={(value: any) => updateSettings({ position: value })}
                disabled={!settings.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-right">Верхний правый угол</SelectItem>
                  <SelectItem value="top-left">Верхний левый угол</SelectItem>
                  <SelectItem value="bottom-right">Нижний правый угол</SelectItem>
                  <SelectItem value="bottom-left">Нижний левый угол</SelectItem>
                  <SelectItem value="top-center">Верхний центр</SelectItem>
                  <SelectItem value="bottom-center">Нижний центр</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

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

            <Separator />

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
          </CardContent>
        </Card>
      </div>

      {/* Тестирование уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Тестирование уведомлений
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {testNotifications.map((test, index) => {
              const Icon = test.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => {
                    // Здесь будет логика тестирования
                    console.log('Testing notification:', test.type);
                  }}
                >
                  <Icon className={`h-6 w-6 ${test.color}`} />
                  <span className="text-sm">{test.title}</span>
                </Button>
              );
            })}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Активные уведомления</p>
              <p className="text-xs text-muted-foreground">
                {notifications.length} уведомлений в очереди
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              Очистить все
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Информация о типах уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle>Типы уведомлений</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Успех</p>
                  <p className="text-sm text-muted-foreground">
                    Зеленые уведомления с мелодичным звуком
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Ошибка</p>
                  <p className="text-sm text-muted-foreground">
                    Красные уведомления с тревожным звуком
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Предупреждение</p>
                  <p className="text-sm text-muted-foreground">
                    Желтые уведомления с предупреждающим звуком
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Информация</p>
                  <p className="text-sm text-muted-foreground">
                    Синие уведомления без звука
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
