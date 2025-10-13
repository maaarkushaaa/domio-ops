/**
 * Утилита для автоматического расчета прогресса готовности изделия
 * Основана на лучших практиках управления производством
 */

export interface ProductProgressData {
  status: 'planning' | 'in_progress' | 'quality_check' | 'completed' | 'on_hold';
  qualityInspections?: {
    total: number;
    passed: number;
    failed: number;
    inProgress: number;
  };
  materials?: {
    totalRequired: number;
    available: number;
    missing: number;
  };
  hasDeadline?: boolean;
  isOverdue?: boolean;
}

/**
 * Базовый прогресс на основе статуса изделия
 */
const getBaseProgressByStatus = (status: ProductProgressData['status']): number => {
  switch (status) {
    case 'planning':
      return 0;
    case 'in_progress':
      return 25; // Начало производства
    case 'quality_check':
      return 75; // Готово к проверке
    case 'completed':
      return 100; // Полностью готово
    case 'on_hold':
      return 0; // Приостановлено
    default:
      return 0;
  }
};

/**
 * Прогресс на основе проверок качества
 */
const getQualityProgress = (inspections: ProductProgressData['qualityInspections']): number => {
  if (!inspections || inspections.total === 0) {
    return 0;
  }

  // Если есть проваленные проверки, прогресс снижается
  if (inspections.failed > 0) {
    return -10; // Штраф за проваленные проверки
  }

  // Прогресс на основе пройденных проверок
  const passedRatio = inspections.passed / inspections.total;
  return Math.round(passedRatio * 20); // До 20% за проверки качества
};

/**
 * Прогресс на основе готовности материалов
 */
const getMaterialsProgress = (materials: ProductProgressData['materials']): number => {
  if (!materials || materials.totalRequired === 0) {
    return 0;
  }

  const availabilityRatio = materials.available / materials.totalRequired;
  
  if (availabilityRatio >= 1) {
    return 10; // Бонус за полную готовность материалов
  } else if (availabilityRatio >= 0.8) {
    return 5; // Частичная готовность
  } else if (availabilityRatio >= 0.5) {
    return 0; // Нейтрально
  } else {
    return -5; // Штраф за недостаток материалов
  }
};

/**
 * Бонусы и штрафы
 */
const getBonusesAndPenalties = (data: ProductProgressData): number => {
  let bonus = 0;

  // Бонус за соблюдение сроков
  if (data.hasDeadline && !data.isOverdue) {
    bonus += 5;
  }

  // Штраф за просрочку
  if (data.isOverdue) {
    bonus -= 15;
  }

  // Штраф за приостановку
  if (data.status === 'on_hold') {
    bonus -= 20;
  }

  return bonus;
};

/**
 * Основная функция расчета прогресса
 */
export const calculateProductProgress = (data: ProductProgressData): number => {
  // Базовый прогресс по статусу
  let progress = getBaseProgressByStatus(data.status);

  // Добавляем прогресс от проверок качества
  const qualityProgress = getQualityProgress(data.qualityInspections);
  progress += qualityProgress;

  // Добавляем прогресс от готовности материалов
  const materialsProgress = getMaterialsProgress(data.materials);
  progress += materialsProgress;

  // Добавляем бонусы и штрафы
  const bonuses = getBonusesAndPenalties(data);
  progress += bonuses;

  // Ограничиваем прогресс в диапазоне 0-100%
  return Math.max(0, Math.min(100, progress));
};

/**
 * Получение детального анализа прогресса
 */
export const getProgressAnalysis = (data: ProductProgressData) => {
  const baseProgress = getBaseProgressByStatus(data.status);
  const qualityProgress = getQualityProgress(data.qualityInspections);
  const materialsProgress = getMaterialsProgress(data.materials);
  const bonuses = getBonusesAndPenalties(data);
  const totalProgress = calculateProductProgress(data);

  return {
    total: totalProgress,
    breakdown: {
      base: baseProgress,
      quality: qualityProgress,
      materials: materialsProgress,
      bonuses: bonuses,
    },
    recommendations: getRecommendations(data, totalProgress),
  };
};

/**
 * Рекомендации для улучшения прогресса
 */
const getRecommendations = (data: ProductProgressData, progress: number): string[] => {
  const recommendations: string[] = [];

  // Рекомендации по материалам
  if (data.materials && data.materials.missing > 0) {
    recommendations.push(`Закупить недостающие материалы (${data.materials.missing} позиций)`);
  }

  // Рекомендации по проверкам качества
  if (data.qualityInspections) {
    if (data.qualityInspections.failed > 0) {
      recommendations.push(`Исправить ошибки в ${data.qualityInspections.failed} проверках качества`);
    }
    if (data.qualityInspections.inProgress > 0) {
      recommendations.push(`Завершить ${data.qualityInspections.inProgress} проверок качества`);
    }
  }

  // Рекомендации по срокам
  if (data.isOverdue) {
    recommendations.push('Ускорить выполнение - срок просрочен');
  }

  // Рекомендации по статусу
  if (data.status === 'on_hold') {
    recommendations.push('Возобновить производство');
  }

  // Общие рекомендации
  if (progress < 25) {
    recommendations.push('Начать активное производство');
  } else if (progress < 50) {
    recommendations.push('Продолжить производство и подготовить к проверке качества');
  } else if (progress < 75) {
    recommendations.push('Провести проверку качества');
  } else if (progress < 100) {
    recommendations.push('Завершить финальные проверки и подготовить к отгрузке');
  }

  return recommendations;
};

/**
 * Получение цветового индикатора прогресса
 */
export const getProgressColor = (progress: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (progress >= 90) return 'default'; // Зеленый - почти готово
  if (progress >= 70) return 'secondary'; // Синий - хорошо продвигается
  if (progress >= 40) return 'outline'; // Серый - в процессе
  return 'destructive'; // Красный - проблемы
};

/**
 * Получение текстового описания прогресса
 */
export const getProgressDescription = (progress: number): string => {
  if (progress >= 95) return 'Готово к отгрузке';
  if (progress >= 85) return 'Почти готово';
  if (progress >= 70) return 'Хорошо продвигается';
  if (progress >= 50) return 'В процессе';
  if (progress >= 25) return 'Начальная стадия';
  if (progress >= 10) return 'Планирование';
  return 'Требует внимания';
};
