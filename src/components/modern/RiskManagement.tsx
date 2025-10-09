import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingDown, Plus } from 'lucide-react';

interface Risk {
  id: string;
  title: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'identified' | 'mitigating' | 'resolved';
  mitigation?: string;
}

export function RiskManagement() {
  const [risks] = useState<Risk[]>([
    { id: '1', title: 'Задержка поставки материалов', probability: 'high', impact: 'high', status: 'mitigating', mitigation: 'Альтернативные поставщики' },
    { id: '2', title: 'Поломка оборудования', probability: 'medium', impact: 'high', status: 'identified', mitigation: 'Профилактическое обслуживание' },
    { id: '3', title: 'Текучка кадров', probability: 'low', impact: 'medium', status: 'mitigating', mitigation: 'Программа удержания' },
  ]);

  const getProbabilityColor = (prob: Risk['probability']) => {
    switch (prob) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
    }
  };

  const getRiskScore = (risk: Risk) => {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[risk.probability] * scores[risk.impact];
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Управление рисками
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-2xl font-bold text-destructive">{risks.filter(r => r.probability === 'high').length}</p>
            <p className="text-xs text-muted-foreground">Высокий риск</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-2xl font-bold text-warning">{risks.filter(r => r.status === 'mitigating').length}</p>
            <p className="text-xs text-muted-foreground">Митигация</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-2xl font-bold text-success">{risks.filter(r => r.status === 'resolved').length}</p>
            <p className="text-xs text-muted-foreground">Решено</p>
          </div>
        </div>

        <div className="space-y-2">
          {risks.sort((a, b) => getRiskScore(b) - getRiskScore(a)).map((risk) => (
            <div
              key={risk.id}
              className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-all animate-fade-in"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${risk.probability === 'high' ? 'text-destructive' : 'text-warning'}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{risk.title}</h4>
                    {risk.mitigation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Митигация: {risk.mitigation}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge variant={getProbabilityColor(risk.probability)} className="text-xs">
                    {risk.probability === 'high' ? 'Высокий' : risk.probability === 'medium' ? 'Средний' : 'Низкий'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Риск: {getRiskScore(risk)}/9</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full hover-lift">
          <Plus className="h-4 w-4 mr-2" />
          Добавить риск
        </Button>
      </CardContent>
    </Card>
  );
}
