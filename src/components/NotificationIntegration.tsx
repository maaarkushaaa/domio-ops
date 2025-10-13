import React, { useEffect } from 'react';
import { useActionNotifications } from '@/hooks/use-notifications';
import { useApp } from '@/contexts/AppContext';

// Компонент для интеграции оповещений с AppContext
export function NotificationIntegration() {
  const { products } = useApp();
  const { 
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
    notifyDeadlineApproaching
  } = useActionNotifications();

  // Экспортируем функции для использования в других компонентах
  React.useEffect(() => {
    // Экспортируем функции в window для глобального доступа
    (window as any).notifyProductCreated = notifyProductCreated;
    (window as any).notifyProductUpdated = notifyProductUpdated;
    (window as any).notifyProductDeleted = notifyProductDeleted;
    (window as any).notifyMaterialAdded = notifyMaterialAdded;
    (window as any).notifyMaterialUpdated = notifyMaterialUpdated;
    (window as any).notifyInspectionStarted = notifyInspectionStarted;
    (window as any).notifyInspectionCompleted = notifyInspectionCompleted;
    (window as any).notifyCSVImport = notifyCSVImport;
    (window as any).notifyProgressUpdated = notifyProgressUpdated;
    (window as any).notifyLowStock = notifyLowStock;
    (window as any).notifyDeadlineApproaching = notifyDeadlineApproaching;
  }, [
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
    notifyDeadlineApproaching
  ]);

  // Отслеживаем изменения продуктов для оповещений
  useEffect(() => {
    // Здесь можно добавить логику отслеживания изменений
    // Например, через Realtime подписки Supabase
  }, [products]);

  return null; // Этот компонент не рендерит ничего
}

// Хук для использования оповещений в компонентах
export function useAppNotifications() {
  const { 
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
    notifyDeadlineApproaching
  } = useActionNotifications();

  return {
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
    notifyDeadlineApproaching
  };
}
