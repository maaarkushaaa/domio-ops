import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVideoCallRealtime } from "@/providers/VideoCallRealtimeProvider";
import { WebRTCVideoCall } from "@/components/video/WebRTCVideoCall";
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Link as LinkIcon,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react";

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  endDate?: Date;
  type: string;
  description?: string;
  hasVideo: boolean;
  videoSessionId: string | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: "Встреча",
  deadline: "Дедлайн",
  delivery: "Доставка",
  inspection: "Проверка",
  payment: "Оплата",
  call: "Звонок",
  training: "Обучение",
  presentation: "Презентация",
  conference: "Конференция",
  workshop: "Воркшоп",
  interview: "Собеседование",
  review: "Ревью",
  planning: "Планирование",
  installation: "Монтаж",
  maintenance: "Обслуживание",
  vacation: "Отпуск",
  holiday: "Праздник",
  other: "Другое",
};

export default function Calendar() {
  const { toast } = useToast();
  const {
    session,
    participants,
    createSession,
    joinSession,
    leaveSession,
  } = useVideoCallRealtime();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [newEventName, setNewEventName] = useState("");
  const [newEventStart, setNewEventStart] = useState("");
  const [newEventEnd, setNewEventEnd] = useState("");
  const [newEventType, setNewEventType] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventHasVideo, setNewEventHasVideo] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dayDialogDate, setDayDialogDate] = useState<Date | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const selectStartRef = useRef<number | null>(null);
  const [selectEnd, setSelectEnd] = useState<number | null>(null);

  const monthMeta = useMemo(() => getMonthMeta(currentDate), [currentDate]);
  const monthTitle = useMemo(
    () => currentDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }),
    [currentDate]
  );

  const loadEvents = useCallback(async () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    const { data, error } = await (supabase as any)
      .from("calendar_events")
      .select("id, title, start_at, end_at, type, description, has_video, video_room")
      .gte("start_at", monthStart.toISOString())
      .lte("start_at", monthEnd.toISOString())
      .order("start_at", { ascending: true });

    if (error) {
      console.error("Ошибка загрузки событий календаря", error);
      toast({ title: "Ошибка", description: "Не удалось загрузить события", variant: "destructive" });
      return;
    }

    const parsed: CalendarEvent[] = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      date: new Date(row.start_at),
      endDate: row.end_at ? new Date(row.end_at) : undefined,
      type: row.type,
      description: row.description ?? undefined,
      hasVideo: Boolean(row.has_video) || Boolean(row.video_room),
      videoSessionId: row.video_room ?? null,
    }));

    setEvents(parsed);
  }, [currentDate, toast]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    loadEvents();

    channel = supabase
      .channel("calendar_events_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events" },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadEvents]);

  const activeEvent = useMemo(() => {
    if (!session) return null;
    return events.find((event) => event.videoSessionId === session.id) ?? null;
  }, [events, session]);

  const resetForm = useCallback(() => {
    setEditingEvent(null);
    setNewEventName("");
    setNewEventStart("");
    setNewEventEnd("");
    setNewEventType("");
    setNewEventDescription("");
    setNewEventHasVideo(false);
  }, []);

  const openCreateDialog = useCallback((defaults?: Partial<CalendarEvent>) => {
    setEditingEvent(null);
    setNewEventName(defaults?.title ?? "");
    setNewEventStart(defaults?.date ? isoLocal(defaults.date) : "");
    setNewEventEnd(defaults?.endDate ? isoLocal(defaults.endDate) : "");
    setNewEventType(defaults?.type ?? "");
    setNewEventDescription(defaults?.description ?? "");
    setNewEventHasVideo(defaults?.hasVideo ?? false);
    setDialogOpen(true);
  }, []);

  const populateFormFromEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEventName(event.title);
    setNewEventStart(isoLocal(event.date));
    setNewEventEnd(event.endDate ? isoLocal(event.endDate) : "");
    setNewEventType(event.type);
    setNewEventDescription(event.description ?? "");
    setNewEventHasVideo(event.hasVideo);
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!newEventName.trim() || !newEventStart || !newEventType) {
      toast({ title: "Ошибка", description: "Заполните обязательные поля", variant: "destructive" });
      return;
    }

    const start = new Date(newEventStart);
    const end = newEventEnd ? new Date(newEventEnd) : undefined;

    let sessionId: string | null = editingEvent?.videoSessionId ?? null;

    if (newEventHasVideo && !sessionId) {
      sessionId = await createSession(newEventName.trim(), []);
      if (!sessionId) {
        toast({ title: "Ошибка", description: "Не удалось создать видеозвонок", variant: "destructive" });
        return;
      }
    }

    if (!newEventHasVideo) {
      sessionId = null;
    }

    if (editingEvent) {
      const { error } = await (supabase as any)
        .from("calendar_events")
        .update({
          title: newEventName.trim(),
          start_at: start.toISOString(),
          end_at: end ? end.toISOString() : null,
          type: newEventType,
          description: newEventDescription || null,
          has_video: newEventHasVideo,
          video_room: sessionId,
        })
        .eq("id", editingEvent.id);

      if (error) {
        console.error("Ошибка обновления события", error);
        toast({ title: "Ошибка", description: "Не удалось обновить событие", variant: "destructive" });
        return;
      }

      toast({ title: "Готово", description: "Событие обновлено" });
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({ title: "Ошибка", description: "Необходимо авторизоваться", variant: "destructive" });
        return;
      }

      const { error } = await (supabase as any)
        .from("calendar_events")
        .insert({
          title: newEventName.trim(),
          start_at: start.toISOString(),
          end_at: end ? end.toISOString() : null,
          type: newEventType,
          description: newEventDescription || null,
          has_video: newEventHasVideo,
          video_room: sessionId,
          created_by: userData.user.id,
        });

      if (error) {
        console.error("Ошибка создания события", error);
        toast({ title: "Ошибка", description: "Не удалось создать событие", variant: "destructive" });
        return;
      }

      toast({ title: "Событие создано" });
    }

    setDialogOpen(false);
    resetForm();
    loadEvents();
  }, [
    createSession,
    editingEvent,
    loadEvents,
    newEventDescription,
    newEventEnd,
    newEventHasVideo,
    newEventName,
    newEventStart,
    newEventType,
    resetForm,
    toast,
  ]);

  const handleDeleteEvent = useCallback(async (event: CalendarEvent) => {
    const { error } = await (supabase as any).from("calendar_events").delete().eq("id", event.id);
    if (error) {
      console.error("Ошибка удаления события", error);
      toast({ title: "Ошибка", description: "Не удалось удалить событие", variant: "destructive" });
      return;
    }

    if (editingEvent?.id === event.id) {
      resetForm();
      setDialogOpen(false);
    }

    if (selectedEvent?.id === event.id) {
      setSelectedEvent(null);
      setEventDetailsOpen(false);
    }

    toast({ title: "Удалено", description: "Событие удалено" });
    loadEvents();
  }, [editingEvent, loadEvents, resetForm, selectedEvent, toast]);

  const handleJoinEvent = useCallback(async (event: CalendarEvent) => {
    let sessionId = event.videoSessionId;

    if (!sessionId) {
      sessionId = await createSession(event.title, []);
      if (!sessionId) {
        toast({ title: "Ошибка", description: "Не удалось создать видеозвонок", variant: "destructive" });
        return;
      }

      const { error } = await (supabase as any)
        .from("calendar_events")
        .update({ has_video: true, video_room: sessionId })
        .eq("id", event.id);

      if (error) {
        console.error("Ошибка обновления события", error);
        toast({ title: "Ошибка", description: "Не удалось обновить событие", variant: "destructive" });
        return;
      }
    }

    await joinSession(sessionId);
  }, [createSession, joinSession, toast]);

  const handleCopyInvite = useCallback(async (sessionId: string | null | undefined) => {
    if (!sessionId) {
      toast({ title: "Недоступно", description: "Сначала запустите видеозвонок", variant: "secondary" });
      return;
    }

    const url = new URL(window.location.origin + "/video-calls");
    url.searchParams.set("session", sessionId);

    try {
      await navigator.clipboard.writeText(url.toString());
      toast({ title: "Скопировано", description: "Ссылка скопирована в буфер обмена" });
    } catch (error) {
      console.error("Ошибка копирования ссылки", error);
      toast({ title: "Ошибка", description: "Не удалось скопировать ссылку", variant: "destructive" });
    }
  }, [toast]);

  const eventsForDay = useCallback((day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    return events.filter((event) => {
      const start = new Date(event.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(event.endDate ?? event.date);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  }, [currentDate, events]);

  const activeDayEvents = dayDialogDate ? eventsForDay(dayDialogDate.getDate()) : [];

  return (
    <div className="space-y-6">
      {session && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Video className="h-5 w-5 text-primary" />
                  {activeEvent?.title ?? "Текущий видеозвонок"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Участники: {participants.length}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => handleCopyInvite(session.id)}
                >
                  <LinkIcon className="h-4 w-4" />
                  Пригласить
                </Button>
                <Button variant="destructive" onClick={leaveSession}>
                  Выйти из звонка
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WebRTCVideoCall />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Календарь</h1>
          <p className="text-muted-foreground">Планирование и события</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать событие
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Редактировать событие" : "Новое событие"}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="event-title">Название события*</Label>
                <Input
                  id="event-title"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-start">Начало*</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-end">Окончание</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Тип события*</Label>
                <Select value={newEventType} onValueChange={setNewEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  rows={3}
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="event-has-video"
                  checked={newEventHasVideo}
                  onCheckedChange={(checked) => setNewEventHasVideo(Boolean(checked))}
                />
                <Label htmlFor="event-has-video" className="text-sm font-medium">
                  Видеоконференция
                </Label>
              </div>
              <div className="flex justify-between gap-2">
                {editingEvent && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDeleteEvent(editingEvent)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </Button>
                )}
                <div className="flex-1" />
                <Button type="submit">{editingEvent ? "Сохранить" : "Создать"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="capitalize">{monthTitle}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(prevMonth(currentDate))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(nextMonth(currentDate))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-semibold">
                {day}
              </div>
            ))}

            {Array.from({ length: monthMeta.startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="p-2" />
            ))}

            {Array.from({ length: monthMeta.daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayEvents = eventsForDay(day);
              const today = new Date();
              const isToday =
                today.getFullYear() === currentDate.getFullYear() &&
                today.getMonth() === currentDate.getMonth() &&
                today.getDate() === day;

              return (
                <div
                  key={day}
                  className={`min-h-[110px] rounded-lg border p-2 transition ${
                    isToday ? "border-primary bg-primary/10" : "border-border"
                  } ${
                    isSelecting &&
                    selectStartRef.current !== null &&
                    selectEnd !== null &&
                    day >= Math.min(selectStartRef.current, selectEnd) &&
                    day <= Math.max(selectStartRef.current, selectEnd)
                      ? "ring-2 ring-primary/40"
                      : ""
                  }`}
                  onMouseDown={() => {
                    setIsSelecting(true);
                    selectStartRef.current = day;
                    setSelectEnd(day);
                  }}
                  onMouseEnter={() => {
                    if (isSelecting) {
                      setSelectEnd(day);
                    }
                  }}
                  onMouseUp={() => {
                    if (isSelecting && selectStartRef.current !== null) {
                      const min = Math.min(selectStartRef.current, day);
                      const max = Math.max(selectStartRef.current, day);
                      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), min, 9, 0, 0);
                      const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), max, 18, 0, 0);
                      setIsSelecting(false);
                      selectStartRef.current = null;
                      setSelectEnd(null);
                      openCreateDialog({ date: start, endDate: end });
                      return;
                    }

                    setIsSelecting(false);
                    selectStartRef.current = null;
                    setSelectEnd(null);

                    if (dayEvents.length === 0) {
                      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 9, 0, 0);
                      openCreateDialog({ date: start });
                    } else {
                      setDayDialogDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                      setDayDialogOpen(true);
                    }
                  }}
                >
                  <div className={`mb-1 text-sm font-semibold ${isToday ? "text-primary" : ""}`}>{day}</div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div key={event.id} className="relative">
                        <Badge
                          variant={event.type === "deadline" ? "destructive" : "secondary"}
                          className="flex w-full cursor-pointer items-center justify-between gap-1 truncate text-xs"
                          onClick={() => {
                            setSelectedEvent(event);
                            setEventDetailsOpen(true);
                          }}
                        >
                          <span className="truncate">{event.title}</span>
                          {event.hasVideo && <Video className="h-3 w-3 text-green-500" />}
                        </Badge>
                        {event.hasVideo && (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -right-1 -top-1 h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinEvent(event);
                            }}
                          >
                            <Users className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
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
            {events.length === 0 && <div className="text-sm text-muted-foreground">Нет событий</div>}
            {events.map((event) => (
              <div key={event.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex w-full flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-3">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateRange(event.date, event.endDate)}
                    </p>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground md:max-w-sm">{event.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {event.hasVideo && (
                    <Button size="sm" variant="secondary" onClick={() => handleJoinEvent(event)}>
                      <Video className="mr-2 h-4 w-4" />
                      {event.videoSessionId ? "Подключиться" : "Начать"}
                    </Button>
                  )}
                  <Badge variant={event.type === "deadline" ? "destructive" : "secondary"}>
                    {EVENT_TYPE_LABELS[event.type] || event.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              События на {dayDialogDate?.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {activeDayEvents.length === 0 && <div className="text-sm text-muted-foreground">Нет событий</div>}
            {activeDayEvents.map((event) => (
              <div key={event.id} className="flex flex-col gap-3 rounded border p-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-sm font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.date.toLocaleString("ru-RU")}
                      {event.endDate ? ` — ${event.endDate.toLocaleString("ru-RU")}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.hasVideo && (
                    <Button size="sm" variant="secondary" onClick={() => handleJoinEvent(event)}>
                      <Video className="mr-1 h-3 w-3" />
                      {event.videoSessionId ? "Подключиться" : "Начать"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => populateFormFromEvent(event)}>
                    <Edit2 className="mr-1 h-3 w-3" />
                    Редактировать
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event)}>
                    <Trash2 className="mr-1 h-3 w-3" />
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
            <Button
              className="w-full"
              onClick={() => {
                if (!dayDialogDate) return;
                openCreateDialog({ date: dayDialogDate });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Создать событие
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EventDetailsDialog
        event={selectedEvent}
        open={eventDetailsOpen}
        onOpenChange={(open) => {
          setEventDetailsOpen(open);
          if (!open) {
            setSelectedEvent(null);
          }
        }}
        onEdit={(event) => {
          setEventDetailsOpen(false);
          setDayDialogOpen(false);
          populateFormFromEvent(event as CalendarEvent);
        }}
        onDelete={(event) => handleDeleteEvent(event as CalendarEvent)}
        onJoin={(event) => handleJoinEvent(event as CalendarEvent)}
        onCopyLink={(event) => handleCopyInvite(event.videoSessionId)}
      />
    </div>
  );
}

function getMonthMeta(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    daysInMonth: lastDay.getDate(),
    startingDayOfWeek: firstDay.getDay(),
  };
}

function prevMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function nextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function isoLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateRange(start: Date, end?: Date) {
  const format = (value: Date) =>
    value.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!end) {
    return format(start);
  }

  return `${format(start)} — ${format(end)}`;
}
