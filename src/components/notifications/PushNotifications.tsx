import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

export function PushNotifications() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  const toggleNotifications = async (checked: boolean) => {
    if (!checked) {
      setEnabled(false);
      toast({
        title: 'Уведомления отключены',
        description: 'Вы больше не будете получать push-уведомления',
      });
      return;
    }

    if (!('Notification' in window)) {
      toast({
        title: 'Уведомления не поддерживаются',
        description: 'Ваш браузер не поддерживает push-уведомления',
        variant: 'destructive',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      setEnabled(true);
      toast({
        title: 'Уведомления включены',
        description: 'Вы будете получать важные обновления',
      });
      
      // Test notification
      new Notification('DOMIO Ops', {
        body: 'Уведомления успешно включены!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    } else {
      setEnabled(false);
      toast({
        title: 'Уведомления отклонены',
        description: 'Разрешите уведомления в настройках браузера',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    // Check if notifications are already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      // Setup notification listener for real events
      const handleNewTask = () => {
        new Notification('Новая задача', {
          body: 'Вам назначена новая задача',
          icon: '/icon-192.png',
        });
      };
      
      // You can add event listeners here for actual events
      window.addEventListener('new-task', handleNewTask);
      
      return () => {
        window.removeEventListener('new-task', handleNewTask);
      };
    }
  }, []);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-primary" />
        <div>
          <Label htmlFor="push-notifications" className="font-medium cursor-pointer">
            Push-уведомления
          </Label>
          <p className="text-sm text-muted-foreground">
            {enabled ? 'Уведомления включены' : 'Включите для получения обновлений'}
          </p>
        </div>
      </div>
      <Switch
        id="push-notifications"
        checked={enabled}
        onCheckedChange={toggleNotifications}
      />
    </div>
  );
}
