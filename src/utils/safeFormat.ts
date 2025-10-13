// VERSION: 3.0 - ULTRA DEEP FIX - GLOBAL SAFE FORMATTING
// Глобальная безопасная функция форматирования чисел

export const safeFormatNumber = (value: any, fallback = '0'): string => {
  try {
    const num = Number(value);
    if (isNaN(num)) return fallback;
    return num.toLocaleString('ru-RU');
  } catch {
    return fallback;
  }
};

export const safeFormatCurrency = (value: any, currency = '₽', fallback = '0'): string => {
  try {
    const num = Number(value);
    if (isNaN(num)) return `${fallback} ${currency}`;
    return `${num.toLocaleString('ru-RU')} ${currency}`;
  } catch {
    return `${fallback} ${currency}`;
  }
};

export const safeFormatDate = (value: any, fallback = 'Не указано'): string => {
  try {
    if (!value) return fallback;
    const date = new Date(value);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleString('ru-RU');
  } catch {
    return fallback;
  }
};
