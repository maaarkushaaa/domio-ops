import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts, ProductStatus } from '@/hooks/use-products';

interface ProductDialogProps {
  trigger?: React.ReactNode;
}

export function ProductDialog({ trigger }: ProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('planning');

  const { createProduct } = useProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createProduct({
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      progress: 0,
    });

    setName('');
    setDescription('');
    setStatus('planning');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Новое изделие</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать изделие</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название изделия"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание изделия"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Статус</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Планирование</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="quality_check">Контроль качества</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
                <SelectItem value="on_hold">На паузе</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
