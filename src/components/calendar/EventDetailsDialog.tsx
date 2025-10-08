import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: Date;
  type: string;
  description?: string;
}

interface EventDetailsDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const eventTypeLabels: Record<string, string> = {
  meeting: 'Встреча',
  deadline: 'Дедлайн',
  delivery: 'Доставка',
  inspection: 'Проверка',
  payment: 'Оплата',
  call: 'Звонок',
  training: 'Обучение',
  presentation: 'Презентация',
  conference: 'Конференция',
  workshop: 'Воркшоп',
  interview: 'Собеседование',
  review: 'Ревью',
  planning: 'Планирование',
  installation: 'Монтаж',
  maintenance: 'Обслуживание',
  vacation: 'Отпуск',
  holiday: 'Праздник',
  other: 'Другое',
};

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {event.date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {event.date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={event.type === 'deadline' ? 'destructive' : 'secondary'}>
              {eventTypeLabels[event.type] || event.type}
            </Badge>
          </div>
          {event.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Описание:</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{event.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
