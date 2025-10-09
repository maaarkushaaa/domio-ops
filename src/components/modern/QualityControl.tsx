import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, AlertTriangle, ClipboardCheck } from 'lucide-react';

interface QualityCheck {
  id: string;
  name: string;
  category: 'visual' | 'measurements' | 'functionality' | 'finish';
  checked: boolean;
  required: boolean;
}

interface Inspection {
  id: string;
  productName: string;
  date: string;
  status: 'passed' | 'failed' | 'pending';
  score: number;
  inspector: string;
}

export function QualityControl() {
  const [checks, setChecks] = useState<QualityCheck[]>([
    { id: '1', name: 'Проверка размеров', category: 'measurements', checked: true, required: true },
    { id: '2', name: 'Состояние поверхности', category: 'visual', checked: true, required: true },
    { id: '3', name: 'Качество фурнитуры', category: 'functionality', checked: false, required: true },
    { id: '4', name: 'Финишная отделка', category: 'finish', checked: false, required: true },
    { id: '5', name: 'Цвет покрытия', category: 'visual', checked: true, required: false },
    { id: '6', name: 'Упаковка', category: 'visual', checked: false, required: false },
  ]);

  const [inspections] = useState<Inspection[]>([
    {
      id: '1',
      productName: 'Шкаф "Версаль"',
      date: '2025-10-09',
      status: 'passed',
      score: 98,
      inspector: 'Иванов И.И.',
    },
    {
      id: '2',
      productName: 'Комод "Классик"',
      date: '2025-10-08',
      status: 'failed',
      score: 67,
      inspector: 'Петров П.П.',
    },
  ]);

  const toggleCheck = (id: string) => {
    setChecks(prev =>
      prev.map(check => (check.id === id ? { ...check, checked: !check.checked } : check))
    );
  };

  const getCategoryIcon = (category: QualityCheck['category']) => {
    switch (category) {
      case 'visual':
        return '👁️';
      case 'measurements':
        return '📏';
      case 'functionality':
        return '⚙️';
      case 'finish':
        return '✨';
    }
  };

  const getStatusIcon = (status: Inspection['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const completionRate = Math.round(
    (checks.filter(c => c.checked).length / checks.length) * 100
  );

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Контроль качества
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Прогресс проверки</span>
            <span className="text-lg font-bold text-primary">{completionRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Чек-лист текущей проверки</p>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <Checkbox
                    checked={check.checked}
                    onCheckedChange={() => toggleCheck(check.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(check.category)}</span>
                      <span className="text-sm">{check.name}</span>
                    </div>
                  </div>
                  {check.required && (
                    <Badge variant="outline" className="text-xs">
                      Обязательно
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">История проверок</p>
          <div className="space-y-2">
            {inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{inspection.productName}</p>
                  {getStatusIcon(inspection.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Оценка: {inspection.score}%</span>
                  <span>{inspection.inspector}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(inspection.date).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
