import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

interface NotificationChannel {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
  description: string;
}

export function AdvancedNotifications() {
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: 'email', name: 'Email', icon: Mail, enabled: true, description: 'Уведомления на почту' },
    { id: 'push', name: 'Push', icon: Smartphone, enabled: true, description: 'Мобильные уведомления' },
    { id: 'telegram', name: 'Telegram', icon: MessageSquare, enabled: false, description: 'Бот в Telegram' },
    { id: 'sms', name: 'SMS', icon: Smartphone, enabled: false, description: 'СМС уведомления' },
  ]);

  const toggleChannel = (id: string) => {
    setChannels(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, enabled: !ch.enabled } : ch))
    );
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Умные уведомления
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <channel.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{channel.name}</p>
                  <p className="text-xs text-muted-foreground">{channel.description}</p>
                </div>
              </div>
              <Switch
                checked={channel.enabled}
                onCheckedChange={() => toggleChannel(channel.id)}
              />
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-medium text-sm mb-2">Правила уведомлений</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Критичные задачи</span>
              <Badge variant="destructive">Все каналы</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Новые сообщения</span>
              <Badge variant="outline">Push + Email</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Финансовые операции</span>
              <Badge variant="outline">Email</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3">
            Настроить правила
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
