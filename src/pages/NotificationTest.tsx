import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationTester } from '@/components/ui/NotificationContainer';
import { useNotifications } from '@/hooks/use-notifications';
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
  const { addNotification, notifications, settings } = useNotifications();

  // Отладочная информация
  console.log('NotificationTestPage render:', { 
    notifications: notifications.length,
    settings: settings,
    addNotification: typeof addNotification 
  });

  // Простая функция для тестирования
  const testNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`Testing ${type} notification...`);
    try {
      addNotification({
        type,
        title: `Тест ${type}`,
        message: `Это тестовое уведомление типа ${type}`,
        sound: true
      });
      console.log(`${type} notification added successfully`);
    } catch (error) {
      console.error(`Error adding ${type} notification:`, error);
    }
  };

  const testScenarios = [
    {
      title: 'Успешное уведомление',
      description: 'Тест успешного уведомления',
      icon: CheckCircle,
      action: () => testNotification('success'),
      color: 'bg-green-500'
    },
    {
      title: 'Ошибка',
      description: 'Тест уведомления об ошибке',
      icon: XCircle,
      action: () => testNotification('error'),
      color: 'bg-red-500'
    },
    {
      title: 'Предупреждение',
      description: 'Тест предупреждающего уведомления',
      icon: AlertTriangle,
      action: () => testNotification('warning'),
      color: 'bg-yellow-500'
    },
    {
      title: 'Информация',
      description: 'Тест информационного уведомления',
      icon: Info,
      action: () => testNotification('info'),
      color: 'bg-blue-500'
    },
    {
      title: 'Создание изделия',
      description: 'Тест оповещения о создании нового изделия',
      icon: Package,
      action: () => addNotification({
        type: 'success',
        title: 'Изделие создано',
        message: 'Тестовое изделие успешно создано',
        sound: true
      }),
      color: 'bg-green-500'
    },
    {
      title: 'Обновление изделия',
      description: 'Тест оповещения об обновлении изделия',
      icon: CheckCircle,
      action: () => addNotification({
        type: 'info',
        title: 'Изделие обновлено',
        message: 'Тестовое изделие успешно обновлено',
        sound: true
      }),
      color: 'bg-blue-500'
    },
    {
      title: 'Удаление изделия',
      description: 'Тест оповещения об удалении изделия',
      icon: XCircle,
      action: () => addNotification({
        type: 'warning',
        title: 'Изделие удалено',
        message: 'Тестовое изделие было удалено',
        sound: true
      }),
      color: 'bg-red-500'
    },
    {
      title: 'Добавление материала',
      description: 'Тест оповещения о добавлении материала',
      icon: Package,
      action: () => addNotification({
        type: 'success',
        title: 'Материал добавлен',
        message: 'EGGER H1137 ST9 Дуб Галифакс белый добавлен в базу',
        sound: true
      }),
      color: 'bg-green-500'
    },
    {
      title: 'Обновление остатков',
      description: 'Тест оповещения об обновлении остатков материала',
      icon: CheckCircle,
      action: () => addNotification({
        type: 'info',
        title: 'Остатки обновлены',
        message: 'Остатки материала EGGER H1137 ST9 обновлены',
        sound: true
      }),
      color: 'bg-blue-500'
    },
    {
      title: 'Начало проверки',
      description: 'Тест оповещения о начале проверки качества',
      icon: Info,
      action: () => addNotification({
        type: 'info',
        title: 'Проверка начата',
        message: 'Начата проверка качества для Тестовое изделие',
        sound: true
      }),
      color: 'bg-blue-500'
    },
    {
      title: 'Проверка пройдена',
      description: 'Тест оповещения о прохождении проверки',
      icon: CheckCircle,
      action: () => addNotification({
        type: 'success',
        title: 'Проверка пройдена',
        message: 'Проверка качества пройдена успешно (95%)',
        sound: true
      }),
      color: 'bg-green-500'
    },
    {
      title: 'Проверка не пройдена',
      description: 'Тест оповещения о непрохождении проверки',
      icon: XCircle,
      action: () => addNotification({
        type: 'error',
        title: 'Проверка не пройдена',
        message: 'Проверка качества не пройдена (45%)',
        sound: true
      }),
      color: 'bg-red-500'
    },
    {
      title: 'CSV импорт успешен',
      description: 'Тест оповещения об успешном импорте CSV',
      icon: Upload,
      action: () => addNotification({
        type: 'success',
        title: 'CSV импорт завершен',
        message: 'Успешно импортировано 15 записей материалов',
        sound: true
      }),
      color: 'bg-green-500'
    },
    {
      title: 'CSV импорт с ошибками',
      description: 'Тест оповещения об импорте CSV с ошибками',
      icon: Upload,
      action: () => addNotification({
        type: 'warning',
        title: 'CSV импорт завершен с ошибками',
        message: 'Импортировано 10 записей, 3 ошибки',
        sound: true
      }),
      color: 'bg-yellow-500'
    },
    {
      title: 'Обновление прогресса',
      description: 'Тест оповещения об обновлении прогресса',
      icon: Settings,
      action: () => addNotification({
        type: 'info',
        title: 'Прогресс обновлен',
        message: 'Прогресс изделия обновлен до 75%',
        sound: true
      }),
      color: 'bg-blue-500'
    },
    {
      title: 'Низкие остатки',
      description: 'Тест оповещения о низких остатках',
      icon: AlertTriangle,
      action: () => addNotification({
        type: 'warning',
        title: 'Низкие остатки',
        message: 'У материала EGGER H1137 ST9 осталось менее 10 единиц',
        sound: true
      }),
      color: 'bg-yellow-500'
    },
    {
      title: 'Приближается дедлайн',
      description: 'Тест оповещения о приближающемся дедлайне',
      icon: Bell,
      action: () => addNotification({
        type: 'warning',
        title: 'Приближается дедлайн',
        message: 'До завершения изделия осталось 2 дня',
        sound: true
      }),
      color: 'bg-yellow-500'
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              onClick={() => testNotification('success')}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Тест успеха
            </Button>
            <Button 
              onClick={() => testNotification('error')}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Тест ошибки
            </Button>
            <Button 
              onClick={() => testNotification('warning')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Тест предупреждения
            </Button>
            <Button 
              onClick={() => testNotification('info')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Тест информации
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            <p>Активных уведомлений: {notifications.length}</p>
            <p>Уведомления: {settings.enabled ? 'Включены' : 'Отключены'}</p>
          </div>
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