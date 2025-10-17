import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Users, 
  Calendar, 
  Clock, 
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JitsiVideoCall } from "@/components/video/JitsiVideoCall";
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams } from "react-router-dom";
import { useVideoCallRealtime } from '@/providers/VideoCallRealtimeProvider';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  room_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
}

export default function VideoCalls() {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
  });
  const [quickCallAutoJoin, setQuickCallAutoJoin] = useState(false);
  const [pendingQuickRoom, setPendingQuickRoom] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCall: realtimeQuickCall, setActiveCall: setRealtimeActiveCall } = useVideoCallRealtime();

  useEffect(() => {
    loadMeetings();

    // Realtime подписка
    const channel = supabase
      .channel('video_meetings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_meetings' }, () => {
        loadMeetings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const roomParam = searchParams.get('room');
    const autoJoinParam = searchParams.get('autoJoin');
    if (roomParam && autoJoinParam === '1') {
      setPendingQuickRoom(roomParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!pendingQuickRoom) return;
    if (realtimeQuickCall && realtimeQuickCall.room_name === pendingQuickRoom) {
      setActiveCall(realtimeQuickCall.room_name);
      setQuickCallAutoJoin(true);
      const next = new URLSearchParams(searchParams);
      next.delete('autoJoin');
      setSearchParams(next, { replace: true });
      setPendingQuickRoom(null);
    }
  }, [pendingQuickRoom, realtimeQuickCall, searchParams, setSearchParams]);

  useEffect(() => {
    if (!realtimeQuickCall) {
      if (activeCall && activeCall === pendingQuickRoom) {
        setActiveCall(null);
      }
      return;
    }

    if (!pendingQuickRoom && realtimeQuickCall && activeCall === null) {
      setActiveCall(realtimeQuickCall.room_name);
    }
  }, [realtimeQuickCall, pendingQuickRoom, activeCall]);

  const loadMeetings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('video_meetings')
      .select('*')
      .eq('created_by', user.id)
      .order('scheduled_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error loading meetings:', error);
      return;
    }
    setMeetings(data || []);
  };

  const createMeeting = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Ошибка', description: 'Необходимо авторизоваться', variant: 'destructive' });
      return;
    }

    if (!newMeeting.title.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название встречи', variant: 'destructive' });
      return;
    }

    const roomName = `meeting-${Date.now()}`;
    
    const { error } = await (supabase as any)
      .from('video_meetings')
      .insert({
        title: newMeeting.title,
        description: newMeeting.description,
        room_name: roomName,
        scheduled_at: newMeeting.scheduled_at || new Date().toISOString(),
        duration_minutes: newMeeting.duration_minutes,
        status: 'scheduled',
        created_by: user.id,
      });

    if (error) {
      console.error('Error creating meeting:', error);
      toast({ title: 'Ошибка', description: 'Не удалось создать встречу', variant: 'destructive' });
      return;
    }

    toast({ title: 'Успешно', description: 'Встреча создана' });
    setCreateDialogOpen(false);
    setNewMeeting({ title: '', description: '', scheduled_at: '', duration_minutes: 60 });
    loadMeetings();
  };

  const startMeeting = async (meeting: Meeting) => {
    const { error } = await (supabase as any)
      .from('video_meetings')
      .update({ status: 'in-progress' })
      .eq('id', meeting.id);

    if (error) {
      console.error('Error starting meeting:', error);
    }

    setActiveCall(meeting.room_name);
  };

  const endMeeting = async (meetingId: string) => {
    const { error } = await (supabase as any)
      .from('video_meetings')
      .update({ status: 'completed' })
      .eq('id', meetingId);

    if (error) {
      console.error('Error ending meeting:', error);
    }

    setActiveCall(null);
    loadMeetings();
  };

  const deleteMeeting = async (meetingId: string) => {
    const { error } = await (supabase as any)
      .from('video_meetings')
      .delete()
      .eq('id', meetingId);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить встречу', variant: 'destructive' });
      return;
    }

    toast({ title: 'Успешно', description: 'Встреча удалена' });
    loadMeetings();
  };

  const getStatusBadge = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Запланирована</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-green-500"><Play className="h-3 w-3 mr-1" />В процессе</Badge>;
      case 'completed':
        return <Badge variant="outline"><CheckCircle2 className="h-3 w-3 mr-1" />Завершена</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Отменена</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    if (isToday) {
      return `Сегодня ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Завтра ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('ru-RU', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (activeCall) {
    const activeMeeting = meetings.find(m => m.room_name === activeCall);
    const activeQuick = realtimeQuickCall && realtimeQuickCall.room_name === activeCall ? realtimeQuickCall : null;
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Video className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              {activeMeeting?.title || activeQuick?.title || 'Видеозвонок'}
            </h1>
            {(activeMeeting?.description || activeQuick?.room_name) && (
              <p className="text-sm text-muted-foreground mt-1">
                {activeMeeting?.description || `Комната: ${activeQuick?.room_name}`}
              </p>
            )}
          </div>
        </div>

        <JitsiVideoCall 
          roomName={activeQuick?.room_name || activeCall}
          roomUrl={activeQuick?.room_url}
          title={activeMeeting?.title || activeQuick?.title}
          autoJoin={quickCallAutoJoin && !!activeQuick}
          onLeave={() => {
            if (activeMeeting) {
              endMeeting(activeMeeting.id);
            } else {
              setActiveCall(null);
              setQuickCallAutoJoin(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 md:h-8 md:w-8" />
            Видеозвонки
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Создавайте и управляйте видеоконференциями
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Создать встречу
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая видеовстреча</DialogTitle>
              <DialogDescription>
                Создайте видеоконференцию и пригласите участников
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название встречи *</Label>
                <Input
                  id="title"
                  placeholder="Обсуждение проекта"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Краткое описание встречи..."
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Дата и время</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={newMeeting.scheduled_at}
                  onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Длительность (минут)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  value={newMeeting.duration_minutes}
                  onChange={(e) => setNewMeeting({ ...newMeeting, duration_minutes: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={createMeeting}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            <Calendar className="h-4 w-4 mr-2 hidden sm:inline" />
            Предстоящие
          </TabsTrigger>
          <TabsTrigger value="quick">
            <Video className="h-4 w-4 mr-2 hidden sm:inline" />
            Быстрый звонок
          </TabsTrigger>
          <TabsTrigger value="history">
            <CheckCircle2 className="h-4 w-4 mr-2 hidden sm:inline" />
            История
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {meetings.filter(m => m.status === 'scheduled' || m.status === 'in-progress').length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Нет запланированных встреч</p>
                  <p className="text-sm mt-2">Создайте новую видеоконференцию</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {meetings
                .filter(m => m.status === 'scheduled' || m.status === 'in-progress')
                .map((meeting) => (
                  <Card key={meeting.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          {meeting.description && (
                            <CardDescription className="mt-1">
                              {meeting.description}
                            </CardDescription>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {getStatusBadge(meeting.status)}
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {meeting.duration_minutes} мин
                            </Badge>
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(meeting.scheduled_at)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => startMeeting(meeting)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Начать
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMeeting(meeting.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <JitsiVideoCall
            roomName={realtimeQuickCall?.room_name}
            roomUrl={realtimeQuickCall?.room_url}
            title={realtimeQuickCall?.title}
            autoJoin={quickCallAutoJoin && !!realtimeQuickCall}
            onJoin={(room) => {
              setActiveCall(room);
              setQuickCallAutoJoin(false);
            }}
            onLeave={() => {
              setActiveCall(null);
              setQuickCallAutoJoin(false);
              setRealtimeActiveCall(null);
            }}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {meetings.filter(m => m.status === 'completed' || m.status === 'cancelled').length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">История пуста</p>
                  <p className="text-sm mt-2">Завершённые встречи появятся здесь</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {meetings
                .filter(m => m.status === 'completed' || m.status === 'cancelled')
                .map((meeting) => (
                  <Card key={meeting.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          {meeting.description && (
                            <CardDescription className="mt-1">
                              {meeting.description}
                            </CardDescription>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {getStatusBadge(meeting.status)}
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(meeting.scheduled_at)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMeeting(meeting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
