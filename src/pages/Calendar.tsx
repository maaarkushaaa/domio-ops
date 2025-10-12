import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";

interface Event {
  id: number;
  title: string;
  date: Date;      // начало
  endDate?: Date;  // конец (необязательно)
  type: string;
  description?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventName, setNewEventName] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventType, setNewEventType] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dayDialogDate, setDayDialogDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  // Диапазонное выделение
  const [isSelecting, setIsSelecting] = useState(false);
  const selectStartRef = useRef<number | null>(null);
  const [selectEnd, setSelectEnd] = useState<number | null>(null);

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
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    date.setHours(0,0,0,0);
    return events.filter(ev => {
      const start = new Date(ev.date); start.setHours(0,0,0,0);
      const end = new Date(ev.endDate || ev.date); end.setHours(23,59,59,999);
      return date >= start && date <= end;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Календарь</h1>
          <p className="text-muted-foreground">Планирование и события</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v)=>{ setDialogOpen(v); if(!v){ setEditingEvent(null);} }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать событие
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Редактировать событие' : 'Новое событие'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newEventName || !newEventStart || !newEventType) return;
              const start = new Date(newEventStart);
              const end = newEventEnd ? new Date(newEventEnd) : undefined;
              if (editingEvent) {
                setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { ...ev, title: newEventName, date: start, endDate: end, type: newEventType, description: newEventDescription || undefined } : ev));
              } else {
                const nextId = (events.at(-1)?.id || 0) + 1;
                setEvents(prev => [...prev, { id: nextId, title: newEventName, date: start, endDate: end, type: newEventType, description: newEventDescription || undefined }]);
              }
              setEditingEvent(null);
              setNewEventName(''); setNewEventStart(''); setNewEventEnd(''); setNewEventType(''); setNewEventDescription('');
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
              <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Начало</Label>
                  <Input type="datetime-local" value={newEventStart} onChange={(e)=>setNewEventStart(e.target.value)} required />
                </div>
                <div>
                  <Label>Окончание (необязательно)</Label>
                  <Input type="datetime-local" value={newEventEnd} onChange={(e)=>setNewEventEnd(e.target.value)} />
                </div>
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
              {editingEvent ? (
                <div className="flex justify-between">
                  <Button type="button" variant="destructive" onClick={() => { setEvents(prev => prev.filter(ev => ev.id !== editingEvent.id)); setDialogOpen(false); setEditingEvent(null); }}> <Trash2 className="h-4 w-4 mr-2" /> Удалить</Button>
                  <Button type="submit">Сохранить</Button>
                </div>
              ) : (
                <Button type="submit" className="w-full">Создать</Button>
              )}
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
                  } ${isSelecting && selectStartRef.current !== null && selectEnd !== null && (day >= Math.min(selectStartRef.current, selectEnd) && day <= Math.max(selectStartRef.current, selectEnd)) ? 'ring-2 ring-primary/60' : ''}`}
                  onMouseDown={() => { setIsSelecting(true); selectStartRef.current = day; setSelectEnd(day); }}
                  onMouseEnter={() => { if (isSelecting) setSelectEnd(day); }}
                  onMouseUp={() => {
                    if (isSelecting && selectStartRef.current !== null) {
                      const min = Math.min(selectStartRef.current, day);
                      const max = Math.max(selectStartRef.current, day);
                      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), min, 9, 0, 0);
                      const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), max, 18, 0, 0);
                      setIsSelecting(false); selectStartRef.current = null; setSelectEnd(null);
                      setNewEventName(''); setNewEventType(''); setNewEventDescription('');
                      setNewEventStart(start.toISOString().slice(0,16)); setNewEventEnd(end.toISOString().slice(0,16));
                      setDialogOpen(true);
                      return;
                    }
                    setIsSelecting(false); selectStartRef.current = null; setSelectEnd(null);
                    // Клик по дню — открыть диалог дня (или создание, если пусто)
                    const evs = getEventsForDay(day);
                    if (evs.length === 0) {
                      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 9, 0, 0);
                      setNewEventStart(start.toISOString().slice(0,16)); setNewEventEnd('');
                      setDialogOpen(true);
                    } else {
                      setDayDialogDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                      setDayDialogOpen(true);
                    }
                  }}
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
                    })}{event.endDate ? ' — ' + event.endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
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

      {/* Диалог дня: список событий + создать */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              События на {dayDialogDate?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {dayDialogDate && getEventsForDay(dayDialogDate.getDate()).length === 0 && (
              <div className="text-muted-foreground text-sm">Нет событий</div>
            )}
            {dayDialogDate && getEventsForDay(dayDialogDate.getDate()).map(ev => (
              <div key={ev.id} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <div className="font-medium text-sm">{ev.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {ev.date.toLocaleString('ru-RU')} {ev.endDate ? '— ' + ev.endDate.toLocaleString('ru-RU') : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingEvent(ev);
                    setNewEventName(ev.title);
                    setNewEventStart(ev.date.toISOString().slice(0,16));
                    setNewEventEnd(ev.endDate ? ev.endDate.toISOString().slice(0,16) : '');
                    setNewEventType(ev.type);
                    setNewEventDescription(ev.description || '');
                    setDialogOpen(true);
                  }}>
                    <Edit2 className="h-3 w-3 mr-1" /> Редактировать
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))}>
                    <Trash2 className="h-3 w-3 mr-1" /> Удалить
                  </Button>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Button onClick={() => { if (!dayDialogDate) return; setNewEventStart(dayDialogDate.toISOString().slice(0,16)); setNewEventEnd(''); setDialogOpen(true); }} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Создать событие
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EventDetailsDialog
        event={selectedEvent}
        open={eventDetailsOpen}
        onOpenChange={setEventDetailsOpen}
      />
    </div>
  );
}
