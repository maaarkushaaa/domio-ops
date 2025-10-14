import { useAuth } from '@/hooks/use-auth';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Package, 
  DollarSign, 
  FolderKanban, 
  UserCircle, 
  TrendingUp,
  Activity,
  Shield,
  Database,
  Settings,
  Trash2
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { UserCreateDialog } from '@/components/admin/UserCreateDialog';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Admin() {
  const { user } = useAuth();
  const { tasks, projects, clients, products, financialOperations, suppliers } = useApp();
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string; created_at: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Load users list from Supabase (profiles + user_roles)
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        // Load profiles
        const { data: profiles, error: profilesError } = await (supabase as any)
          .from('profiles')
          .select('id, email, full_name, created_at');
        if (profilesError) throw profilesError;

        // Load roles
        const { data: roles, error: rolesError } = await (supabase as any)
          .from('user_roles')
          .select('user_id, role');
        if (rolesError) throw rolesError;

        const userIdToRole = new Map<string, string>();
        (roles || []).forEach((r: any) => userIdToRole.set(r.user_id, r.role));

        const merged = (profiles || []).map((p: any) => ({
          id: p.id,
          name: p.full_name || (p.email ? String(p.email).split('@')[0] : ''),
          email: p.email || '',
          role: userIdToRole.get(p.id) || 'user',
          created_at: p.created_at,
        }));
        setUsers(merged);
      } catch (e) {
        console.error('Failed to load users:', e);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Функция удаления пользователя
  const deleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Не авторизован');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при удалении пользователя');
      }

      // Обновляем список пользователей
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('Пользователь успешно удален');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Ошибка при удалении пользователя: ' + (error as Error).message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const totalUsers = useMemo(() => users.length || 0, [users]);

  const stats = [
    {
      title: 'Всего пользователей',
      value: String(totalUsers),
      icon: Users,
      trend: '+100%',
      color: 'text-blue-500'
    },
    {
      title: 'Активные проекты',
      value: projects.filter(p => p.status === 'active').length.toString(),
      icon: FolderKanban,
      trend: `${projects.length} всего`,
      color: 'text-green-500'
    },
    {
      title: 'Финансовые операции',
      value: financialOperations.length.toString(),
      icon: DollarSign,
      trend: `${financialOperations.reduce((acc, op) => acc + (op.type === 'income' ? op.amount : -op.amount), 0).toLocaleString('ru-RU')} ₽`,
      color: 'text-yellow-500'
    },
    {
      title: 'Продукты в работе',
      value: products.filter(p => p.status === 'in_progress').length.toString(),
      icon: Package,
      trend: `${products.length} всего`,
      color: 'text-purple-500'
    }
  ];

  const systemInfo = [
    { label: 'Задачи', value: tasks.length, status: 'active' },
    { label: 'Клиенты', value: clients.length, status: 'active' },
    { label: 'Поставщики', value: suppliers.length, status: 'active' },
    { label: 'Хранилище', value: 'LocalStorage', status: 'active' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Админ панель
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление системой DOMIO Ops
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-sm">
          <Shield className="h-4 w-4 mr-2" />
          Администратор: {user.name}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-card hover-lift animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="h-4 w-4 mr-2" />
            Система
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Последние задачи</CardTitle>
                <CardDescription>Активность в системе</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-lift cursor-pointer transition-colors"
                      onClick={() => window.location.href = '/tasks'}
                    >
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.status}
                        </p>
                      </div>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Финансовая сводка</CardTitle>
                <CardDescription>Денежные потоки</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialOperations.slice(0, 5).map((op) => (
                    <div 
                      key={op.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-lift cursor-pointer transition-colors"
                      onClick={() => window.location.href = '/finance'}
                    >
                      <div>
                        <p className="font-medium">{op.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(op.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <Badge variant={op.type === 'income' ? 'default' : 'outline'}>
                        {op.type === 'income' ? '+' : '-'}{op.amount.toLocaleString('ru-RU')} {op.currency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Управление пользователями</CardTitle>
                <CardDescription>Список всех пользователей системы</CardDescription>
              </div>
              <UserCreateDialog />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers && (
                    <TableRow>
                      <TableCell colSpan={6}>Загрузка пользователей...</TableCell>
                    </TableRow>
                  )}
                  {!loadingUsers && users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>Пользователи не найдены</TableCell>
                    </TableRow>
                  )}
                  {!loadingUsers && users.map((u) => (
                    <TableRow key={u.id} className="hover-lift transition-colors">
                      <TableCell className="font-mono text-xs">{u.id}</TableCell>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>
                          <Shield className="h-3 w-3 mr-1" />
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUser(u.id);
                          }}
                          disabled={deletingUserId === u.id || u.id === user?.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Информация о системе</CardTitle>
              <CardDescription>Статус компонентов и ресурсов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemInfo.map((info, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover-lift cursor-pointer transition-colors"
                    onClick={() => {
                      if (info.label === 'Задачи') window.location.href = '/tasks';
                      if (info.label === 'Клиенты') window.location.href = '/clients';
                      if (info.label === 'Поставщики') window.location.href = '/procurement';
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{info.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {typeof info.value === 'number' ? `${info.value} записей` : info.value}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      {info.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Системные настройки</CardTitle>
              <CardDescription>Конфигурация приложения</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Хранилище данных</p>
                    <p className="text-sm text-muted-foreground">LocalStorage (браузер)</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Очистить кеш
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Режим разработки</p>
                    <p className="text-sm text-muted-foreground">Активен</p>
                  </div>
                  <Badge variant="outline">DEV</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Версия приложения</p>
                    <p className="text-sm text-muted-foreground">1.0.0</p>
                  </div>
                  <Badge variant="outline">STABLE</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
