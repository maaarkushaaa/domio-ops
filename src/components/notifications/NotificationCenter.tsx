import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, Filter } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  read: boolean;
  category: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Новая задача назначена',
      message: 'Вам назначена задача "Разработка API"',
      type: 'info',
      priority: 'high',
      timestamp: new Date().toISOString(),
      read: false,
      category: 'tasks',
    },
    {
      id: '2',
      title: 'Платеж получен',
      message: 'Поступил платеж от клиента на сумму 50,000₽',
      type: 'success',
      priority: 'medium',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      category: 'finance',
    },
    {
      id: '3',
      title: 'Критическая ошибка',
      message: 'Обнаружена критическая ошибка в модуле закупок',
      type: 'error',
      priority: 'urgent',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      category: 'system',
    },
  ]);

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesPriority = filterPriority === 'all' || n.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || n.category === filterCategory;
    return matchesPriority && matchesCategory;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Центр уведомлений
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            Прочитать все
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="unread">Непрочитанные</TabsTrigger>
            <TabsTrigger value="priority">Приоритетные</TabsTrigger>
            <TabsTrigger value="archived">Архив</TabsTrigger>
          </TabsList>

          <div className="flex gap-2 mt-4">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4" />
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Приоритет" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приоритеты</SelectItem>
                  <SelectItem value="urgent">Срочные</SelectItem>
                  <SelectItem value="high">Высокие</SelectItem>
                  <SelectItem value="medium">Средние</SelectItem>
                  <SelectItem value="low">Низкие</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="tasks">Задачи</SelectItem>
                <SelectItem value="finance">Финансы</SelectItem>
                <SelectItem value="system">Система</SelectItem>
                <SelectItem value="clients">Клиенты</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      !notification.read ? 'bg-accent/50' : ''
                    } hover:bg-accent/70 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <Badge variant="outline">{notification.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.timestamp).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {filteredNotifications
                  .filter(n => !n.read)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors"
                    >
                      {/* Same notification structure */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getIcon(notification.type)}
                          <div className="flex-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="priority">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {filteredNotifications
                  .filter(n => n.priority === 'urgent' || n.priority === 'high')
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border rounded-lg hover:bg-accent/70 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getIcon(notification.type)}
                          <div className="flex-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="archived">
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет архивных уведомлений</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
