import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";

interface Event {
  id: number;
  title: string;
  date: Date;
  type: string;
  description?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([
    { id: 1, title: "Встреча с клиентом", date: new Date(2025, 9, 15), type: "meeting", description: "Обсуждение проекта кухни" },
    { id: 2, title: "Дедлайн проекта", date: new Date(2025, 9, 20), type: "deadline", description: "Сдача 3D модели шкафа" },
    { id: 3, title: "Доставка материалов", date: new Date(2025, 9, 18), type: "delivery", description: "Поставка ЛДСП и фурнитуры" },
  ]);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => 
      event.date.getDate() === day && 
      event.date.getMonth() === currentDate.getMonth() &&
      event.date.getFullYear() === currentDate.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Календарь</h1>
          <p className="text-muted-foreground">Планирование и события</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать событие
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новое событие</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newEventName || !newEventDate || !newEventType) return;
              const newEvent: Event = {
                id: events.length + 1,
                title: newEventName,
                date: new Date(newEventDate),
                type: newEventType,
                description: newEventDescription || undefined
              };
              setEvents([...events, newEvent]);
              setNewEventName('');
              setNewEventDate('');
              setNewEventType('');
              setNewEventDescription('');
              setDialogOpen(false);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input 
                  placeholder="Название события" 
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Дата</Label>
                <Input 
                  type="datetime-local" 
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select value={newEventType} onValueChange={setNewEventType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Встреча</SelectItem>
                    <SelectItem value="deadline">Дедлайн</SelectItem>
                    <SelectItem value="delivery">Доставка</SelectItem>
                    <SelectItem value="inspection">Проверка</SelectItem>
                    <SelectItem value="payment">Оплата</SelectItem>
                    <SelectItem value="call">Звонок</SelectItem>
                    <SelectItem value="training">Обучение</SelectItem>
                    <SelectItem value="presentation">Презентация</SelectItem>
                    <SelectItem value="conference">Конференция</SelectItem>
                    <SelectItem value="workshop">Воркшоп</SelectItem>
                    <SelectItem value="interview">Собеседование</SelectItem>
                    <SelectItem value="review">Ревью</SelectItem>
                    <SelectItem value="planning">Планирование</SelectItem>
                    <SelectItem value="installation">Монтаж</SelectItem>
                    <SelectItem value="maintenance">Обслуживание</SelectItem>
                    <SelectItem value="vacation">Отпуск</SelectItem>
                    <SelectItem value="holiday">Праздник</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea 
                  placeholder="Описание события" 
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">Создать</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="capitalize">{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
              <div key={day} className="text-center font-semibold text-sm p-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().getDate() === day && 
                             new Date().getMonth() === currentDate.getMonth() &&
                             new Date().getFullYear() === currentDate.getFullYear();
              
              return (
                <div
                  key={day}
                  className={`min-h-[100px] p-2 border rounded-lg ${
                    isToday ? 'bg-primary/10 border-primary' : 'border-border'
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(event => (
                      <Badge 
                        key={event.id} 
                        variant={event.type === 'deadline' ? 'destructive' : 'secondary'}
                        className="text-xs w-full justify-start truncate cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedEvent(event);
                          setEventDetailsOpen(true);
                        }}
                      >
                        {event.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Предстоящие события</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date.toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Badge variant={event.type === 'deadline' ? 'destructive' : 'secondary'}>
                  {event.type === 'meeting' && 'Встреча'}
                  {event.type === 'deadline' && 'Дедлайн'}
                  {event.type === 'delivery' && 'Доставка'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EventDetailsDialog
        event={selectedEvent}
        open={eventDetailsOpen}
        onOpenChange={setEventDetailsOpen}
      />
    </div>
  );
}
