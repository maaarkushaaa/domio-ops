import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, Building2, TrendingUp, TrendingDown, MapPin, Bell, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddMaterialDialog } from '@/components/production/AddMaterialDialog';
import { MaterialsListDialog } from '@/components/production/MaterialsListDialog';
import { SuppliersDialog } from '@/components/production/SuppliersDialog';
import { MaterialStockImportDialog } from '@/components/production/MaterialStockImportDialog';
import { ProductBOMImportDialog } from '@/components/production/ProductBOMImportDialog';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface Material {
  id: string;
  name: string;
  category?: string;
  unit: string;
  price_per_unit?: number;
  stock_quantity?: number;
  min_stock?: number;
  max_stock?: number;
  supplier?: string;
  notes?: string;
  sku?: string;
  location?: string;
  created_at: string;
}

interface InventoryAlert {
  id: string;
  item_id: string;
  alert_type: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  created_at: string;
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [materialsListDialogOpen, setMaterialsListDialogOpen] = useState(false);
  const [materialsListType, setMaterialsListType] = useState<'all' | 'lowStock' | 'suppliers'>('all');
  const [suppliersDialogOpen, setSuppliersDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const { toast } = useToast();

  // Загрузка материалов и алертов
  useEffect(() => {
    loadMaterials();
    loadAlerts();

    // Realtime подписки
    const materialsChannel = supabase
      .channel('materials_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        loadMaterials();
      })
      .subscribe();

    const alertsChannel = supabase
      .channel('inventory_alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_alerts' }, () => {
        loadAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(materialsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const loadMaterials = async () => {
    const { data, error } = await (supabase as any)
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading materials:', error);
      return;
    }
    setMaterials(data || []);
  };

  const loadAlerts = async () => {
    const { data, error } = await (supabase as any)
      .from('inventory_alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading alerts:', error);
      return;
    }
    setAlerts(data || []);
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await (supabase as any)
      .from('inventory_alerts')
      .update({ 
        acknowledged: true, 
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user?.id 
      })
      .eq('id', alertId);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось подтвердить алерт', variant: 'destructive' });
    } else {
      loadAlerts();
      toast({ title: 'Успешно', description: 'Алерт подтверждён' });
    }
  };

  // Получить уникальные категории
  const categories = useMemo(() => {
    const cats = new Set(materials.map(m => m.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [materials]);

  // Фильтрация материалов
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = !searchQuery || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, categoryFilter]);

  // Материалы с низким запасом
  const lowStockMaterials = useMemo(() => {
    return materials.filter(m => 
      m.stock_quantity !== undefined && 
      m.min_stock !== undefined && 
      m.stock_quantity <= m.min_stock
    );
  }, [materials]);

  // Статистика
  const stats = useMemo(() => {
    const total = materials.length;
    const lowStock = lowStockMaterials.length;
    const totalValue = materials.reduce((sum, m) => 
      sum + ((m.price_per_unit || 0) * (m.stock_quantity || 0)), 0
    );
    const uniqueSuppliers = new Set(materials.map(m => m.supplier).filter(Boolean)).size;

    return { total, lowStock, totalValue, uniqueSuppliers };
  }, [materials, lowStockMaterials]);

  const handleDelete = async () => {
    if (!materialToDelete) return;

    const { error } = await (supabase as any)
      .from('materials')
      .delete()
      .eq('id', materialToDelete.id);

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить материал', variant: 'destructive' });
    } else {
      setMaterialToDelete(null);
      setDeleteDialogOpen(false);
      toast({ title: 'Успешно', description: 'Материал удалён' });
    }
  };

  const getStockBadge = (material: Material) => {
    if (material.stock_quantity === undefined) return null;
    
    const stock = material.stock_quantity;
    const minStock = material.min_stock || 0;

    if (stock <= minStock) {
      return <Badge variant="destructive">Критический</Badge>;
    } else if (stock <= minStock * 1.5) {
      return <Badge variant="secondary">Низкий</Badge>;
    } else {
      return <Badge variant="default">В наличии</Badge>;
    }
  };

  const getStockProgress = (material: Material) => {
    if (!material.stock_quantity || !material.max_stock) return 0;
    return Math.min((material.stock_quantity / material.max_stock) * 100, 100);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 md:h-8 md:w-8" />
            Материалы и запасы
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Управление каталогом материалов и учёт складских запасов
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MaterialStockImportDialog />
          <ProductBOMImportDialog />
          <Button onClick={() => setAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => {
            setMaterialsListType('all');
            setMaterialsListDialogOpen(true);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Всего
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Нажмите для просмотра</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => {
            setMaterialsListType('lowStock');
            setMaterialsListDialogOpen(true);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Низкий запас
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-bold text-destructive">{stats.lowStock}</p>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Требуют закупки</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Стоимость
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-bold">{stats.totalValue.toLocaleString('ru-RU')} ₽</p>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">На складе</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => setSuppliersDialogOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Поставщики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-bold">{stats.uniqueSuppliers}</p>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Активных</p>
          </CardContent>
        </Card>
      </div>

      {/* Вкладки */}
      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog" className="text-xs sm:text-sm">
            <Package className="h-4 w-4 mr-2 hidden sm:inline" />
            Каталог
          </TabsTrigger>
          <TabsTrigger value="stock" className="text-xs sm:text-sm">
            <TrendingDown className="h-4 w-4 mr-2 hidden sm:inline" />
            Запасы
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs sm:text-sm relative">
            <Bell className="h-4 w-4 mr-2 hidden sm:inline" />
            Алерты
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Вкладка: Каталог материалов */}
        <TabsContent value="catalog" className="space-y-4">
          {/* Фильтры */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по названию, SKU, поставщику..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Все категории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Таблица материалов */}
          <Card>
            <CardContent className="pt-6">
              {filteredMaterials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Материалы не найдены</p>
                  <p className="text-sm mt-2">
                    {materials.length === 0 
                      ? 'Добавьте первый материал в справочник'
                      : 'Попробуйте изменить параметры поиска'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead className="hidden md:table-cell">SKU</TableHead>
                        <TableHead className="hidden sm:table-cell">Категория</TableHead>
                        <TableHead className="hidden lg:table-cell">Поставщик</TableHead>
                        <TableHead className="text-right">Цена</TableHead>
                        <TableHead className="text-right">Запас</TableHead>
                        <TableHead className="hidden sm:table-cell">Статус</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">
                            <div>
                              {material.name}
                              {material.location && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {material.location}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-sm">
                            {material.sku || '—'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {material.category && (
                              <Badge variant="outline">{material.category}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {material.supplier || '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {material.price_per_unit 
                              ? `${material.price_per_unit.toFixed(2)} ₽`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {material.stock_quantity !== undefined
                              ? material.stock_quantity.toFixed(1)
                              : '—'}
                            {material.min_stock !== undefined && (
                              <span className="text-xs text-muted-foreground ml-1">
                                / {material.min_stock.toFixed(1)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{getStockBadge(material)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setMaterialToDelete(material);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка: Складские запасы */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Контроль складских запасов
              </CardTitle>
              <CardDescription>
                Материалы с низким уровнем запасов требуют внимания
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockMaterials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="text-lg font-medium">Все запасы в норме</p>
                  <p className="text-sm mt-2">Нет материалов требующих закупки</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockMaterials.map((material) => {
                    const progress = getStockProgress(material);
                    const isСritical = material.stock_quantity! <= material.min_stock!;
                    
                    return (
                      <Card key={material.id} className={isСritical ? 'border-destructive' : ''}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold">{material.name}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {material.category && (
                                  <Badge variant="outline">{material.category}</Badge>
                                )}
                                {material.sku && (
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {material.sku}
                                  </Badge>
                                )}
                                {getStockBadge(material)}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {material.stock_quantity?.toFixed(1)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {material.unit}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Текущий запас</span>
                              <span className="font-medium">
                                {material.stock_quantity?.toFixed(1)} / {material.max_stock?.toFixed(1) || '∞'} {material.unit}
                              </span>
                            </div>
                            <Progress 
                              value={progress} 
                              className={isСritical ? 'bg-destructive/20' : ''}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Мин: {material.min_stock?.toFixed(1)} {material.unit}</span>
                              {material.supplier && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {material.supplier}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка: Алерты */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Уведомления о запасах
              </CardTitle>
              <CardDescription>
                Автоматические алерты при достижении критических уровней
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="text-lg font-medium">Нет активных алертов</p>
                  <p className="text-sm mt-2">Все уведомления обработаны</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const material = materials.find(m => m.id === alert.item_id);
                    
                    return (
                      <Card key={alert.id} className="border-l-4 border-l-destructive">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className={`h-4 w-4 ${getSeverityColor(alert.severity)}`} />
                                <span className="font-semibold">{material?.name || 'Материал'}</span>
                                <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                                  {alert.alert_type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{alert.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(alert.created_at).toLocaleString('ru-RU')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Подтвердить
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалоги */}
      <AddMaterialDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onMaterialAdded={loadMaterials}
      />

      <MaterialsListDialog
        type={materialsListType}
        open={materialsListDialogOpen}
        onOpenChange={setMaterialsListDialogOpen}
        materials={materials}
      />

      <SuppliersDialog
        open={suppliersDialogOpen}
        onOpenChange={setSuppliersDialogOpen}
        materials={materials}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Удалить материал?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить материал "{materialToDelete?.name}"?
              <br />
              <strong>Это действие нельзя отменить.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
