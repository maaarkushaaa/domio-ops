import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Send, 
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Download,
  Eye
} from 'lucide-react';
import { useFinance, Invoice } from '@/hooks/use-finance';
import { useAppNotifications } from '@/components/NotificationIntegration';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { safeFormatCurrency } from '@/utils/safeFormat';

interface InvoiceDialogProps {
  invoice?: Invoice;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const INVOICE_TYPES = [
  { value: 'invoice', label: 'Счет-фактура', icon: FileText },
  { value: 'receipt', label: 'Квитанция', icon: CheckCircle2 },
  { value: 'estimate', label: 'Смета', icon: Clock }
];

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Черновик', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Отправлен', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Оплачен', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Просрочен', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Отменен', color: 'bg-gray-100 text-gray-800' },
  { value: 'refunded', label: 'Возвращен', color: 'bg-yellow-100 text-yellow-800' }
];

export function InvoiceDialog({ invoice, trigger, onSuccess }: InvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Форма
  const [number, setNumber] = useState(invoice?.number || '');
  const [type, setType] = useState<Invoice['type']>(invoice?.type || 'invoice');
  const [status, setStatus] = useState<Invoice['status']>(invoice?.status || 'draft');
  const [amount, setAmount] = useState(invoice?.amount?.toString() || '');
  const [taxAmount, setTaxAmount] = useState(invoice?.tax_amount?.toString() || '0');
  const [issueDate, setIssueDate] = useState(invoice?.issue_date || '');
  const [dueDate, setDueDate] = useState(invoice?.due_date || '');
  const [description, setDescription] = useState(invoice?.description || '');
  const [notes, setNotes] = useState(invoice?.notes || '');

  const { createInvoice, updateInvoice, deleteInvoice } = useFinance();
  const { notifySuccess, notifyError } = useAppNotifications();

  const isEdit = !!invoice;

  // Авто-открытие диалога при переданном инвойсе (режим редактирования)
  useEffect(() => {
    if (invoice) {
      setOpen(true);
    }
  }, [invoice]);

  const calculateTotal = () => {
    const amountNum = parseFloat(amount) || 0;
    const taxNum = parseFloat(taxAmount) || 0;
    return amountNum + taxNum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim() || !amount) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const invoiceData = {
        number: number.trim(),
        type,
        status,
        amount: parseFloat(amount),
        tax_amount: parseFloat(taxAmount) || 0,
        total_amount: calculateTotal(),
        issue_date: issueDate,
        due_date: dueDate,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined
      };

      if (isEdit && invoice) {
        await updateInvoice(invoice.id, invoiceData);
        notifySuccess('Инвойс обновлен', `Инвойс "${number}" успешно обновлен`);
      } else {
        await createInvoice(invoiceData);
        notifySuccess('Инвойс создан', `Инвойс "${number}" успешно создан`);
      }

      // Сброс формы
      if (!isEdit) {
        setNumber('');
        setAmount('');
        setTaxAmount('0');
        setDescription('');
        setNotes('');
      }
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving invoice:', error);
      notifyError('Ошибка сохранения', 'Не удалось сохранить инвойс');
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить инвойс',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = INVOICE_TYPES.find(t => t.value === type);
  const selectedStatus = INVOICE_STATUSES.find(s => s.value === status);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="h-4 w-4 mr-2" />Новый инвойс</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать инвойс' : 'Создать инвойс'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Измените данные инвойса' : 'Создайте новый инвойс для учета доходов'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Номер инвойса *</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="INV-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select value={type} onValueChange={(value) => setType(value as Invoice['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Статус и суммы */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as Invoice['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Сумма *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxAmount">НДС</Label>
              <Input
                id="taxAmount"
                type="number"
                step="0.01"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Даты */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Дата выставления</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Срок оплаты</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Описание и примечания */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание товаров или услуг"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Дополнительная информация"
                rows={2}
              />
            </div>
          </div>

          {/* Итого */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Итого к оплате:</span>
              <span className="text-2xl font-bold">{safeFormatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : (isEdit ? 'Обновить' : 'Создать')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InvoicesManagement() {
  const { invoices, updateInvoice, deleteInvoice, loadData } = useFinance();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const getStatusInfo = (status: string) => {
    return INVOICE_STATUSES.find(s => s.value === status) || INVOICE_STATUSES[0];
  };

  const handleStatusChange = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      await updateInvoice(invoiceId, { status: newStatus });
      toast({
        title: 'Статус обновлен',
        description: 'Статус инвойса успешно изменен'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      await deleteInvoice(invoiceId);
      toast({
        title: 'Инвойс удален',
        description: 'Инвойс успешно удален'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить инвойс',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Создаем PDF или Excel файл
    const invoiceData = {
      number: invoice.number,
      type: INVOICE_TYPES.find(t => t.value === invoice.type)?.label,
      status: getStatusInfo(invoice.status).label,
      amount: invoice.amount,
      taxAmount: invoice.tax_amount,
      totalAmount: invoice.total_amount,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      description: invoice.description,
      notes: invoice.notes
    };

    // Простой экспорт в JSON (в реальном проекте здесь был бы PDF/Excel)
    const dataStr = JSON.stringify(invoiceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.number}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Инвойс скачан',
      description: `Инвойс ${invoice.number} скачан`
    });
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой добавления */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление инвойсами</h2>
          <p className="text-muted-foreground">Создание и отслеживание счетов-фактур</p>
        </div>
        <InvoiceDialog />
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего инвойсов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ожидают оплаты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {invoices.filter(inv => inv.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Просрочены</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter(inv => inv.status === 'overdue').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Оплачены</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter(inv => inv.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица инвойсов */}
      <Card>
        <CardHeader>
          <CardTitle>Список инвойсов</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Дата выставления</TableHead>
                <TableHead>Срок оплаты</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const statusInfo = getStatusInfo(invoice.status);
                const isOverdue = invoice.status === 'overdue' || 
                  (invoice.status === 'sent' && new Date(invoice.due_date) < new Date());
                
                return (
                  <TableRow key={invoice.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {INVOICE_TYPES.find(t => t.value === invoice.type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {safeFormatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>
                      {invoice.issue_date ? format(new Date(invoice.issue_date), 'dd.MM.yyyy', { locale: ru }) : '-'}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date ? format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: ru }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewInvoice(invoice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(invoice.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Диалог редактирования */}
      {selectedInvoice && (
        <InvoiceDialog
          invoice={selectedInvoice}
          onSuccess={() => {
            setSelectedInvoice(null);
            // Немедленно обновляем список инвойсов из этого экземпляра useFinance
            try { loadData(); } catch (e) { console.warn('Invoices reload failed:', e); }
          }}
        />
      )}

      {/* Диалог просмотра */}
      {viewInvoice && (
        <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Просмотр инвойса {viewInvoice.number}</DialogTitle>
              <DialogDescription>
                Детальная информация об инвойсе
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Тип</Label>
                  <p className="text-sm">{INVOICE_TYPES.find(t => t.value === viewInvoice.type)?.label}</p>
                </div>
                <div>
                  <Label>Статус</Label>
                  <Badge className={getStatusInfo(viewInvoice.status).color}>
                    {getStatusInfo(viewInvoice.status).label}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Сумма</Label>
                  <p className="text-lg font-bold">{safeFormatCurrency(viewInvoice.amount)}</p>
                </div>
                <div>
                  <Label>НДС</Label>
                  <p className="text-lg">{safeFormatCurrency(viewInvoice.tax_amount)}</p>
                </div>
                <div>
                  <Label>Итого</Label>
                  <p className="text-xl font-bold text-green-600">{safeFormatCurrency(viewInvoice.total_amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Дата выставления</Label>
                  <p className="text-sm">{viewInvoice.issue_date ? format(new Date(viewInvoice.issue_date), 'dd.MM.yyyy', { locale: ru }) : '-'}</p>
                </div>
                <div>
                  <Label>Срок оплаты</Label>
                  <p className="text-sm">{viewInvoice.due_date ? format(new Date(viewInvoice.due_date), 'dd.MM.yyyy', { locale: ru }) : '-'}</p>
                </div>
              </div>
              {viewInvoice.description && (
                <div>
                  <Label>Описание</Label>
                  <p className="text-sm">{viewInvoice.description}</p>
                </div>
              )}
              {viewInvoice.notes && (
                <div>
                  <Label>Примечания</Label>
                  <p className="text-sm">{viewInvoice.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setViewInvoice(null)}>
                Закрыть
              </Button>
              <Button onClick={() => handleDownloadInvoice(viewInvoice)}>
                <Download className="h-4 w-4 mr-2" />
                Скачать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
