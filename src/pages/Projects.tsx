import { useState } from 'react';
import { Plus, Archive, Edit2, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/hooks/use-projects';
import { supabase } from '@/integrations/supabase/client';

export default function Projects() {
  const { projects, updateProjectStatus } = useProjects();
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = projects.filter(p => {
    const matchStatus = filter === 'all' || (p as any).status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setDialogOpen(true);
  };

  const openEdit = (project: any) => {
    setEditingId(project.id);
    setName(project.name);
    setDescription(project.description || '');
    setStartDate(project.start_date || '');
    setEndDate(project.end_date || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        const { error } = await (supabase as any)
          .from('projects')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            start_date: startDate || null,
            end_date: endDate || null,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('projects')
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            start_date: startDate || null,
            end_date: endDate || null,
            status: 'active',
          });
        if (error) throw error;
      }
      setDialogOpen(false);
    } catch (e) {
      console.error('Save project error', e);
    }
  };

  const toggleArchive = async (projectId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    try {
      await updateProjectStatus(projectId, newStatus);
    } catch (e) {
      console.error('Toggle archive error', e);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Проекты</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Новый проект
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Поиск проектов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant={filter === 'active' ? 'default' : 'outline'} onClick={() => setFilter('active')}>
            Активные
          </Button>
          <Button variant={filter === 'archived' ? 'default' : 'outline'} onClick={() => setFilter('archived')}>
            Архивные
          </Button>
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
            Все
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span className="flex-1">{project.name}</span>
                <Badge variant={(project as any).status === 'active' ? 'default' : 'secondary'}>
                  {(project as any).status === 'active' ? 'Активный' : 'Архив'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
              {((project as any).start_date || (project as any).end_date) && (
                <div className="text-xs text-muted-foreground">
                  {(project as any).start_date && `Старт: ${new Date((project as any).start_date).toLocaleDateString('ru-RU')}`}
                  {(project as any).start_date && (project as any).end_date && ' • '}
                  {(project as any).end_date && `Конец: ${new Date((project as any).end_date).toLocaleDateString('ru-RU')}`}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(project)}>
                  <Edit2 className="h-3 w-3 mr-1" />
                  Редактировать
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleArchive(project.id, (project as any).status)}
                >
                  {(project as any).status === 'active' ? (
                    <>
                      <Archive className="h-3 w-3 mr-1" />
                      Архивировать
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="h-3 w-3 mr-1" />
                      Разархивировать
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Редактировать проект' : 'Новый проект'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название проекта" />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание проекта" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата старта</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Дата окончания</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSave}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

