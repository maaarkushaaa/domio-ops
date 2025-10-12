import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/use-tasks';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export function NotificationPopover() {
  const { tasks } = useTasks();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({});

  // Загружаем WIP лимиты
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('kanban_wip_limits')
        .select('status, limit_value');
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => (map[r.status] = r.limit_value));
      setWipLimits(map);
    })();
  }, []);

  // Считаем уведомления по задачам
  const computedTaskNotifications = useMemo<Notification[]>(() => {
    const list: Notification[] = [];
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);

    (tasks || []).forEach((t: any) => {
      if (!t.due_date || t.status === 'done') return;
      const start = new Date(t.due_date); start.setHours(0,0,0,0);
      const end = t.due_end ? new Date(t.due_end) : new Date(t.due_date); end.setHours(23,59,59,999);

      if (end < todayStart) {
        list.push({ id: `overdue:${t.id}`, title: 'Задача просрочена', message: t.title, type: 'error', timestamp: end, read: false });
      } else if (end >= todayStart && end <= todayEnd) {
        list.push({ id: `due-today:${t.id}`, title: 'Дедлайн сегодня', message: t.title, type: 'warning', timestamp: end, read: false });
      }
      if (start >= todayStart && start <= todayEnd) {
        list.push({ id: `start-today:${t.id}`, title: 'Старт задачи сегодня', message: t.title, type: 'info', timestamp: start, read: false });
      }
    });

    const byStatus: Record<string, number> = {};
    (tasks || []).forEach((t: any) => { if (t.status !== 'done') byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
    Object.entries(wipLimits).forEach(([status, limit]) => {
      if (limit > 0 && (byStatus[status] || 0) > limit) {
        list.push({ id: `wip:${status}`, title: 'WIP лимит превышен', message: `Колонка превышает лимит (${byStatus[status]}/${limit})`, type: 'warning', timestamp: new Date(), read: false });
      }
    });
    return list.sort((a,b)=>b.timestamp.getTime()-a.timestamp.getTime()).slice(0,30);
  }, [tasks, wipLimits]);

  // Realtime: новые комментарии
  useEffect(() => {
    const channel = supabase
      .channel('notifications_task_comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_comments' }, (payload) => {
        const row: any = payload.new;
        if (row.author_id && user?.id && row.author_id === user.id) return;
        setNotifications(prev => [{ id:`comment:${row.id}`, title:'Новый комментарий', message: row.content?.slice(0,120)||'Комментарий', type:'info', timestamp:new Date(row.created_at||new Date()), read:false }, ...prev].slice(0,50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Синхронизируем вычисляемые уведомления
  useEffect(() => {
    setNotifications(prev => {
      const keep = prev.filter(n => !n.id.startsWith('overdue:') && !n.id.startsWith('due-today:') && !n.id.startsWith('start-today:') && !n.id.startsWith('wip:'));
      const merged = [...computedTaskNotifications, ...keep];
      const map = new Map<string, Notification>(); merged.forEach(n=>map.set(n.id,n));
      return Array.from(map.values()).sort((a,b)=>b.timestamp.getTime()-a.timestamp.getTime());
    });
  }, [computedTaskNotifications]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-destructive';
      default: return 'text-primary';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="interactive relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Уведомления</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Прочитать все
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Нет уведомлений
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getTypeColor(notification.type)}`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {notification.timestamp.toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">
                            Новое
                          </Badge>
                        )}
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Отметить прочитанным
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
