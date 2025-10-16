import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Search, Phone, Mail, Building, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'archived';
  contact_person?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ClientManagementProps {
  clients?: Client[];
  onRefresh?: () => void;
}

export function ClientManagement({ clients: initialClients = [], onRefresh }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [filteredClients, setFilteredClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Форма нового/редактируемого клиента
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'active' as Client['status'],
    contact_person: '',
    notes: ''
  });

  useEffect(() => {
    if (initialClients.length === 0) {
      loadClients();
    }
  }, [initialClients]);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить клиентов',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Поиск
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      status: 'active',
      contact_person: '',
      notes: ''
    });
    setSelectedClient(null);
    setIsEditing(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setFormData({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      status: client.status,
      contact_person: client.contact_person || '',
      notes: client.notes || ''
    });
    setSelectedClient(client);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название клиента обязательно',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      if (isEditing && selectedClient) {
        // Обновление клиента
        const { error } = await (supabase as any)
          .from('clients')
          .update({
            name: formData.name,
            company: formData.company || null,
            email: formData.email || null,
            phone: formData.phone || null,
            status: formData.status,
            contact_person: formData.contact_person || null,
            notes: formData.notes || null
          })
          .eq('id', selectedClient.id);

        if (error) throw error;

        toast({
          title: 'Успешно',
          description: 'Клиент обновлен'
        });

        // Обновляем локальный state
        setClients(prev => prev.map(c =>
          c.id === selectedClient.id
            ? { ...c, ...formData }
            : c
        ));
      } else {
        // Создание нового клиента
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await (supabase as any)
          .from('clients')
          .insert({
            name: formData.name,
            company: formData.company || null,
            email: formData.email || null,
            phone: formData.phone || null,
            status: formData.status,
            contact_person: formData.contact_person || null,
            notes: formData.notes || null,
            created_by: userData.user?.id
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Успешно',
          description: 'Клиент создан'
        });

        // Добавляем в локальный state
        setClients(prev => [data, ...prev]);
      }

      setDialogOpen(false);
      resetForm();
      onRefresh?.();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить клиента',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Клиент удален'
      });

      // Удаляем из локального state
      setClients(prev => prev.filter(c => c.id !== clientId));
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить клиента',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Активный</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800">Неактивный</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Архивирован</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Управление клиентами
            </CardTitle>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить клиента
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Фильтры */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск клиентов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="inactive">Неактивные</SelectItem>
                <SelectItem value="archived">Архивированные</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Список клиентов */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{client.name}</h3>
                        {client.company && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {client.company}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(client.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      {client.contact_person && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{client.contact_person}</span>
                        </div>
                      )}

                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                            {client.email}
                          </a>
                        </div>
                      )}

                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                            {client.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {client.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {client.notes}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(client)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Редактировать
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Удалить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Это действие нельзя отменить. Клиент "{client.name}" будет удален навсегда.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(client.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Клиенты не найдены</p>
              <p className="text-sm">Попробуйте изменить фильтры или добавьте нового клиента</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог создания/редактирования клиента */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Редактировать клиента' : 'Новый клиент'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название клиента *</Label>
              <Input
                id="name"
                placeholder="Название компании или ФИО"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Компания</Label>
              <Input
                id="company"
                placeholder="Название компании"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  placeholder="+7 (999) 123-45-67"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Контактное лицо</Label>
              <Input
                id="contact_person"
                placeholder="ФИО контактного лица"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={formData.status} onValueChange={(value: Client['status']) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активный</SelectItem>
                  <SelectItem value="inactive">Неактивный</SelectItem>
                  <SelectItem value="archived">Архивирован</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                placeholder="Дополнительная информация о клиенте"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Отмена
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
