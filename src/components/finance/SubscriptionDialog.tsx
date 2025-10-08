import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface SubscriptionDialogProps {
  trigger?: React.ReactNode;
}

export function SubscriptionDialog({ trigger }: SubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [nextPayment, setNextPayment] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    toast({
      title: 'Подписка добавлена',
      description: `Добавлена подписка: ${name} - ${amount} ₽`,
    });

    setName('');
    setAmount('');
    setNextPayment('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Добавить подписку
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить подписку</DialogTitle>
          <DialogDescription>
            Добавьте новую регулярную подписку
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название сервиса</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adobe Creative Cloud"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Сумма (₽)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="3500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextPayment">Следующий платеж</Label>
            <Input
              id="nextPayment"
              type="date"
              value={nextPayment}
              onChange={(e) => setNextPayment(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">Добавить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
