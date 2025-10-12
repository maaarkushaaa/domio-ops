import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  {
    keys: ['Ctrl', 'K'],
    description: 'Открыть Command Palette',
    category: 'Навигация',
  },
  {
    keys: ['Ctrl', 'F'],
    description: 'Глобальный поиск',
    category: 'Навигация',
  },
  {
    keys: ['Ctrl', 'Shift', '7'],
    description: 'Показать горячие клавиши',
    category: 'Помощь',
  },
  {
    keys: ['G', 'H'],
    description: 'Перейти на Главную',
    category: 'Навигация',
  },
  {
    keys: ['G', 'T'],
    description: 'Перейти к Задачам',
    category: 'Навигация',
  },
  {
    keys: ['G', 'P'],
    description: 'Перейти в Производство',
    category: 'Навигация',
  },
  {
    keys: ['G', 'F'],
    description: 'Перейти в Финансы',
    category: 'Навигация',
  },
  {
    keys: ['G', 'C'],
    description: 'Перейти к Клиентам',
    category: 'Навигация',
  },
  {
    keys: ['N', 'T'],
    description: 'Новая задача',
    category: 'Действия',
  },
  {
    keys: ['N', 'P'],
    description: 'Новый проект',
    category: 'Действия',
  },
  {
    keys: ['Ctrl', 'S'],
    description: 'Сохранить',
    category: 'Действия',
  },
  {
    keys: ['Esc'],
    description: 'Закрыть диалог/модальное окно',
    category: 'Общее',
  },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ctrl+Shift+7 для горячих клавиш
      if (e.key === '7' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Горячие клавиши
          </DialogTitle>
          <DialogDescription>
            Используйте эти комбинации клавиш для быстрой работы с системой
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="px-2 py-1 font-mono text-xs bg-background"
                          >
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(groupedShortcuts).indexOf(category) <
                Object.keys(groupedShortcuts).length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground text-center pt-4 border-t">
          <p>Нажмите <Badge variant="outline" className="mx-1">?</Badge> в любое время, чтобы открыть это окно</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
