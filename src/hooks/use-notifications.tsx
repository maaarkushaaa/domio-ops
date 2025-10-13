import { useState, useEffect, useCallback } from 'react';
import { createContext, useContext, ReactNode } from 'react';

// Типы для системы оповещений
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  sound?: boolean;
  actions?: NotificationAction[];
  persistent?: boolean;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface NotificationSettings {
  enabled: boolean;
  sounds: boolean;
  desktop: boolean;
  duration: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications: number;
}

// Контекст для системы оповещений
interface NotificationContextType {
  notifications: Notification[];
  settings: NotificationSettings;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  playSound: (type: Notification['type']) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Провайдер контекста
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sounds: true,
    desktop: true,
    duration: 5000,
    position: 'top-right',
    maxNotifications: 5,
  });

  // Загружаем настройки из localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Сохраняем настройки в localStorage
  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Звуки для разных типов уведомлений
  const playSound = useCallback((type: Notification['type']) => {
    if (!settings.sounds) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Создаем разные звуки для разных типов
    const frequencies = {
      success: [523.25, 659.25, 783.99], // C5, E5, G5
      error: [220, 196, 174.61], // A3, G3, F3
      warning: [440, 493.88, 440], // A4, B4, A4
      info: [523.25, 587.33], // C5, D5
    };

    const frequenciesToPlay = frequencies[type];
    
    frequenciesToPlay.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }, index * 100);
    });
  }, [settings.sounds]);

  // Добавление уведомления
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    console.log('addNotification called with:', notification);
    console.log('Current settings:', settings);
    
    if (!settings.enabled) {
      console.log('Notifications disabled, skipping');
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    console.log('Creating new notification:', newNotification);

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      const result = updated.slice(0, settings.maxNotifications);
      console.log('Updated notifications:', result);
      return result;
    });

    // Воспроизводим звук
    if (notification.sound !== false) {
      playSound(notification.type);
    }

    // Показываем desktop notification
    if (settings.desktop && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: newNotification.id,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id,
            });
          }
        });
      }
    }

    // Автоматическое удаление (если не persistent)
    if (!notification.persistent && notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration || settings.duration);
    }
  }, [settings, playSound]);

  // Удаление уведомления
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Очистка всех уведомлений
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Обновление настроек
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      settings,
      addNotification,
      removeNotification,
      clearAllNotifications,
      updateSettings,
      playSound,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Хук для использования системы оповещений
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Хук для автоматических оповещений о действиях
export function useActionNotifications() {
  const { addNotification } = useNotifications();

  const notifySuccess = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'success',
      title,
      message,
      actions,
      sound: true,
    });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'error',
      title,
      message,
      actions,
      sound: true,
      persistent: true, // Ошибки остаются до ручного закрытия
    });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'warning',
      title,
      message,
      actions,
      sound: true,
    });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message: string, actions?: NotificationAction[]) => {
    addNotification({
      type: 'info',
      title,
      message,
      actions,
      sound: false, // Информационные уведомления без звука
    });
  }, [addNotification]);

  // Специализированные уведомления для разных действий
  const notifyProductCreated = useCallback((productName: string) => {
    notifySuccess(
      'Изделие создано',
      `Изделие "${productName}" успешно добавлено в систему`,
      [
        {
          label: 'Открыть',
          action: () => {
            // Логика открытия изделия
            console.log('Opening product:', productName);
          }
        }
      ]
    );
  }, [notifySuccess]);

  const notifyProductUpdated = useCallback((productName: string) => {
    notifySuccess(
      'Изделие обновлено',
      `Изделие "${productName}" успешно обновлено`
    );
  }, [notifySuccess]);

  const notifyProductDeleted = useCallback((productName: string) => {
    notifyWarning(
      'Изделие удалено',
      `Изделие "${productName}" удалено из системы`,
      [
        {
          label: 'Отменить',
          action: () => {
            // Логика восстановления изделия
            console.log('Restoring product:', productName);
          },
          variant: 'outline'
        }
      ]
    );
  }, [notifyWarning]);

  const notifyMaterialAdded = useCallback((materialName: string) => {
    notifySuccess(
      'Материал добавлен',
      `Материал "${materialName}" добавлен в каталог`
    );
  }, [notifySuccess]);

  const notifyMaterialUpdated = useCallback((materialName: string) => {
    notifySuccess(
      'Материал обновлен',
      `Остатки материала "${materialName}" обновлены`
    );
  }, [notifySuccess]);

  const notifyInspectionStarted = useCallback((productName: string, checklistName: string) => {
    notifyInfo(
      'Проверка качества начата',
      `Проверка изделия "${productName}" по чек-листу "${checklistName}"`
    );
  }, [notifyInfo]);

  const notifyInspectionCompleted = useCallback((productName: string, status: 'passed' | 'failed', score?: number) => {
    if (status === 'passed') {
      notifySuccess(
        'Проверка качества пройдена',
        `Изделие "${productName}" прошло проверку${score ? ` (${score}%)` : ''}`
      );
    } else {
      notifyError(
        'Проверка качества не пройдена',
        `Изделие "${productName}" не прошло проверку качества`,
        [
          {
            label: 'Просмотреть детали',
            action: () => {
              // Логика открытия деталей проверки
              console.log('Opening inspection details for:', productName);
            }
          }
        ]
      );
    }
  }, [notifySuccess, notifyError]);

  const notifyCSVImport = useCallback((type: 'materials' | 'bom', success: number, errors: number) => {
    if (errors === 0) {
      notifySuccess(
        'CSV импорт завершен',
        `Импорт ${type === 'materials' ? 'материалов' : 'BOM'} завершен успешно. Обработано: ${success} записей`
      );
    } else if (success > 0) {
      notifyWarning(
        'CSV импорт завершен с ошибками',
        `Импорт ${type === 'materials' ? 'материалов' : 'BOM'} завершен. Успешно: ${success}, Ошибок: ${errors}`,
        [
          {
            label: 'Просмотреть ошибки',
            action: () => {
              // Логика открытия деталей ошибок
              console.log('Opening import errors');
            }
          }
        ]
      );
    } else {
      notifyError(
        'CSV импорт не удался',
        `Импорт ${type === 'materials' ? 'материалов' : 'BOM'} завершился с ошибками. Ошибок: ${errors}`,
        [
          {
            label: 'Повторить импорт',
            action: () => {
              // Логика повторного импорта
              console.log('Retrying import');
            },
            variant: 'outline'
          }
        ]
      );
    }
  }, [notifySuccess, notifyWarning, notifyError]);

  const notifyProgressUpdated = useCallback((productName: string, progress: number) => {
    if (progress === 100) {
      notifySuccess(
        'Изделие готово',
        `Изделие "${productName}" готово к отгрузке (100%)`
      );
    } else if (progress >= 75) {
      notifyInfo(
        'Изделие почти готово',
        `Изделие "${productName}" готово на ${progress}%`
      );
    }
  }, [notifySuccess, notifyInfo]);

  const notifyLowStock = useCallback((materialName: string, currentStock: number, minStock: number) => {
    notifyWarning(
      'Низкий остаток материала',
      `Материал "${materialName}": остаток ${currentStock}, минимум ${minStock}`,
      [
        {
          label: 'Заказать',
          action: () => {
            // Логика заказа материала
            console.log('Ordering material:', materialName);
          }
        }
      ]
    );
  }, [notifyWarning]);

  const notifyDeadlineApproaching = useCallback((productName: string, daysLeft: number) => {
    if (daysLeft <= 0) {
      notifyError(
        'Срок изготовления просрочен',
        `Изделие "${productName}" просрочено`,
        [
          {
            label: 'Просмотреть',
            action: () => {
              console.log('Opening overdue product:', productName);
            }
          }
        ]
      );
    } else if (daysLeft <= 3) {
      notifyWarning(
        'Приближается срок изготовления',
        `Изделие "${productName}": осталось ${daysLeft} дней`,
        [
          {
            label: 'Ускорить',
            action: () => {
              console.log('Expediting product:', productName);
            }
          }
        ]
      );
    }
  }, [notifyError, notifyWarning]);

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyProductCreated,
    notifyProductUpdated,
    notifyProductDeleted,
    notifyMaterialAdded,
    notifyMaterialUpdated,
    notifyInspectionStarted,
    notifyInspectionCompleted,
    notifyCSVImport,
    notifyProgressUpdated,
    notifyLowStock,
    notifyDeadlineApproaching,
  };
}
