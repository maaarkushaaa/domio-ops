import { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

export function TaskChecklists({ taskId }: { taskId: string }) {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const load = async () => {
      const { data: lists } = await (supabase as any)
        .from('task_checklists')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (lists) {
        const withItems = await Promise.all(
          lists.map(async (list: any) => {
            const { data: items } = await (supabase as any)
              .from('task_checklist_items')
              .select('*')
              .eq('checklist_id', list.id)
              .order('position', { ascending: true });
            return { ...list, items: items || [] };
          })
        );
        setChecklists(withItems);
      }
    };
    load();
  }, [taskId]);

  const createChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    const { data, error } = await (supabase as any)
      .from('task_checklists')
      .insert({ task_id: taskId, title: newChecklistTitle.trim() })
      .select()
      .single();
    if (error) {
      console.error('Create checklist error', error);
      return;
    }
    setChecklists(prev => [...prev, { ...data, items: [] }]);
    setNewChecklistTitle('');
  };

  const deleteChecklist = async (checklistId: string) => {
    await (supabase as any).from('task_checklists').delete().eq('id', checklistId);
    setChecklists(prev => prev.filter(c => c.id !== checklistId));
  };

  const addItem = async (checklistId: string) => {
    const content = newItemContent[checklistId]?.trim();
    if (!content) return;
    const checklist = checklists.find(c => c.id === checklistId);
    const position = checklist?.items.length || 0;
    const { data, error } = await (supabase as any)
      .from('task_checklist_items')
      .insert({ checklist_id: checklistId, content, position })
      .select()
      .single();
    if (error) {
      console.error('Add item error', error);
      return;
    }
    setChecklists(prev =>
      prev.map(c =>
        c.id === checklistId ? { ...c, items: [...c.items, data] } : c
      )
    );
    setNewItemContent(prev => ({ ...prev, [checklistId]: '' }));
  };

  const toggleItem = async (checklistId: string, itemId: string, done: boolean) => {
    await (supabase as any)
      .from('task_checklist_items')
      .update({ done })
      .eq('id', itemId);
    setChecklists(prev =>
      prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.map((i: any) => (i.id === itemId ? { ...i, done } : i)) }
          : c
      )
    );
  };

  const deleteItem = async (checklistId: string, itemId: string) => {
    await (supabase as any).from('task_checklist_items').delete().eq('id', itemId);
    setChecklists(prev =>
      prev.map(c =>
        c.id === checklistId ? { ...c, items: c.items.filter((i: any) => i.id !== itemId) } : c
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Чек-листы</div>

      {checklists.map(checklist => {
        const done = checklist.items.filter((i: any) => i.done).length;
        const total = checklist.items.length;
        return (
          <div key={checklist.id} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">
                {checklist.title}{' '}
                <span className="text-xs text-muted-foreground">
                  ({done}/{total})
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteChecklist(checklist.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-1">
              {checklist.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={(checked) =>
                      toggleItem(checklist.id, item.id, !!checked)
                    }
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.done ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {item.content}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => deleteItem(checklist.id, item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Input
                size={1}
                value={newItemContent[checklist.id] || ''}
                onChange={(e) =>
                  setNewItemContent(prev => ({ ...prev, [checklist.id]: e.target.value }))
                }
                placeholder="Добавить пункт..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addItem(checklist.id);
                }}
              />
              <Button size="sm" onClick={() => addItem(checklist.id)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}

      <div className="flex gap-2">
        <Input
          value={newChecklistTitle}
          onChange={(e) => setNewChecklistTitle(e.target.value)}
          placeholder="Название нового чек-листа..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') createChecklist();
          }}
        />
        <Button size="sm" onClick={createChecklist}>
          <Plus className="h-4 w-4 mr-1" />
          Чек-лист
        </Button>
      </div>
    </div>
  );
}

