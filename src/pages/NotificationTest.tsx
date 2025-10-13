import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/hooks/use-notifications';
import { 
  Bell,
  Volume2,
  VolumeX,
  Monitor,
  Settings,
  BellOff
} from 'lucide-react';

export function NotificationTestPage() {
  const { notifications, settings, updateSettings } = useNotifications();

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
                  {settings.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
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

            {/* Звуковые уведомления */}
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

            {/* Выбор типа звука */}
            {settings.sounds && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Тип звука</Label>
                <Select
                  value={settings.soundType}
                  onValueChange={(value: any) => updateSettings({ soundType: value })}
                  disabled={!settings.enabled || !settings.sounds}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">По умолчанию</SelectItem>
                    <SelectItem value="beep">Звуковой сигнал</SelectItem>
                    <SelectItem value="chime">Мелодичный звон</SelectItem>
                    <SelectItem value="notification">Уведомление</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Desktop уведомления */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {settings.desktop ? <Monitor className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
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

            {/* Режим тестирования */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Режим тестирования</Label>
                <p className="text-xs text-muted-foreground">
                  Показывать кнопку принудительного теста в области уведомлений
                </p>
              </div>
              <Switch
                checked={settings.testMode}
                onCheckedChange={(checked) => updateSettings({ testMode: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Настройки отображения */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Настройки отображения
            </CardTitle>
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
          </CardContent>
        </Card>
      </div>

      {/* Информация о системе */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о системе оповещений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Возможности:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Звуковые уведомления для разных типов событий</li>
                <li>• Desktop уведомления браузера</li>
                <li>• Настраиваемая позиция и длительность</li>
                <li>• Действия в уведомлениях</li>
                <li>• Автоматическое закрытие</li>
                <li>• Персистентные уведомления для ошибок</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Типы оповещений:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <Badge variant="outline" className="text-green-600">Успех</Badge> - зеленые с мелодичным звуком</li>
                <li>• <Badge variant="outline" className="text-red-600">Ошибка</Badge> - красные с тревожным звуком</li>
                <li>• <Badge variant="outline" className="text-yellow-600">Предупреждение</Badge> - желтые с предупреждающим звуком</li>
                <li>• <Badge variant="outline" className="text-blue-600">Информация</Badge> - синие без звука</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}