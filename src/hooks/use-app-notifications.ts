import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAppNotifications() {
  useEffect(() => {
    const channel = supabase
      .channel('app_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const notification = payload.new as any;
        const event = notification.event;
        const actorId = notification.actor_id;
        
        // Не показываем уведомления от самого себя
        supabase.auth.getUser().then(({ data }) => {
          if (data.user?.id === actorId) return;
          
          // Формируем текст уведомления
          let message = '';
          if (event === 'wall_post_created') {
            message = '📝 Новый пост на стене';
          } else if (event === 'wall_comment_created') {
            message = '💬 Новый комментарий на стене';
          } else if (event === 'task_created') {
            message = '✅ Создана новая задача';
          } else if (event === 'task_updated') {
            message = '🔄 Задача обновлена';
          } else if (event === 'task_comment_created') {
            message = '💬 Новый комментарий к задаче';
          } else {
            message = `🔔 ${event}`;
          }
          
          // Показываем toast-уведомление
          toast.info(message, {
            duration: 4000,
            position: 'top-right',
          });
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
