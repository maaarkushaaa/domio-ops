import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProcurement } from '@/hooks/use-procurement';
import { useToast } from '@/hooks/use-toast';

interface OrderDialogProps {
  trigger?: React.ReactNode;
}

export function OrderDialog({ trigger }: OrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const { suppliers } = useProcurement();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !amount) return;

    toast({
      title: 'Заказ создан',
      description: `Создан заказ поставщику на сумму ${amount} ₽`,
    });

    setSupplierId('');
    setAmount('');
    setDeliveryDate('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Новый заказ</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать заказ поставщику</DialogTitle>
          <DialogDescription>
            Заполните данные для создания нового заказа
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Поставщик</Label>
            <Select value={supplierId} onValueChange={setSupplierId} required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите поставщика" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Сумма заказа (₽)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery">Ожидаемая дата доставки</Label>
            <Input
              id="delivery"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать заказ</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
