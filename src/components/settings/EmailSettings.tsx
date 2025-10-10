import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Lock, Server } from "lucide-react";
import { useEmailSettings } from '@/hooks/use-email-settings';

export function EmailSettings() {
  const { settings, loading, saveSettings } = useEmailSettings();
  const [email, setEmail] = useState('');
  const [imapServer, setImapServer] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setEmail(settings.email);
      setImapServer(settings.imapServer);
      setImapPort(settings.imapPort.toString());
      setSmtpServer(settings.smtpServer);
      setSmtpPort(settings.smtpPort.toString());
      setPassword(settings.password);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings({
      email,
      imapServer,
      imapPort: parseInt(imapPort),
      smtpServer,
      smtpPort: parseInt(smtpPort),
      password,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            IMAP Настройки
          </CardTitle>
          <CardDescription>
            Подключите вашу корпоративную почту через IMAP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="imap-server">IMAP Сервер</Label>
            <Input
              id="imap-server"
              placeholder="imap.gmail.com"
              value={imapServer}
              onChange={(e) => setImapServer(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="imap-port">Порт</Label>
              <Input
                id="imap-port"
                type="number"
                placeholder="993"
                value={imapPort}
                onChange={(e) => setImapPort(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imap-encryption">Шифрование</Label>
              <Input
                id="imap-encryption"
                placeholder="SSL/TLS"
                defaultValue="SSL/TLS"
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Учетные данные
          </CardTitle>
          <CardDescription>
            Введите данные для подключения к почтовому серверу
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email адрес</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@domio.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            SMTP Настройки (Исходящая почта)
          </CardTitle>
          <CardDescription>
            Настройки для отправки писем
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="smtp-server">SMTP Сервер</Label>
            <Input
              id="smtp-server"
              placeholder="smtp.gmail.com"
              value={smtpServer}
              onChange={(e) => setSmtpServer(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="smtp-port">Порт</Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtp-encryption">Шифрование</Label>
              <Input
                id="smtp-encryption"
                placeholder="STARTTLS"
                defaultValue="STARTTLS"
                disabled
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Требуется аутентификация</Label>
              <p className="text-sm text-muted-foreground">
                SMTP требует имя пользователя и пароль
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Проверить подключение</Button>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </div>
    </div>
  );
}
