import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BellRing, Mail, MessageSquare, Smartphone } from "lucide-react";
import { useState } from "react";

export function SmartNotifications() {
  const [channels, setChannels] = useState({
    email: true,
    push: true,
    telegram: false,
    sms: false,
  });

  const toggleChannel = (channel: keyof typeof channels) => {
    setChannels(prev => ({ ...prev, [channel]: !prev[channel] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          Умные уведомления
        </CardTitle>
        <CardDescription>
          Настройка каналов и правил уведомлений с AI-приоритизацией
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <Label htmlFor="email" className="cursor-pointer">Email</Label>
            </div>
            <Switch id="email" checked={channels.email} onCheckedChange={() => toggleChannel('email')} />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <BellRing className="h-4 w-4" />
              <Label htmlFor="push" className="cursor-pointer">Push</Label>
            </div>
            <Switch id="push" checked={channels.push} onCheckedChange={() => toggleChannel('push')} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4" />
              <Label htmlFor="telegram" className="cursor-pointer">Telegram</Label>
            </div>
            <Switch id="telegram" checked={channels.telegram} onCheckedChange={() => toggleChannel('telegram')} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4" />
              <Label htmlFor="sms" className="cursor-pointer">SMS</Label>
            </div>
            <Switch id="sms" checked={channels.sms} onCheckedChange={() => toggleChannel('sms')} />
          </div>
        </div>

        <div className="pt-3 border-t space-y-2">
          <Badge variant="secondary" className="text-xs">
            🤖 AI-фильтрация по приоритету
          </Badge>
          <p className="text-xs text-muted-foreground">
            Интеллектуальная система определяет важность и выбирает оптимальный канал
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
