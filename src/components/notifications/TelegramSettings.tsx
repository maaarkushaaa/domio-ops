import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Bell, CheckCircle } from 'lucide-react';

export function TelegramSettings() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('telegram_bot_token');
    const savedChatId = localStorage.getItem('telegram_chat_id');
    const savedEnabled = localStorage.getItem('telegram_enabled') === 'true';
    
    if (savedToken) setBotToken(savedToken);
    if (savedChatId) setChatId(savedChatId);
    setEnabled(savedEnabled);
    setIsConnected(!!(savedToken && savedChatId));
  }, []);

  const handleSave = () => {
    if (!botToken || !chatId) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    localStorage.setItem('telegram_bot_token', botToken);
    localStorage.setItem('telegram_chat_id', chatId);
    localStorage.setItem('telegram_enabled', enabled.toString());
    setIsConnected(true);

    toast({
      title: 'Настройки сохранены',
      description: 'Telegram уведомления настроены',
    });
  };

  const sendTestMessage = async () => {
    if (!isConnected) {
      toast({
        title: 'Ошибка',
        description: 'Сначала сохраните настройки',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '✅ DOMIO Ops подключен! Уведомления работают.',
            parse_mode: 'HTML',
          }),
        }
      );

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Тестовое сообщение отправлено',
        });
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Telegram уведомления
        </CardTitle>
        <CardDescription>
          Настройте бота для получения уведомлений о важных событиях
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bot-token">Bot Token</Label>
          <Input
            id="bot-token"
            type="password"
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className="interactive focus-elegant"
          />
          <p className="text-xs text-muted-foreground">
            Получите токен у @BotFather в Telegram
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chat-id">Chat ID</Label>
          <Input
            id="chat-id"
            placeholder="123456789"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            className="interactive focus-elegant"
          />
          <p className="text-xs text-muted-foreground">
            Узнайте ваш Chat ID у @userinfobot
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Включить уведомления</span>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-500">Подключено к Telegram</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Сохранить настройки
          </Button>
          {isConnected && (
            <Button onClick={sendTestMessage} variant="outline">
              Тест
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
