import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Bell, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TelegramSettings() {
  const { toast } = useToast();
  const [chatId, setChatId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleConnect = () => {
    if (!chatId) {
      toast({
        title: "Ошибка",
        description: "Введите Telegram Chat ID",
        variant: "destructive",
      });
      return;
    }

    setIsConnected(true);
    toast({
      title: "Telegram подключен",
      description: `Chat ID ${chatId} успешно привязан к вашему аккаунту`,
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setChatId("");
    toast({
      title: "Telegram отключен",
      description: "Уведомления в Telegram отключены",
    });
  };

  const handleGetChatId = () => {
    window.open("https://t.me/userinfobot", "_blank");
    toast({
      title: "Инструкция",
      description: "Напишите /start боту @userinfobot для получения вашего Chat ID",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Интеграция с Telegram
              </CardTitle>
              <CardDescription>
                Получайте уведомления о задачах и событиях в Telegram
              </CardDescription>
            </div>
            {isConnected && (
              <Badge variant="default" className="gap-1">
                <Check className="h-3 w-3" />
                Подключено
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="chat-id">Telegram Chat ID</Label>
            <div className="flex gap-2">
              <Input
                id="chat-id"
                placeholder="123456789"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                disabled={isConnected}
              />
              <Button
                variant="outline"
                onClick={handleGetChatId}
                disabled={isConnected}
              >
                Узнать Chat ID
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Напишите боту @userinfobot в Telegram для получения вашего Chat ID
            </p>
          </div>

          {!isConnected ? (
            <Button onClick={handleConnect} className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Подключить Telegram
            </Button>
          ) : (
            <Button onClick={handleDisconnect} variant="destructive" className="w-full">
              <X className="h-4 w-4 mr-2" />
              Отключить Telegram
            </Button>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Настройки уведомлений
            </CardTitle>
            <CardDescription>
              Выберите, какие уведомления получать в Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Все уведомления</Label>
                <p className="text-sm text-muted-foreground">
                  Получать все уведомления из системы
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            {notificationsEnabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Новые задачи</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Дедлайны задач</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Изменения в проектах</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Заказы и поставки</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Финансовые операции</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Напоминания о событиях</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Как это работает?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Получите ваш Chat ID через бота @userinfobot</p>
          <p>2. Введите Chat ID в поле выше</p>
          <p>3. Подключите Telegram к вашему аккаунту</p>
          <p>4. Настройте типы уведомлений</p>
          <p>5. Получайте моментальные уведомления в Telegram!</p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Separator } from "@/components/ui/separator";
