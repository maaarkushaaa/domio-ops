import { useMemo, useState } from 'react';
import { Task } from '@/contexts/AppContext';
import { useTasks } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Link2, Unlink } from 'lucide-react';

interface TaskDependencyManagerProps {
  task: Task;
}

export function TaskDependencyManager({ task }: TaskDependencyManagerProps) {
  const { tasks, createDependency, deleteDependency } = useTasks();
  const { toast } = useToast();
  const [selectedPredecessor, setSelectedPredecessor] = useState<string>('');
  const [selectedSuccessor, setSelectedSuccessor] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const currentTask = useMemo(() => tasks.find((candidate) => candidate.id === task.id) ?? task, [task, tasks]);

  const dependenciesIn = currentTask.dependencies_in ?? [];
  const dependenciesOut = currentTask.dependencies_out ?? [];

  const availablePredecessors = useMemo(
    () =>
      tasks.filter((candidate) =>
        candidate.id !== currentTask.id &&
        !(dependenciesIn.some((dep) => dep.from_id === candidate.id))
      ),
    [dependenciesIn, currentTask.id, tasks],
  );

  const availableSuccessors = useMemo(
    () =>
      tasks.filter((candidate) =>
        candidate.id !== currentTask.id &&
        !(dependenciesOut.some((dep) => dep.to_id === candidate.id))
      ),
    [dependenciesOut, currentTask.id, tasks],
  );

  const addDependency = async (mode: 'predecessor' | 'successor') => {
    const predecessorId = mode === 'predecessor' ? selectedPredecessor : currentTask.id;
    const successorId = mode === 'successor' ? selectedSuccessor : currentTask.id;
    const selectedId = mode === 'predecessor' ? selectedPredecessor : selectedSuccessor;

    if (!selectedId) {
      toast({ title: 'Не выбрана задача', description: 'Пожалуйста, выберите задачу для связи.' });
      return;
    }

    setIsSaving(true);
    try {
      await createDependency(predecessorId, successorId);
      toast({ title: 'Связь создана', description: 'Зависимость успешно добавлена.' });
      if (mode === 'predecessor') {
        setSelectedPredecessor('');
      } else {
        setSelectedSuccessor('');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка при создании зависимости',
        description: error?.message ?? 'Не удалось создать зависимость.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeDependency = async (dependencyId: string) => {
    setIsSaving(true);
    try {
      await deleteDependency(dependencyId);
      toast({ title: 'Связь удалена', description: 'Зависимость успешно удалена.' });
    } catch (error: any) {
      toast({
        title: 'Ошибка при удалении зависимости',
        description: error?.message ?? 'Не удалось удалить зависимость.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const findTaskTitle = (id: string) => tasks.find((t) => t.id === id)?.title ?? 'Неизвестная задача';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Зависимости</h3>
        <Badge variant="outline" className="gap-1">
          <Link2 className="h-3 w-3" />
          {dependenciesIn.length + dependenciesOut.length}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground">Эта задача зависит от</div>
          {dependenciesIn.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет зависимостей.</div>
          ) : (
            <div className="space-y-2">
              {dependenciesIn.map((dep) => (
                <div key={dep.id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
                  <span>{findTaskTitle(dep.from_id)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={() => removeDependency(dep.id)}
                    className="gap-1 text-muted-foreground"
                  >
                    <Unlink className="h-3 w-3" />
                    Удалить
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
            <div className="text-xs uppercase text-muted-foreground">Добавить блокирующую задачу</div>
            <Select value={selectedPredecessor} onValueChange={setSelectedPredecessor}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Выберите задачу" />
              </SelectTrigger>
              <SelectContent>
                {availablePredecessors.length === 0 ? (
                  <SelectItem value="" disabled>
                    Нет доступных задач
                  </SelectItem>
                ) : (
                  availablePredecessors.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => addDependency('predecessor')}
              disabled={isSaving || !selectedPredecessor}
            >
              Добавить зависимость
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground">Эта задача блокирует</div>
          {dependenciesOut.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет зависимых задач.</div>
          ) : (
            <div className="space-y-2">
              {dependenciesOut.map((dep) => (
                <div key={dep.id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
                  <span>{findTaskTitle(dep.to_id)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={() => removeDependency(dep.id)}
                    className="gap-1 text-muted-foreground"
                  >
                    <Unlink className="h-3 w-3" />
                    Удалить
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
            <div className="text-xs uppercase text-muted-foreground">Добавить зависимую задачу</div>
            <Select value={selectedSuccessor} onValueChange={setSelectedSuccessor}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Выберите задачу" />
              </SelectTrigger>
              <SelectContent>
                {availableSuccessors.length === 0 ? (
                  <SelectItem value="" disabled>
                    Нет доступных задач
                  </SelectItem>
                ) : (
                  availableSuccessors.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => addDependency('successor')}
              disabled={isSaving || !selectedSuccessor}
            >
              Добавить зависимость
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
