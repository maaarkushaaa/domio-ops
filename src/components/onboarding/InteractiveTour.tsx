import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: '1',
    target: '#root',
    title: 'Добро пожаловать в DOMIO Ops!',
    content: 'Давайте познакомимся с основными возможностями системы. Этот тур займет всего 2 минуты.',
    position: 'bottom',
  },
  {
    id: '2',
    target: '[data-tour="sidebar"]',
    title: 'Главное меню',
    content: 'Здесь находятся все основные разделы: задачи, проекты, финансы, клиенты и многое другое.',
    position: 'right',
  },
  {
    id: '3',
    target: '[data-tour="notifications"]',
    title: 'Центр уведомлений',
    content: 'Все важные события и обновления отображаются здесь. Вы можете настроить фильтры и приоритеты.',
    position: 'bottom',
  },
  {
    id: '4',
    target: '[data-tour="search"]',
    title: 'Глобальный поиск',
    content: 'Быстро находите задачи, проекты, клиентов и документы с помощью умного поиска с AI.',
    position: 'bottom',
  },
  {
    id: '5',
    target: '[data-tour="ai-assistant"]',
    title: 'AI-ассистент',
    content: 'Ваш персональный помощник для автоматизации задач, прогнозирования сроков и анализа данных.',
    position: 'left',
  },
];

interface InteractiveTourProps {
  onComplete: () => void;
}

export function InteractiveTour({ onComplete }: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive) return;

    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      let top = rect.top;
      let left = rect.left;

      // Position card near element
      switch (step.position) {
        case 'top':
          top = rect.top - 220;
          left = Math.max(10, Math.min(rect.left + rect.width / 2 - 200, window.innerWidth - 410));
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = Math.max(10, Math.min(rect.left + rect.width / 2 - 200, window.innerWidth - 410));
          break;
        case 'left':
          top = Math.max(10, rect.top + rect.height / 2 - 100);
          left = Math.max(10, rect.left - 420);
          break;
        case 'right':
          top = Math.max(10, rect.top + rect.height / 2 - 100);
          left = Math.min(rect.right + 20, window.innerWidth - 410);
          break;
      }

      setPosition({ top, left });

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add spotlight to element
      element.classList.add('tour-spotlight');
      
      return () => {
        element.classList.remove('tour-spotlight');
      };
    }
  }, [currentStep, isActive]);

  if (!isActive) return null;

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    onComplete();
  };

  return (
    <>
      {/* Spotlight overlay with cutout */}
      <div 
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          mixBlendMode: 'hard-light'
        }}
      />

      {/* Tour Card - clickable */}
      <Card
        className="fixed z-[101] w-[400px] shadow-2xl animate-scale-in pointer-events-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.content}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleComplete}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {currentStep + 1} из {tourSteps.length}
            </div>
            <div className="flex gap-2">
              {!isFirst && (
                <Button size="sm" variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Назад
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLast ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Завершить
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="w-full"
            onClick={handleComplete}
          >
            Пропустить тур
          </Button>
        </CardContent>
      </Card>

      <style>{`
        .tour-spotlight {
          position: relative;
          z-index: 101;
          box-shadow: 
            0 0 0 4px hsl(var(--primary)),
            0 0 0 8px hsl(var(--primary) / 0.5),
            0 0 0 9999px rgba(0, 0, 0, 0.7);
          border-radius: 0.75rem;
          transition: box-shadow 0.3s ease;
          pointer-events: auto;
        }
        
        /* Allow interaction with spotlighted element */
        .tour-spotlight * {
          pointer-events: auto;
        }
      `}</style>
    </>
  );
}
