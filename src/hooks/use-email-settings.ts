import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailSettings {
  email: string;
  imapServer: string;
  imapPort: number;
  smtpServer: string;
  smtpPort: number;
  password: string;
}

export const useEmailSettings = () => {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          email: data.email,
          imapServer: data.imap_server,
          imapPort: data.imap_port,
          smtpServer: data.smtp_server,
          smtpPort: data.smtp_port,
          password: data.password,
        });
      }
    } catch (error: any) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: EmailSettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await (supabase as any)
        .from('email_accounts')
        .upsert({
          user_id: user.id,
          email: newSettings.email,
          imap_server: newSettings.imapServer,
          imap_port: newSettings.imapPort,
          smtp_server: newSettings.smtpServer,
          smtp_port: newSettings.smtpPort,
          password: newSettings.password,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings(newSettings);
      toast({
        title: 'Настройки сохранены',
        description: 'Настройки почты успешно обновлены',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
      return false;
    }
  };

  return { settings, loading, saveSettings, loadSettings };
};
