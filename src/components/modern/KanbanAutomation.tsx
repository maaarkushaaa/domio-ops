import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Workflow, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoRule {
  id: string;
  name: string;
  from: string;
  to: string;
  condition: string;
  enabled: boolean;
}

export function KanbanAutomation() {
  const [rules, setRules] = useState<AutoRule[]>([
    {
      id: '1',
      name: 'Авто-переход в работу',
      from: 'К выполнению',
      to: 'В работе',
      condition: 'При назначении исполнителя',
      enabled: true,
    },
    {
      id: '2',
      name: 'Авто-завершение',
      from: 'На ревью',
      to: 'Готово',
      condition: 'При одобрении всех проверяющих',
      enabled: true,
    },
    {
      id: '3',
      name: 'Уведомление о застое',
      from: 'В работе',
      to: 'В работе',
      condition: 'Если задача >3 дней без изменений',
      enabled: false,
    },
  ]);
  const { toast } = useToast();

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast({
      title: 'Правило обновлено',
      description: 'Автоматизация Kanban изменена',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Автоматизация Kanban
        </CardTitle>
        <CardDescription>
          Автоматические переходы между колонками
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 bg-muted rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-sm">{rule.name}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{rule.from}</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline">{rule.to}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {rule.condition}
                  </p>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleRule(rule.id)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Автоматическое перемещение карточек</p>
          <p>• Триггеры на основе условий</p>
          <p>• Уведомления о важных событиях</p>
        </div>
      </CardContent>
    </Card>
  );
}
