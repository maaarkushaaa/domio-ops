import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PushNotifications } from "@/components/notifications/PushNotifications";
import { DragDropZone } from "@/components/files/DragDropZone";
import { QRCodeGenerator } from "@/components/qr/QRCodeGenerator";
import { Achievements } from "@/components/gamification/Achievements";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { IntegrationHub } from "@/components/integrations/IntegrationHub";
import { 
  Bell, 
  Upload, 
  QrCode, 
  Trophy, 
  Mic, 
  Languages,
  Zap,
  TrendingUp,
  Video,
  Wifi
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Features() {
  const { toast } = useToast();
  const [voiceText, setVoiceText] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Современные функции</h1>
        <p className="text-muted-foreground">Инновационные инструменты для эффективной работы</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Уведомления</span>
          </TabsTrigger>
          <TabsTrigger value="files">
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Файлы</span>
          </TabsTrigger>
          <TabsTrigger value="qr">
            <QrCode className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">QR</span>
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Достижения</span>
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Голос</span>
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Zap className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Интеграции</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push-уведомления
              </CardTitle>
              <CardDescription>
                Получайте мгновенные уведомления о важных событиях прямо в браузере
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PushNotifications />
              <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Возможности:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Уведомления о новых задачах и дедлайнах</li>
                  <li>• Оповещения о статусе заказов</li>
                  <li>• Напоминания о совещаниях</li>
                  <li>• Критические обновления проектов</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Drag & Drop загрузка файлов
              </CardTitle>
              <CardDescription>
                Перетаскивайте файлы прямо в карточки проектов и задач
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropZone onFilesAdded={(files) => {
                toast({
                  title: 'Файлы обработаны',
                  description: `Загружено ${files.length} файлов`,
                });
              }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR-коды для проектов
              </CardTitle>
              <CardDescription>
                Создавайте QR-коды для быстрого доступа к проектам и документам
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <QRCodeGenerator projectId="demo-1" projectName="Шкаф Версаль" />
                <QRCodeGenerator projectId="demo-2" projectName="Стол Модерн" />
                <QRCodeGenerator projectId="demo-3" projectName="Комод Классик" />
              </div>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Применение:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Быстрый доступ к проектам на производстве</li>
                  <li>• Маркировка изделий и материалов</li>
                  <li>• Передача ссылок клиентам</li>
                  <li>• Инвентаризация склада</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Achievements />
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Голосовой ввод
              </CardTitle>
              <CardDescription>
                Создавайте задачи и заметки с помощью голоса
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <VoiceInput onTranscript={(text) => {
                  setVoiceText(text);
                  toast({
                    title: 'Текст распознан',
                    description: text,
                  });
                }} />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Нажмите на микрофон и начните говорить
                  </p>
                </div>
              </div>
              {voiceText && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Распознанный текст:</p>
                  <p className="text-sm">{voiceText}</p>
                </div>
              )}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Возможности:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Быстрое создание задач</li>
                  <li>• Голосовые заметки к проектам</li>
                  <li>• Диктовка описаний и комментариев</li>
                  <li>• Поддержка русского языка</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationHub />
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Предиктивная аналитика (AI)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Прогноз сроков завершения проектов</p>
                <p>• Анализ бюджетных трендов</p>
                <p>• Рекомендации по оптимизации</p>
                <p>• Предсказание узких мест</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Видеозвонки (WebRTC)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Встроенные видеоконференции</p>
                <p>• Звонки прямо из задач</p>
                <p>• Демонстрация экрана</p>
                <p>• Запись встреч</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-primary" />
                  Real-time обновления
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Живое обновление данных</p>
                <p>• Синхронизация между устройствами</p>
                <p>• Видимость действий команды</p>
                <p>• WebSocket подключения</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  Мультиязычность
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageSwitcher />
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>• 6 языков интерфейса</p>
                  <p>• Автоопределение языка</p>
                  <p>• Локализация дат и чисел</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
