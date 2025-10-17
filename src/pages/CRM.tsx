import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, DollarSign, Target, Plus, Calendar, User, Eye, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientManagement } from '@/components/crm/ClientManagement';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Deal {
  id: string;
  title: string;
  amount: number;
  probability: number;
  status: string;
  expected_close_date: string | null;
  client: { name: string; company: string };
  stage: { name: string; color: string; order_index: number };
  owner_id?: string;
  owner?: { full_name: string } | null;
  client_id: string;
  stage_id: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SalesStage {
  id: string;
  name: string;
  order_index: number;
  probability: number;
  color: string;
  deals?: Deal[];
}

export default function CRM() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<SalesStage[]>([]);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [isDealDialogOpen, setDealDialogOpen] = useState(false);
  const [isEditingDeal, setIsEditingDeal] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [viewDeal, setViewDeal] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [isDeletingDeal, setIsDeletingDeal] = useState(false);
  const [newDealData, setNewDealData] = useState({
    title: '',
    amount: '',
    probability: 50,
    clientId: '',
    stageId: '',
    ownerId: '',
    expectedCloseDate: '',
    description: '',
    status: 'open'
  });
  const [isSavingDeal, setIsSavingDeal] = useState(false);
  const [clientsOptions, setClientsOptions] = useState<Array<{ id: string; name: string; company?: string }>>([]);
  const [ownersOptions, setOwnersOptions] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadStages();
    loadDeals();
    loadSupportLists();

    // Realtime подписка
    const dealsChannel = supabase
      .channel('deals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        loadDeals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dealsChannel);
    };
  }, []);

  const loadStages = async () => {
    const { data, error } = await (supabase as any)
      .from('sales_stages')
      .select('*')
      .eq('is_lost', false)
      .order('order_index');

    if (error) {
      console.error('Error loading stages:', error);
      return;
    }
    setStages(data || []);
  };

  const loadSupportLists = async () => {
    const [{ data: clientsData }, { data: ownersData }] = await Promise.all([
      (supabase as any).from('clients').select('id, name, company').order('name'),
      (supabase as any).from('profiles').select('id, full_name').order('full_name')
    ]);

    setClientsOptions(
      (clientsData || [])
        .filter((client: any) => Boolean(client?.id))
        .map((client: any) => ({
          id: String(client.id),
          name: client.name,
          company: client.company || undefined
        }))
    );

    setOwnersOptions(
      (ownersData || [])
        .filter((owner: any) => Boolean(owner?.id))
        .map((owner: any) => ({
          id: String(owner.id),
          name: owner.full_name || 'Без имени'
        }))
    );
  };

  const loadDeals = async () => {
    const { data, error } = await (supabase as any)
      .from('deals')
      .select(`
        *,
        client:clients(name, company),
        stage:sales_stages(name, color, order_index),
        owner:profiles(full_name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading deals:', error);
      return;
    }

    const dealsData = (data || []).map((deal: any) => ({
      ...deal,
      owner: deal.owner ? { full_name: deal.owner.full_name } : null,
    }));

    setDeals(dealsData as Deal[]);
  };

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedDeal) return;

    const { error } = await (supabase as any)
      .from('deals')
      .update({ stage_id: stageId })
      .eq('id', draggedDeal.id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось переместить сделку', variant: 'destructive' });
      return;
    }

    setDraggedDeal(null);
    loadDeals();
    toast({ title: 'Сделка перемещена', description: 'Стадия успешно обновлена' });
  };

  const dealsByStage = stages.map(stage => ({
    ...stage,
    deals: deals.filter(deal => deal.stage?.order_index === stage.order_index)
  }));

  const totalDealsValue = deals.reduce((sum, deal) => sum + deal.amount, 0);
  const weightedValue = deals.reduce((sum, deal) => sum + (deal.amount * deal.probability / 100), 0);
  const avgDealSize = deals.length > 0 ? totalDealsValue / deals.length : 0;

  const firstStageId = stages.find((stage) => stage?.id)?.id || '';

  const resetDealForm = () => {
    setNewDealData({
      title: '',
      amount: '',
      probability: 50,
      clientId: '',
      stageId: firstStageId,
      ownerId: '',
      expectedCloseDate: '',
      description: '',
      status: 'open'
    });
    setIsEditingDeal(false);
    setEditingDealId(null);
  };

  useEffect(() => {
    if (!newDealData.stageId && firstStageId) {
      setNewDealData((prev) => ({ ...prev, stageId: firstStageId }));
    }
  }, [firstStageId]);

  const openCreateDeal = () => {
    resetDealForm();
    setIsEditingDeal(false);
    setDealDialogOpen(true);
  };

  const openEditDeal = (deal: Deal) => {
    setNewDealData({
      title: deal.title,
      amount: String(deal.amount),
      probability: deal.probability,
      clientId: deal.client_id,
      stageId: deal.stage_id,
      ownerId: deal.owner_id || '',
      expectedCloseDate: deal.expected_close_date ? deal.expected_close_date.substring(0, 10) : '',
      description: deal.description || '',
      status: deal.status,
    });
    setIsEditingDeal(true);
    setEditingDealId(deal.id);
    setDealDialogOpen(true);
  };

  const handleSubmitDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealData.title.trim() || !newDealData.clientId || !newDealData.stageId || !newDealData.amount) {
      toast({ title: 'Ошибка', description: 'Заполните обязательные поля: название, клиент, стадия, сумма', variant: 'destructive' });
      return;
    }

    setIsSavingDeal(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user?.id) {
        throw new Error('User is not authenticated');
      }

      const ownerId = newDealData.ownerId || user.id;

      if (ownerId !== user.id) {
        toast({
          title: 'Ошибка',
          description: 'Сделку можно назначить только на себя из-за ограничений доступа.',
          variant: 'destructive',
        });
        return;
      }

      if (isEditingDeal && editingDealId) {
        const { error } = await (supabase as any)
          .from('deals')
          .update({
            title: newDealData.title.trim(),
            amount: parseFloat(newDealData.amount),
            probability: newDealData.probability,
            status: newDealData.status,
            client_id: newDealData.clientId,
            stage_id: newDealData.stageId,
            owner_id: ownerId,
            expected_close_date: newDealData.expectedCloseDate || null,
            description: newDealData.description || null,
          })
          .eq('id', editingDealId);

        if (error) throw error;

        toast({ title: 'Сделка обновлена', description: 'Изменения сохранены' });
      } else {
        const { error } = await (supabase as any)
          .from('deals')
          .insert({
            title: newDealData.title.trim(),
            amount: parseFloat(newDealData.amount),
            probability: newDealData.probability,
            status: newDealData.status,
            client_id: newDealData.clientId,
            stage_id: newDealData.stageId,
            owner_id: ownerId,
            expected_close_date: newDealData.expectedCloseDate || null,
            description: newDealData.description || null,
          });

        if (error) throw error;

        toast({ title: 'Сделка создана', description: 'Новая сделка успешно добавлена' });
      }

      setDealDialogOpen(false);
      resetDealForm();
      loadDeals();
    } catch (err) {
      console.error('Error creating deal:', err);
      toast({ title: 'Ошибка', description: 'Не удалось сохранить сделку', variant: 'destructive' });
    } finally {
      setIsSavingDeal(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;
    setIsDeletingDeal(true);
    try {
      const { error } = await (supabase as any)
        .from('deals')
        .delete()
        .eq('id', dealToDelete.id);

      if (error) throw error;

      toast({ title: 'Сделка удалена', description: 'Запись успешно удалена' });
      setDealToDelete(null);
      loadDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast({ title: 'Ошибка', description: 'Не удалось удалить сделку', variant: 'destructive' });
    } finally {
      setIsDeletingDeal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">CRM - Управление продажами</h1>
              <p className="text-muted-foreground">Клиенты, сделки и воронка продаж</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreateDeal}>
            <Plus className="h-4 w-4 mr-2" />
            Новая сделка
          </Button>
        </div>
      </div>

      {/* Метрики */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Всего в воронке
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDealsValue.toLocaleString('ru-RU')} ₽</div>
            <p className="text-xs text-muted-foreground mt-1">{deals.length} сделок</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Взвешенная стоимость
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{weightedValue.toLocaleString('ru-RU')} ₽</div>
            <p className="text-xs text-muted-foreground mt-1">С учётом вероятности</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDealSize.toLocaleString('ru-RU')} ₽</div>
            <p className="text-xs text-muted-foreground mt-1">На сделку</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Активные сделки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">В работе</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deals">Сделки</TabsTrigger>
          <TabsTrigger value="clients">Клиенты</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        </TabsList>

        <TabsContent value="deals">
          <Tabs defaultValue="funnel" className="space-y-4">
            <TabsList>
              <TabsTrigger value="funnel">Воронка продаж</TabsTrigger>
              <TabsTrigger value="list">Список сделок</TabsTrigger>
            </TabsList>

            <TabsContent value="funnel">
              {/* Kanban-стиль воронка */}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {dealsByStage.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex-shrink-0 w-80"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(stage.id)}
                  >
                    <Card>
                      <CardHeader className="pb-3" style={{ borderTopColor: stage.color, borderTopWidth: '3px' }}>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                          <Badge variant="secondary">{stage.deals?.length || 0}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {stage.deals?.reduce((sum, d) => sum + d.amount, 0).toLocaleString('ru-RU')} ₽
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                        {stage.deals?.map((deal) => (
                          <Card
                            key={deal.id}
                            className="cursor-move hover:shadow-md transition-shadow"
                            draggable
                            onDragStart={() => handleDragStart(deal)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div>
                                <h4 className="font-medium text-sm">{deal.title}</h4>
                                <p className="text-xs text-muted-foreground">{deal.client?.name}</p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold">{deal.amount.toLocaleString('ru-RU')} ₽</span>
                                <Badge variant="outline" className="text-xs">
                                  {deal.probability}%
                                </Badge>
                              </div>

                              <Progress value={deal.probability} className="h-1" />

                              {deal.expected_close_date && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(deal.expected_close_date).toLocaleDateString('ru-RU')}
                                </div>
                              )}

                              <div className="flex gap-1 pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setViewDeal(deal)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => openEditDeal(deal)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDealToDelete(deal)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {(!stage.deals || stage.deals.length === 0) && (
                          <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed rounded-lg">
                            Перетащите сделку сюда
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-2">
              {deals.map((deal) => (
                <Card key={deal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{deal.title}</h4>
                          <Badge style={{ backgroundColor: deal.stage?.color }}>{deal.stage?.name}</Badge>
                          <Badge variant="outline">{deal.probability}%</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>{deal.client?.name}</span>
                          {deal.owner?.full_name && (
                            <>
                              <span>•</span>
                              <span>{deal.owner?.full_name}</span>
                            </>
                          )}
                          {deal.expected_close_date && (
                            <>
                              <span>•</span>
                              <span>{new Date(deal.expected_close_date).toLocaleDateString('ru-RU')}</span>
                            </>
                          )}
                        </div>
                        {deal.description && (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{deal.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xl font-bold">{deal.amount.toLocaleString('ru-RU')} ₽</div>
                        <div className="text-xs text-muted-foreground">
                          Взвеш: {(deal.amount * deal.probability / 100).toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setViewDeal(deal)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditDeal(deal)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDealToDelete(deal)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Аналитика воронки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dealsByStage.map((stage) => {
                  const stageValue = stage.deals?.reduce((sum, d) => sum + d.amount, 0) || 0;
                  const percentage = totalDealsValue > 0 ? (stageValue / totalDealsValue) * 100 : 0;

                  return (
                    <div key={stage.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stage.name}</span>
                        <span className="text-muted-foreground">
                          {stage.deals?.length || 0} сделок • {stageValue.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" style={{ backgroundColor: `${stage.color}20` }} />
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% от общей суммы
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDealDialogOpen} onOpenChange={setDealDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditingDeal ? 'Редактировать сделку' : 'Новая сделка'}</DialogTitle>
            <DialogDescription>
              {isEditingDeal
                ? 'Измените данные сделки и сохраните изменения.'
                : 'Заполните данные сделки, чтобы добавить её в CRM.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDeal} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deal-title">Название *</Label>
                <Input
                  id="deal-title"
                  value={newDealData.title}
                  onChange={(e) => setNewDealData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Например, VIP поставка мебели"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal-amount">Сумма *</Label>
                <Input
                  id="deal-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDealData.amount}
                  onChange={(e) => setNewDealData((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Клиент *</Label>
                <Select
                  value={newDealData.clientId}
                  onValueChange={(value) => setNewDealData((prev) => ({ ...prev, clientId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsOptions.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}{client.company ? ` • ${client.company}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Стадия *</Label>
                <Select
                  value={newDealData.stageId}
                  onValueChange={(value) => setNewDealData((prev) => ({ ...prev, stageId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите стадию" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages
                      .filter((stage) => Boolean(stage?.id))
                      .map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Вероятность (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newDealData.probability}
                  onChange={(e) => setNewDealData((prev) => ({ ...prev, probability: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ответственный</Label>
                <Select
                  value={newDealData.ownerId || 'none'}
                  onValueChange={(value) =>
                    setNewDealData((prev) => ({ ...prev, ownerId: value === 'none' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите сотрудника" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без ответственного</SelectItem>
                    {ownersOptions.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deal-date">Ожидаемая дата закрытия</Label>
                <Input
                  id="deal-date"
                  type="date"
                  value={newDealData.expectedCloseDate}
                  onChange={(e) => setNewDealData((prev) => ({ ...prev, expectedCloseDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select
                  value={newDealData.status}
                  onValueChange={(value) => setNewDealData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Открыта</SelectItem>
                    <SelectItem value="won">Успешно закрыта</SelectItem>
                    <SelectItem value="lost">Проиграна</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal-description">Описание</Label>
              <Textarea
                id="deal-description"
                value={newDealData.description}
                onChange={(e) => setNewDealData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Дополнительные детали сделки"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDealDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSavingDeal}>
                {isSavingDeal ? 'Сохранение...' : isEditingDeal ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDeal} onOpenChange={(open) => !open && setViewDeal(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{viewDeal?.title}</DialogTitle>
            <DialogDescription>Детальная информация о сделке</DialogDescription>
          </DialogHeader>
          {viewDeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Статус</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">{viewDeal.status}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Сумма</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{viewDeal.amount.toLocaleString('ru-RU')} ₽</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Клиент</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">{viewDeal.client?.name}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Стадия</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge style={{ backgroundColor: viewDeal.stage?.color }}>{viewDeal.stage?.name}</Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Вероятность</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{viewDeal.probability}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ожидаемая дата</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {viewDeal.expected_close_date
                        ? new Date(viewDeal.expected_close_date).toLocaleDateString('ru-RU')
                        : '—'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {viewDeal.description && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Описание</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewDeal.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!dealToDelete} onOpenChange={(open) => !open && setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сделку?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Сделка "{dealToDelete?.title}" будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDeal}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeal}
              disabled={isDeletingDeal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingDeal ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
