import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Save } from 'lucide-react';
import { useQualityControl, QualityInspectionResult } from '@/hooks/use-quality-control';

interface QualityInspectionDialogProps {
  inspectionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QualityInspectionDialog({
  inspectionId,
  open,
  onOpenChange,
}: QualityInspectionDialogProps) {
  const {
    inspections,
    loadInspectionResults,
    toggleCheckResult,
    completeInspection,
  } = useQualityControl();

  const [results, setResults] = useState<QualityInspectionResult[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const inspection = inspections.find(i => i.id === inspectionId);

  useEffect(() => {
    if (inspectionId && open) {
      loadInspectionResults(inspectionId).then(setResults);
    }
  }, [inspectionId, open]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visual': return '👁️';
      case 'measurements': return '📏';
      case 'functionality': return '⚙️';
      case 'finish': return '✨';
      default: return '📋';
    }
  };

  const handleToggle = async (resultId: string, currentChecked: boolean) => {
    await toggleCheckResult(resultId, !currentChecked);
    // Перезагружаем результаты
    if (inspectionId) {
      const updated = await loadInspectionResults(inspectionId);
      setResults(updated);
    }
  };

  const handleComplete = async (status: 'passed' | 'failed') => {
    if (!inspectionId) return;
    setLoading(true);
    await completeInspection(inspectionId, status, notes);
    setLoading(false);
    onOpenChange(false);
  };

  const completionRate = results.length > 0
    ? Math.round((results.filter(r => r.checked).length / results.length) * 100)
    : 0;

  const requiredChecks = results.filter(r => r.check?.is_required);
  const requiredChecked = requiredChecks.filter(r => r.checked).length;
  const allRequiredChecked = requiredChecks.length === requiredChecked;
  
  // Кнопка "Принять" активна если выбран хотя бы один пункт
  const hasAnyChecked = results.some(r => r.checked);

  if (!inspection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Проверка качества: {inspection.product?.name || 'Изделие'}
            <Badge variant={
              inspection.status === 'passed' ? 'default' :
              inspection.status === 'failed' ? 'destructive' :
              'outline'
            }>
              {inspection.status === 'passed' ? 'Принято' :
               inspection.status === 'failed' ? 'Отклонено' :
               inspection.status === 'in_progress' ? 'В работе' : 'Ожидает'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Прогресс */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Прогресс проверки</span>
              <span className="text-lg font-bold text-primary">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="mb-2" />
            <div className="text-xs text-muted-foreground">
              Обязательных пунктов: {requiredChecked} / {requiredChecks.length}
              {allRequiredChecked && <span className="text-success ml-2">✓ Все обязательные выполнены</span>}
            </div>
          </div>

          {/* Чек-лист */}
          <div className="space-y-2 flex-1 flex flex-col">
            <Label>Чек-лист: {inspection.checklist?.name}</Label>
            <ScrollArea className="flex-1 border rounded-lg p-2">
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <Checkbox
                      checked={result.checked}
                      onCheckedChange={() => handleToggle(result.id, result.checked)}
                      disabled={inspection.status !== 'in_progress'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(result.check?.category || 'other')}</span>
                        <span className="text-sm">{result.check?.name}</span>
                      </div>
                      {result.check?.description && (
                        <p className="text-xs text-muted-foreground mt-1">{result.check.description}</p>
                      )}
                    </div>
                    {result.check?.is_required && (
                      <Badge variant="outline" className="text-xs">
                        Обязательно
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Комментарии */}
          {inspection.status === 'in_progress' && (
            <div className="space-y-2 flex-shrink-0">
              <Label>Комментарии инспектора</Label>
              <Textarea
                placeholder="Дополнительные замечания, рекомендации..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {inspection.notes && inspection.status !== 'in_progress' && (
            <div className="space-y-2">
              <Label>Комментарии инспектора</Label>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                {inspection.notes}
              </div>
            </div>
          )}

          {/* Действия */}
          {inspection.status === 'in_progress' && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => handleComplete('passed')}
                disabled={!hasAnyChecked || loading}
                className="flex-1"
                variant="default"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Принять
              </Button>
              <Button
                onClick={() => handleComplete('failed')}
                disabled={loading}
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Отклонить
              </Button>
            </div>
          )}

          {inspection.status !== 'in_progress' && (
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Проверка завершена {inspection.completed_at && `(${new Date(inspection.completed_at).toLocaleDateString('ru-RU')})`}
              </p>
              {inspection.score !== undefined && (
                <p className="text-lg font-bold mt-1">Оценка: {inspection.score}%</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

