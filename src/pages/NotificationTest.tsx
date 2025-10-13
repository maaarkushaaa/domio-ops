import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationTester } from '@/components/ui/NotificationContainer';
import { useAppNotifications } from '@/components/NotificationIntegration';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Upload,
  Download,
  Settings,
  Bell
} from 'lucide-react';

export function NotificationTestPage() {
  const {
    notifyProductCreated,
    notifyProductUpdated,
    notifyProductDeleted,
    notifyMaterialAdded,
    notifyMaterialUpdated,
    notifyInspectionStarted,
    notifyInspectionCompleted,
    notifyCSVImport,
    notifyProgressUpdated,
    notifyLowStock,
    notifyDeadlineApproaching
  } = useAppNotifications();

  const testScenarios = [
    {
      title: 'Создание изделия',
      description: 'Тест оповещения о создании нового изделия',
      icon: Package,
      action: () => notifyProductCreated('Тестовое изделие'),
      color: 'bg-green-500'
    },
    {
      title: 'Обновление изделия',
      description: 'Тест оповещения об обновлении изделия',
      icon: CheckCircle,
      action: () => notifyProductUpdated('Тестовое изделие'),
      color: 'bg-blue-500'
    },
    {
      title: 'Удаление изделия',
      description: 'Тест оповещения об удалении изделия',
      icon: XCircle,
      action: () => notifyProductDeleted('Тестовое изделие'),
      color: 'bg-red-500'
    },
    {
      title: 'Добавление материала',
      description: 'Тест оповещения о добавлении материала',
      icon: Package,
      action: () => notifyMaterialAdded('EGGER H1137 ST9 Дуб Галифакс белый'),
      color: 'bg-green-500'
    },
    {
      title: 'Обновление остатков',
      description: 'Тест оповещения об обновлении остатков материала',
      icon: CheckCircle,
      action: () => notifyMaterialUpdated('EGGER H1137 ST9 Дуб Галифакс белый'),
      color: 'bg-blue-500'
    },
    {
      title: 'Начало проверки',
      description: 'Тест оповещения о начале проверки качества',
      icon: Info,
      action: () => notifyInspectionStarted('Тестовое изделие', 'Стандартная проверка мебели'),
      color: 'bg-blue-500'
    },
    {
      title: 'Проверка пройдена',
      description: 'Тест оповещения о прохождении проверки',
      icon: CheckCircle,
      action: () => notifyInspectionCompleted('Тестовое изделие', 'passed', 95),
      color: 'bg-green-500'
    },
    {
      title: 'Проверка не пройдена',
      description: 'Тест оповещения о непрохождении проверки',
      icon: XCircle,
      action: () => notifyInspectionCompleted('Тестовое изделие', 'failed', 45),
      color: 'bg-red-500'
    },
    {
      title: 'CSV импорт успешен',
      description: 'Тест оповещения об успешном импорте CSV',
      icon: Upload,
      action: () => notifyCSVImport('materials', 15, 0),
      color: 'bg-green-500'
    },
    {
      title: 'CSV импорт с ошибками',
      description: 'Тест оповещения об импорте CSV с ошибками',
      icon: AlertTriangle,
      action: () => notifyCSVImport('bom', 10, 3),
      color: 'bg-yellow-500'
    },
    {
      title: 'Изделие готово',
      description: 'Тест оповещения о готовности изделия',
      icon: CheckCircle,
      action: () => notifyProgressUpdated('Тестовое изделие', 100),
      color: 'bg-green-500'
    },
    {
      title: 'Низкий остаток',
      description: 'Тест оповещения о низком остатке материала',
      icon: AlertTriangle,
      action: () => notifyLowStock('EGGER H1137 ST9 Дуб Галифакс белый', 5, 10),
      color: 'bg-yellow-500'
    },
    {
      title: 'Приближается срок',
      description: 'Тест оповещения о приближающемся сроке',
      icon: AlertTriangle,
      action: () => notifyDeadlineApproaching('Тестовое изделие', 2),
      color: 'bg-yellow-500'
    },
    {
      title: 'Срок просрочен',
      description: 'Тест оповещения о просроченном сроке',
      icon: XCircle,
      action: () => notifyDeadlineApproaching('Тестовое изделие', -1),
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Тестирование системы оповещений
          </h1>
          <p className="text-muted-foreground mt-2">
            Проверьте работу системы оповещений с различными сценариями
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Система активна
        </Badge>
      </div>

      {/* Базовые тесты */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Базовые тесты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationTester />
        </CardContent>
      </Card>

      {/* Сценарии оповещений */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testScenarios.map((scenario, index) => {
          const Icon = scenario.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${scenario.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {scenario.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {scenario.description}
                </p>
                <Button 
                  onClick={scenario.action}
                  className="w-full"
                  variant="outline"
                >
                  Тестировать
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Информация о системе */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о системе оповещений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Возможности:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Звуковые уведомления для разных типов событий</li>
                <li>• Desktop уведомления браузера</li>
                <li>• Настраиваемая позиция и длительность</li>
                <li>• Действия в уведомлениях</li>
                <li>• Автоматическое закрытие</li>
                <li>• Персистентные уведомления для ошибок</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Типы оповещений:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <Badge variant="outline" className="text-green-600">Успех</Badge> - зеленые с мелодичным звуком</li>
                <li>• <Badge variant="outline" className="text-red-600">Ошибка</Badge> - красные с тревожным звуком</li>
                <li>• <Badge variant="outline" className="text-yellow-600">Предупреждение</Badge> - желтые с предупреждающим звуком</li>
                <li>• <Badge variant="outline" className="text-blue-600">Информация</Badge> - синие без звука</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
