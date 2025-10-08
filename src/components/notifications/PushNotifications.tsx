import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';

export function PushNotifications() {
  const { toast } = useToast();

  const requestPermission = async () => {
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
      toast({
        title: 'Уведомления отклонены',
        description: 'Вы не будете получать push-уведомления',
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

  const currentPermission = 'Notification' in window ? Notification.permission : 'unsupported';

  return (
    <div className="flex items-center gap-2">
      {currentPermission === 'granted' ? (
        <Button variant="ghost" size="sm" className="gap-2" disabled>
          <Bell className="h-4 w-4" />
          Уведомления включены
        </Button>
      ) : currentPermission === 'denied' ? (
        <Button variant="ghost" size="sm" className="gap-2" disabled>
          <BellOff className="h-4 w-4 text-muted-foreground" />
          Уведомления отключены
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" onClick={requestPermission}>
          <Bell className="h-4 w-4" />
          Включить уведомления
        </Button>
      )}
    </div>
  );
}
