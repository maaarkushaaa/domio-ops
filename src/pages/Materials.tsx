import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, Building2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddMaterialDialog } from '@/components/production/AddMaterialDialog';
import { MaterialsListDialog } from '@/components/production/MaterialsListDialog';
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
  supplier?: string;
  notes?: string;
  created_at: string;
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);
  const [materialsListDialogOpen, setMaterialsListDialogOpen] = useState(false);
  const [materialsListType, setMaterialsListType] = useState<'all' | 'lowStock' | 'suppliers'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  // Загрузка материалов
  useEffect(() => {
    loadMaterials();

    // Realtime подписка
    const channel = supabase
      .channel('materials_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        loadMaterials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMaterials = async () => {
    const { data } = await (supabase as any)
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    
    setMaterials(data || []);
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
        m.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, categoryFilter]);

  // Статистика
  const stats = useMemo(() => {
    const total = materials.length;
    const lowStock = materials.filter(m => 
      m.stock_quantity !== undefined && 
      m.min_stock !== undefined && 
      m.stock_quantity <= m.min_stock
    ).length;
    const totalValue = materials.reduce((sum, m) => 
      sum + ((m.price_per_unit || 0) * (m.stock_quantity || 0)), 0
    );
    const uniqueSuppliers = new Set(materials.map(m => m.supplier).filter(Boolean)).size;

    return { total, lowStock, totalValue, uniqueSuppliers };
  }, [materials]);

  const handleDelete = async () => {
    if (!materialToDelete) return;

    const { error } = await (supabase as any)
      .from('materials')
      .delete()
      .eq('id', materialToDelete.id);

    if (error) {
      alert('Ошибка при удалении материала: ' + error.message);
    } else {
      setMaterialToDelete(null);
      setDeleteDialogOpen(false);
      loadMaterials();
    }
  };

  const getStockBadge = (material: Material) => {
    if (material.stock_quantity === undefined) return null;
    
    const stock = material.stock_quantity;
    const minStock = material.min_stock || 0;

    if (stock <= minStock) {
      return <Badge variant="destructive">Мало</Badge>;
    } else if (stock <= minStock * 1.5) {
      return <Badge variant="secondary">Норма</Badge>;
    } else {
      return <Badge variant="default">В наличии</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Справочник материалов
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление каталогом материалов, комплектующих и фурнитуры
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить материал
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover-lift"
          onClick={() => {
            setMaterialsListType('all');
            setMaterialsListDialogOpen(true);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Всего материалов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Нажмите для просмотра</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover-lift"
          onClick={() => {
            setMaterialsListType('lowStock');
            setMaterialsListDialogOpen(true);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Требуют закупки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats.lowStock}</p>
            <p className="text-xs text-muted-foreground mt-1">Нажмите для просмотра</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Стоимость на складе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalValue.toLocaleString('ru-RU')} ₽</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover-lift"
          onClick={() => {
            setMaterialsListType('suppliers');
            setMaterialsListDialogOpen(true);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Поставщиков
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.uniqueSuppliers}</p>
            <p className="text-xs text-muted-foreground mt-1">Нажмите для просмотра</p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию, поставщику..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[250px]">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Поставщик</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">На складе</TableHead>
                  <TableHead>Ед. изм.</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      {material.name}
                      {material.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {material.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {material.category && (
                        <Badge variant="outline">{material.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {material.supplier || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {material.price_per_unit 
                        ? `${material.price_per_unit.toFixed(2)} ₽`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {material.stock_quantity !== undefined
                        ? material.stock_quantity.toFixed(1)
                        : '—'}
                      {material.min_stock !== undefined && (
                        <span className="text-xs text-muted-foreground ml-1">
                          / {material.min_stock.toFixed(1)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{material.unit}</TableCell>
                    <TableCell>{getStockBadge(material)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Диалог добавления материала */}
      <AddMaterialDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onMaterialAdded={loadMaterials}
      />

      {/* Диалог списка материалов */}
      <MaterialsListDialog
        type={materialsListType}
        open={materialsListDialogOpen}
        onOpenChange={setMaterialsListDialogOpen}
        materials={materials}
      />

      {/* Диалог удаления */}
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

