import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function TaskHotkeys() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      // N — новая задача
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        // Trigger task dialog открыть — через глобальное событие (или состояние)
        window.dispatchEvent(new CustomEvent('openTaskDialog'));
      }

      // / — фокус на поиск
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Поиск"]');
        searchInput?.focus();
      }

      // 1-5 — приоритеты (может быть использован для выделенной задачи)
      // E — edit (если задача выделена)
      // Del — delete
      // Shift+стрелки — навигация
      // ...можно расширить по мере необходимости
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [navigate]);

  return null;
}

