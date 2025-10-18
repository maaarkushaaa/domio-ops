import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WebRTCVideoCall } from "@/components/video/WebRTCVideoCall";
import { useVideoCallRealtime } from "@/providers/VideoCallRealtimeProvider";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Play,
  Plus,
  UserPlus,
  Users,
  Video,
  XCircle,
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  created_by: string;
  session_id: string | null;
}

const STATUS_LABELS: Record<Meeting["status"], string> = {
  scheduled: "Запланирована",
  "in-progress": "В процессе",
  completed: "Завершена",
  cancelled: "Отменена",
};

export default function VideoCalls() {
  const { toast } = useToast();
  const { session, createSession, joinSession, leaveSession, participants } = useVideoCallRealtime();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [inviteDialogMeeting, setInviteDialogMeeting] = useState<Meeting | null>(null);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadMeetings();

    const channel = supabase
      .channel("video_meetings_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_meetings" },
        () => {
          loadMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const sessionParam = searchParams.get("session");
    if (!sessionParam || session?.id === sessionParam) {
      return;
    }

    (async () => {
      setJoining(true);
      try {
        await joinSession(sessionParam);
      } catch (error) {
        console.error("Не удалось подключиться по ссылке", error);
        toast({ title: "Ошибка", description: "Не удалось подключиться к звонку", variant: "destructive" });
      } finally {
        setJoining(false);
        setSearchParams((params) => {
          const next = new URLSearchParams(params);
          next.delete("session");
          return next;
        }, { replace: true });
      }
    })();
  }, [joinSession, searchParams, session, setSearchParams, toast]);

  const loadMeetings = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    const { data, error } = await (supabase as any)
      .from("video_meetings")
      .select("id, title, description, scheduled_at, duration_minutes, status, created_by, session_id")
      .order("scheduled_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Ошибка загрузки встреч", error);
      toast({ title: "Ошибка", description: "Не удалось загрузить список встреч", variant: "destructive" });
      setLoading(false);
      return;
    }

    const filtered = (data ?? []).filter((meeting: Meeting) => {
      if (!userId) return true;
      return meeting.created_by === userId;
    });

    setMeetings(filtered);
    setLoading(false);
  };

  const handleCreateMeeting = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast({ title: "Ошибка", description: "Необходимо авторизоваться", variant: "destructive" });
      return;
    }

    if (!newMeeting.title.trim()) {
      toast({ title: "Ошибка", description: "Введите название встречи", variant: "destructive" });
      return;
    }

    const { error } = await (supabase as any)
      .from("video_meetings")
      .insert({
        title: newMeeting.title.trim(),
        description: newMeeting.description || null,
        scheduled_at: newMeeting.scheduled_at || new Date().toISOString(),
        duration_minutes: newMeeting.duration_minutes,
        status: "scheduled",
        created_by: auth.user.id,
        session_id: null,
      });

    if (error) {
      console.error("Ошибка создания встречи", error);
      toast({ title: "Ошибка", description: "Не удалось создать встречу", variant: "destructive" });
      return;
    }

    toast({ title: "Встреча создана" });
    setCreateDialogOpen(false);
    setNewMeeting({ title: "", description: "", scheduled_at: "", duration_minutes: 60 });
    loadMeetings();
  };

  const handleStartMeeting = async (meeting: Meeting) => {
    const sessionId = await createSession(meeting.title, []);
    if (!sessionId) return;

    const { error } = await (supabase as any)
      .from("video_meetings")
      .update({ status: "in-progress", session_id: sessionId })
      .eq("id", meeting.id);

    if (error) {
      console.error("Ошибка обновления встречи", error);
    }

    await joinSession(sessionId);
  };

  const handleJoinMeeting = async (meeting: Meeting) => {
    if (!meeting.session_id) {
      await handleStartMeeting(meeting);
      return;
    }
    await joinSession(meeting.session_id);
  };

  const handleCompleteMeeting = async (meeting: Meeting) => {
    const { error } = await (supabase as any)
      .from("video_meetings")
      .update({ status: "completed" })
      .eq("id", meeting.id);

    if (error) {
      console.error("Ошибка завершения встречи", error);
      toast({ title: "Ошибка", description: "Не удалось обновить статус", variant: "destructive" });
      return;
    }

    toast({ title: "Встреча завершена" });
    loadMeetings();
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    const { error } = await (supabase as any)
      .from("video_meetings")
      .delete()
      .eq("id", meeting.id);

    if (error) {
      console.error("Ошибка удаления встречи", error);
      toast({ title: "Ошибка", description: "Не удалось удалить встречу", variant: "destructive" });
      return;
    }

    toast({ title: "Встреча удалена" });
    loadMeetings();
  };

  const handleLeaveSession = async () => {
    try {
      await leaveSession();
    } catch (error) {
      console.error("Ошибка выхода из звонка", error);
    }
  };

  const handleCopyInviteLink = async (sessionId: string) => {
    const url = new URL(window.location.origin + "/video-calls");
    url.searchParams.set("session", sessionId);
    try {
      await navigator.clipboard.writeText(url.toString());
      toast({ title: "Ссылка скопирована" });
    } catch (error) {
      console.error("Ошибка копирования ссылки", error);
      toast({ title: "Ошибка", description: "Не удалось скопировать ссылку", variant: "destructive" });
    }
  };

  const handleSendInvite = async () => {
    if (!inviteDialogMeeting?.session_id) {
      toast({ title: "Недоступно", description: "Сначала запустите встречу", variant: "secondary" });
      return;
    }

    if (!inviteeEmail.trim()) {
      toast({ title: "Ошибка", description: "Введите email приглашённого", variant: "destructive" });
      return;
    }

    await supabase.functions.invoke("webpush-send", {
      body: {
        session_id: inviteDialogMeeting.session_id,
        invitees: [inviteeEmail.trim()],
        title: inviteDialogMeeting.title,
      },
    });

    toast({ title: "Приглашение отправлено" });
    setInviteeEmail("");
    setInviteDialogMeeting(null);
  };

  const activeMeeting = useMemo(() => {
    if (!session) return null;
    return meetings.find((meeting) => meeting.session_id === session.id) ?? null;
  }, [meetings, session]);

  const quickStart = async () => {
    const sessionId = await createSession("Мгновенный звонок", []);
    if (!sessionId) return;
    await joinSession(sessionId);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {session && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Video className="h-5 w-5 text-primary" />
                  {session.title}
                </CardTitle>
                <CardDescription>
                  Участников в звонке: {participants.length}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="gap-2" onClick={() => handleCopyInviteLink(session.id)}>
                  <Copy className="h-4 w-4" />
                  Скопировать ссылку
                </Button>
                <Button variant="destructive" onClick={handleLeaveSession}>
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-2">
            <Video className="h-6 w-6 sm:h-8 sm:w-8" />
            Видеозвонки
          </h1>
          <p className="text-sm text-muted-foreground">Планируйте встречи, запускайте мгновенные звонки и управляйте приглашениями</p>
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
              <DialogDescription>Заполните параметры встречи. Видеосессия создаётся при старте.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">Название встречи*</Label>
                <Input
                  id="meeting-title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Обсуждение проекта"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-description">Описание</Label>
                <Textarea
                  id="meeting-description"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Краткий контекст встречи"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Дата и время</Label>
                <Input
                  id="meeting-date"
                  type="datetime-local"
                  value={newMeeting.scheduled_at}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-duration">Длительность (минут)</Label>
                <Input
                  id="meeting-duration"
                  type="number"
                  min={5}
                  max={480}
                  value={newMeeting.duration_minutes}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCreateDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateMeeting}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="meetings" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="meetings" className="flex-1">Мои встречи</TabsTrigger>
          <TabsTrigger value="quick" className="flex-1">Мгновенный звонок</TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка встреч
            </div>
          ) : meetings.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Список пуст</CardTitle>
                <CardDescription>Создайте первую встречу, чтобы запланировать видеозвонок.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать встречу
                </Button>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {format(new Date(meeting.scheduled_at), "dd MMMM yyyy, HH:mm")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {meeting.duration_minutes} мин
                      </span>
                    </CardDescription>
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground">{meeting.description}</p>
                    )}
                  </div>
                  <Badge variant={meeting.status === "in-progress" ? "default" : meeting.status === "scheduled" ? "secondary" : meeting.status === "completed" ? "outline" : "destructive"}>
                    {STATUS_LABELS[meeting.status]}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleJoinMeeting(meeting)} disabled={joining}>
                    <Play className="mr-2 h-4 w-4" />
                    {meeting.session_id ? "Подключиться" : "Начать"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopyInviteLink(meeting.session_id ?? "")}
                    disabled={!meeting.session_id}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Скопировать ссылку
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInviteDialogMeeting(meeting);
                      setInviteeEmail("");
                    }}
                    disabled={!meeting.session_id}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Пригласить
                  </Button>
                  {meeting.status !== "completed" && (
                    <Button size="sm" variant="outline" onClick={() => handleCompleteMeeting(meeting)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Завершить
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteMeeting(meeting)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Удалить
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="quick">
          <Card>
            <CardHeader>
              <CardTitle>Мгновенный звонок</CardTitle>
              <CardDescription>Создайте новую видеосессию и сразу поделитесь ссылкой.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button className="gap-2" onClick={quickStart} disabled={joining}>
                <Video className="h-4 w-4" />
                Запустить звонок
              </Button>
              <p className="text-sm text-muted-foreground">
                Ссылка будет доступна после подключения. Используйте панель выше для копирования и приглашения участников.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!inviteDialogMeeting} onOpenChange={(open) => !open && setInviteDialogMeeting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить участника</DialogTitle>
            <DialogDescription>
              Отправьте приглашение на встречу «{inviteDialogMeeting?.title}». Ссылка будет содержать автоматическое подключение.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email участника</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteeEmail}
                onChange={(e) => setInviteeEmail(e.target.value)}
              />
            </div>
            <Button type="button" onClick={handleSendInvite} disabled={!inviteDialogMeeting?.session_id}>
              Отправить приглашение
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
