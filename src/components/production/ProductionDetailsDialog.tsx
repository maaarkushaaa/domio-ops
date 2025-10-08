import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductionDetailsDialogProps {
  type: 'inProgress' | 'completed' | 'needsMaterials' | 'warehouse';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockData = {
  inProgress: [
    { name: 'Шкаф Версаль', assignee: 'Иван Петров', progress: 75, status: 'UV-развертка' },
    { name: 'Стол Модерн', assignee: 'Анна Сидорова', progress: 60, status: 'Моделинг' },
    { name: 'Комод Классик', assignee: 'Петр Козлов', progress: 45, status: 'Текстурирование' },
    { name: 'Тумба Лофт', assignee: 'Мария Волкова', progress: 30, status: 'Оптимизация' },
    { name: 'Кровать Прованс', assignee: 'Дмитрий Новиков', progress: 85, status: 'Финальная доработка' },
    { name: 'Кресло Скандинавия', assignee: 'Елена Морозова', progress: 20, status: 'Блокаут' },
    { name: 'Диван Модерн', assignee: 'Сергей Лебедев', progress: 55, status: 'High-poly' },
    { name: 'Полка Минимализм', assignee: 'Ольга Белова', progress: 90, status: 'Экспорт' },
  ],
  completed: [
    { name: 'Шкаф-купе Элит', date: '2 Окт 2025', assignee: 'Иван Петров' },
    { name: 'Стол Классический', date: '1 Окт 2025', assignee: 'Анна Сидорова' },
    { name: 'Комод Барокко', date: '30 Сен 2025', assignee: 'Петр Козлов' },
    { name: 'Тумба Прованс', date: '28 Сен 2025', assignee: 'Мария Волкова' },
    { name: 'Кровать Модерн', date: '25 Сен 2025', assignee: 'Дмитрий Новиков' },
    { name: 'Стеллаж Лофт', date: '22 Сен 2025', assignee: 'Елена Морозова' },
    { name: 'Консоль Арт-Деко', date: '20 Сен 2025', assignee: 'Сергей Лебедев' },
    { name: 'Витрина Классика', date: '18 Сен 2025', assignee: 'Ольга Белова' },
  ],
  needsMaterials: [
    { name: 'Кухня Прованс', material: 'ЛДСП 18мм бежевый', quantity: '12 м²' },
    { name: 'Шкаф Модерн', material: 'Петли Blum Clip Top', quantity: '8 шт' },
    { name: 'Комод Лофт', material: 'Направляющие 550мм', quantity: '6 пар' },
  ],
  warehouse: [
    { name: 'ЛДСП 16мм белый', quantity: '45 м²', status: 'В наличии' },
    { name: 'ЛДСП 16мм венге', quantity: '32 м²', status: 'В наличии' },
    { name: 'Кромка ПВХ 2мм белая', quantity: '850 м', status: 'В наличии' },
    { name: 'Петли Blum', quantity: '124 шт', status: 'В наличии' },
    { name: 'Направляющие 500мм', quantity: '8 пар', status: 'Низкий остаток' },
    { name: 'Конфирматы 5x70', quantity: '2400 шт', status: 'В наличии' },
    { name: 'Ручки хром', quantity: '45 шт', status: 'Низкий остаток' },
  ],
};

const titles = {
  inProgress: 'Изделия в работе',
  completed: 'Завершенные изделия за месяц',
  needsMaterials: 'Изделия, ожидающие материалов',
  warehouse: 'Остатки на складе',
};

export function ProductionDetailsDialog({ type, open, onOpenChange }: ProductionDetailsDialogProps) {
  const data = mockData[type];
  const title = titles[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3">
            {type === 'inProgress' && data.map((item: any, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.assignee}</p>
                  </div>
                  <Badge variant="outline">{item.progress}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.status}</p>
              </div>
            ))}

            {type === 'completed' && data.map((item: any, i) => (
              <div key={i} className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.assignee}</p>
                </div>
                <p className="text-sm text-muted-foreground">{item.date}</p>
              </div>
            ))}

            {type === 'needsMaterials' && data.map((item: any, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Требуется: {item.material} - {item.quantity}
                </p>
                <Badge variant="destructive" className="mt-2">Ожидает закупки</Badge>
              </div>
            ))}

            {type === 'warehouse' && data.map((item: any, i) => (
              <div key={i} className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Количество: {item.quantity}</p>
                </div>
                <Badge variant={item.status === 'Низкий остаток' ? 'destructive' : 'default'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
