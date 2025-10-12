import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText, Edit2, Trash2 } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: Date;      // start
  endDate?: Date;  // end
  type: string;
  description?: string;
}

interface EventDetailsDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
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

export function EventDetailsDialog({ event, open, onOpenChange, onEdit, onDelete }: EventDetailsDialogProps) {
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
              {event.date.toLocaleString('ru-RU')}
              {event.endDate ? ' — ' + event.endDate.toLocaleString('ru-RU') : ''}
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
          <div className="flex justify-end gap-2 pt-2">
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(event)}>
                <Trash2 className="h-3 w-3 mr-1" /> Удалить
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                <Edit2 className="h-3 w-3 mr-1" /> Редактировать
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
