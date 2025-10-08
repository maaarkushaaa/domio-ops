import { TelegramSettings } from '@/components/notifications/TelegramSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Shield, Palette } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Настройки
        </h1>
        <p className="text-muted-foreground mt-1">
          Управление параметрами системы
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="profile">
            <Shield className="h-4 w-4 mr-2" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Внешний вид
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <TelegramSettings />
        </TabsContent>

        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Информация профиля</CardTitle>
              <CardDescription>Управление данными вашего аккаунта</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Имя:</span>
                  <span className="text-sm text-muted-foreground">{user.name}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Роль:</span>
                  <span className="text-sm text-muted-foreground capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Дата регистрации:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Настройки внешнего вида</CardTitle>
              <CardDescription>Темная/светлая тема переключается в шапке</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Используйте переключатель темы в правом верхнем углу для смены темы оформления
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
