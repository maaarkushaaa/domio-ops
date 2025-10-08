import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Edit } from 'lucide-react';

interface BudgetEditDialogProps {
  category: string;
  planned: number;
  onSave?: (planned: number) => void;
}

export function BudgetEditDialog({ category, planned, onSave }: BudgetEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [newPlanned, setNewPlanned] = useState(planned.toString());
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(newPlanned);
    if (isNaN(value)) return;

    onSave?.(value);
    toast({
      title: 'Бюджет обновлен',
      description: `Бюджет для "${category}" установлен: ${value.toLocaleString('ru-RU')} ₽`,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать бюджет</DialogTitle>
          <DialogDescription>
            Изменить плановый бюджет для категории "{category}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planned">Плановая сумма (₽)</Label>
            <Input
              id="planned"
              type="number"
              value={newPlanned}
              onChange={(e) => setNewPlanned(e.target.value)}
              placeholder="200000"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
