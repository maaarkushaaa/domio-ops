import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClients, Client } from '@/hooks/use-clients';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientDialogProps {
  trigger?: React.ReactNode;
  client?: Client;
}

export function ClientDialog({ trigger, client }: ClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createClient } = useClients();
  const isEdit = !!client;

  // Заполнить форму при редактировании
  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setContactPerson(client.contact_person || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setNotes(client.notes || '');
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEdit && client) {
        // Редактирование
        const { error } = await supabase
          .from('clients')
          .update({
            name: name.trim(),
            contact_person: contactPerson.trim() || null,
            email: email.trim() || null,
            phone: phone.trim() || null,
            notes: notes.trim() || null,
          })
          .eq('id', client.id);

        if (error) throw error;

        toast({
          title: "Клиент обновлён",
          description: "Данные клиента успешно обновлены",
        });
      } else {
        // Создание
        createClient({
          name: name.trim(),
          contact_person: contactPerson.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          status: 'active',
        });

        toast({
          title: "Клиент создан",
          description: "Новый клиент добавлен в систему",
        });
      }

      // Очистка формы только при создании
      if (!isEdit) {
        setName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setNotes('');
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить клиента",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Новый клиент</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать клиента' : 'Создать клиента'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название компании или ИП"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Контактное лицо</Label>
            <Input
              id="contact"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="ФИО контактного лица"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
