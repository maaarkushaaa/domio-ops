import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AIAssistantPanel } from '@/components/modern/AIAssistantPanel';

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'ai-assistant-position';

// Получить сохранённую позицию или дефолтную
const getSavedPosition = (): Position => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading AI assistant position:', error);
  }
  
  // Дефолтная позиция - правый нижний угол, выше чата
  return {
    x: window.innerWidth - 90, // 90px от правого края
    y: window.innerHeight - 180, // 180px от низа (выше чата)
  };
};

// Сохранить позицию
const savePosition = (position: Position) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch (error) {
    console.error('Error saving AI assistant position:', error);
  }
};

// Ограничить позицию в пределах экрана
const constrainPosition = (pos: Position): Position => {
  const buttonSize = 56; // размер кнопки
  const margin = 10; // отступ от края
  
  return {
    x: Math.max(margin, Math.min(pos.x, window.innerWidth - buttonSize - margin)),
    y: Math.max(margin, Math.min(pos.y, window.innerHeight - buttonSize - margin)),
  };
};

export function AIAssistantFloat() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>(getSavedPosition());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Обновить позицию при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => constrainPosition(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Начало перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    // Не начинаем перетаскивание если кликнули по самой кнопке (открытие)
    if ((e.target as HTMLElement).closest('button') && !isDragging) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  // Перетаскивание
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPos = constrainPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      setPosition(newPos);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const newPos = constrainPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
      setPosition(newPos);
    };

    const handleEnd = () => {
      setIsDragging(false);
      savePosition(position);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStart, position]);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: 60, // Выше чата (z-55)
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <Button
              ref={buttonRef}
              size="lg"
              className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 ${
                isDragging ? 'scale-110' : ''
              }`}
              onClick={(e) => {
                // Открываем только если не перетаскивали
                if (!isDragging) {
                  setOpen(true);
                }
              }}
            >
              <Sparkles className="h-6 w-6" />
            </Button>
            
            {/* Индикатор перетаскивания */}
            {isDragging && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-md">
                <Move className="h-3 w-3 inline mr-1" />
                Перетащите
              </div>
            )}
          </div>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[540px] p-0">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Ассистент
            </SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6 h-[calc(100vh-80px)] overflow-y-auto">
            <AIAssistantPanel />
          </div>
        </SheetContent>
      </Sheet>

      {/* Подсказка при первом использовании */}
      {!localStorage.getItem('ai-assistant-hint-shown') && (
        <div
          style={{
            position: 'fixed',
            left: `${position.x - 120}px`,
            top: `${position.y - 60}px`,
            zIndex: 59,
          }}
          className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-sm max-w-[200px] animate-in fade-in slide-in-from-bottom-2"
        >
          <p className="font-medium mb-1">💡 Подсказка</p>
          <p className="text-xs text-muted-foreground">
            Удерживайте и перетаскивайте кнопку в любое место экрана
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 h-6 text-xs w-full"
            onClick={() => {
              localStorage.setItem('ai-assistant-hint-shown', 'true');
              window.location.reload();
            }}
          >
            Понятно
          </Button>
        </div>
      )}
    </>
  );
}
