import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Phone, 
  Users, 
  Calendar, 
  Clock, 
  Plus,
  Settings,
  Monitor,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  ScreenShare,
  MessageSquare
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { WebRTCVideoCall } from "@/components/modern/WebRTCVideoCall";
import { VideoConferencing } from "@/components/modern/VideoConferencing";

interface Meeting {
  id: number;
  title: string;
  participants: string[];
  time: string;
  duration: string;
  status: 'upcoming' | 'in-progress' | 'completed';
}

const mockMeetings: Meeting[] = [
  {
    id: 1,
    title: "Обсуждение проекта кухни",
    participants: ["Иван П.", "Мария С.", "Алексей К."],
    time: "Сегодня 14:00",
    duration: "45 мин",
    status: "upcoming"
  },
  {
    id: 2,
    title: "Планерка по производству",
    participants: ["Команда производства"],
    time: "Сегодня 10:00",
    duration: "1 час",
    status: "completed"
  },
  {
    id: 3,
    title: "Созвон с клиентом",
    participants: ["Петр В.", "Клиент"],
    time: "Завтра 11:30",
    duration: "30 мин",
    status: "upcoming"
  }
];

export default function VideoCalls() {
  const { toast } = useToast();
  const [meetingLink, setMeetingLink] = useState("");
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const handleStartCall = () => {
    setInCall(true);
    toast({
      title: "Звонок начат",
      description: "Подключение к видеоконференции..."
    });
  };

  const handleEndCall = () => {
    setInCall(false);
    toast({
      title: "Звонок завершен",
      description: "Вы покинули видеоконференцию"
    });
  };

  const handleJoinMeeting = () => {
    if (!meetingLink) {
      toast({
        title: "Ошибка",
        description: "Введите ссылку на встречу",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Подключение",
      description: "Подключение к встрече..."
    });
  };

  const getStatusBadge = (status: Meeting['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Предстоит</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">В процессе</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-muted-foreground/10 text-muted-foreground">Завершена</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Видеозвонки</h1>
        <p className="text-muted-foreground">Встроенная система видеоконференций</p>
      </div>

      {inCall ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            {/* Video Call Interface */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20" />
              <div className="relative text-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-gradient-primary mx-auto flex items-center justify-center">
                  <Users className="w-16 h-16 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-2xl font-bold">Видеозвонок активен</h3>
                  <p className="text-white/80">3 участника</p>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <Button
                  size="lg"
                  variant={isMuted ? "destructive" : "secondary"}
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-full w-14 h-14"
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                
                <Button
                  size="lg"
                  variant={isVideoOff ? "destructive" : "secondary"}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className="rounded-full w-14 h-14"
                >
                  {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>

                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full w-14 h-14"
                >
                  <ScreenShare className="h-6 w-6" />
                </Button>

                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full w-14 h-14"
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleEndCall}
                  className="rounded-full w-14 h-14"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="quick" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Быстрый звонок</TabsTrigger>
            <TabsTrigger value="scheduled">Запланированные</TabsTrigger>
            <TabsTrigger value="advanced">Продвинутые</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Создать встречу
                  </CardTitle>
                  <CardDescription>
                    Начните мгновенный видеозвонок
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleStartCall} className="w-full" size="lg">
                    <Video className="h-5 w-5 mr-2" />
                    Начать звонок
                  </Button>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Возможности:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• HD видео и аудио</li>
                      <li>• До 100 участников</li>
                      <li>• Демонстрация экрана</li>
                      <li>• Запись встречи</li>
                      <li>• Виртуальный фон</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Присоединиться к встрече
                  </CardTitle>
                  <CardDescription>
                    Введите ID или ссылку на встречу
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Вставьте ссылку на встречу..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                  <Button onClick={handleJoinMeeting} variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Присоединиться
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ваши встречи</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Запланировать
              </Button>
            </div>

            <div className="grid gap-4">
              {mockMeetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{meeting.title}</h4>
                          {getStatusBadge(meeting.status)}
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {meeting.time} • {meeting.duration}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {meeting.participants.join(", ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {meeting.status === 'upcoming' && (
                          <Button onClick={handleStartCall}>
                            <Video className="h-4 w-4 mr-2" />
                            Начать
                          </Button>
                        )}
                        <Button variant="outline" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <WebRTCVideoCall />
              <VideoConferencing />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
