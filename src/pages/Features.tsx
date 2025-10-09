import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PushNotifications } from "@/components/notifications/PushNotifications";
import { DragDropZone } from "@/components/files/DragDropZone";
import { QRCodeGenerator } from "@/components/qr/QRCodeGenerator";
import { Achievements } from "@/components/gamification/Achievements";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { IntegrationHub } from "@/components/integrations/IntegrationHub";
import { VideoCallWidget } from "@/components/modern/VideoCallWidget";
import { TimeTracker } from "@/components/modern/TimeTracker";
import { SmartSearch } from "@/components/modern/SmartSearch";
import { CollaborativeWhiteboard } from "@/components/modern/CollaborativeWhiteboard";
import { BiometricAuth } from "@/components/modern/BiometricAuth";
import { BlockchainContracts } from "@/components/modern/BlockchainContracts";
import { ARViewer } from "@/components/modern/ARViewer";
import { AIAutomation } from "@/components/modern/AIAutomation";
import { DigitalSignature } from "@/components/modern/DigitalSignature";
import { KanbanAutomation } from "@/components/modern/KanbanAutomation";
import { AIAssistantPanel } from "@/components/modern/AIAssistantPanel";
import { DocumentVersioning } from "@/components/modern/DocumentVersioning";
import { OneCIntegration } from "@/components/modern/OneCIntegration";
import { APIManagement } from "@/components/modern/APIManagement";
import { AdvancedAnalytics } from "@/components/modern/AdvancedAnalytics";
import { WebRTCVideoCall } from "@/components/modern/WebRTCVideoCall";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { InteractiveTour } from "@/components/onboarding/InteractiveTour";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { PWAManager } from "@/components/pwa/PWAManager";
import { AdvancedSearch } from "@/components/search/AdvancedSearch";
import { Blockchain } from "@/components/modern/Blockchain";
import { MachineLearning } from "@/components/modern/MachineLearning";
import { SupplyChain } from "@/components/modern/SupplyChain";
import { CustomerPortal } from "@/components/modern/CustomerPortal";
import { QualityControl } from "@/components/modern/QualityControl";
import { InventoryTracking } from "@/components/modern/InventoryTracking";
import { TeamAnalytics } from "@/components/modern/TeamAnalytics";
import { GoalsKPI } from "@/components/modern/GoalsKPI";
import { AutomatedMarketing } from "@/components/modern/AutomatedMarketing";
import { SystemMonitoring } from "@/components/modern/SystemMonitoring";
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
  Wifi,
  Clock,
  Search,
  Palette,
  Fingerprint,
  Link2,
  Eye,
  PenTool,
  Workflow
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Features() {
  const { toast } = useToast();
  const [voiceText, setVoiceText] = useState('');
  const [showTour, setShowTour] = useState(false);

  const handleTourComplete = () => {
    setShowTour(false);
    toast({
      title: 'Тур завершен',
      description: 'Теперь вы знаете все основные возможности системы!',
    });
  };

  return (
    <div className="space-y-6">
      {showTour && <InteractiveTour onComplete={handleTourComplete} />}
      
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Современные функции</h1>
            <p className="text-muted-foreground">Инновационные инструменты для эффективной работы</p>
          </div>
          <Button onClick={() => setShowTour(true)} variant="outline">
            Начать тур
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-1">
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Уведомления</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            <Upload className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Файлы</span>
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-xs">
            <QrCode className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">QR</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs">
            <Trophy className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Достижения</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="text-xs">
            <Mic className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Голос</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">
            <Zap className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Интеграции</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Продвинутые</span>
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

        <TabsContent value="advanced" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <NotificationCenter />
            <ReportBuilder />
            <PWAManager />
            <AdvancedSearch />
            <WorkflowBuilder />
            <OneCIntegration />
            <APIManagement />
            <AdvancedAnalytics />
            <WebRTCVideoCall />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AIAssistantPanel />
            <VideoCallWidget />
            <TimeTracker />
            <SmartSearch />
            <DocumentVersioning />
            <CollaborativeWhiteboard />
            <BiometricAuth />
            <BlockchainContracts />
            <ARViewer />
            <AIAutomation />
            <DigitalSignature />
            <KanbanAutomation />
            <Blockchain />
            <MachineLearning />
            <SupplyChain />
            <CustomerPortal />
            <QualityControl />
            <InventoryTracking />
            <TeamAnalytics />
            <GoalsKPI />
            <AutomatedMarketing />
            <SystemMonitoring />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
