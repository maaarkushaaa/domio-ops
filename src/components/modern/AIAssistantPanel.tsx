import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, Users, Loader2 } from 'lucide-react';
import { useAIAssistant } from '@/hooks/use-ai-assistant';

export function AIAssistantPanel() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [deadline, setDeadline] = useState<any>(null);
  const [resources, setResources] = useState<any>(null);
  const { loading, suggestTasks, predictDeadline, allocateResources } = useAIAssistant();

  const handleSuggestTasks = async () => {
    const result = await suggestTasks(input);
    setSuggestions(result);
  };

  const handlePredictDeadline = async () => {
    const result = await predictDeadline(input);
    setDeadline(result);
  };

  const handleAllocateResources = async () => {
    const result = await allocateResources(input);
    setResources(result);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Ассистент
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-hidden flex flex-col">
        <Textarea
          placeholder="Опишите задачу или проект..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="resize-none"
        />

        <Tabs defaultValue="tasks" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
            <TabsTrigger value="deadline">Сроки</TabsTrigger>
            <TabsTrigger value="resources">Ресурсы</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="flex-1 space-y-4 overflow-auto">
            <Button 
              onClick={handleSuggestTasks} 
              disabled={loading || !input}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Предложить задачи
                </>
              )}
            </Button>

            <div className="space-y-2">
              {suggestions.map((task, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant={getPriorityColor(task.priority) as any}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{task.category}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deadline" className="flex-1 space-y-4 overflow-auto">
            <Button 
              onClick={handlePredictDeadline} 
              disabled={loading || !input}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Спрогнозировать срок
                </>
              )}
            </Button>

            {deadline && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{deadline.estimated_days} дней</span>
                  <Badge variant={deadline.confidence === 'high' ? 'default' : 'secondary'}>
                    {deadline.confidence} confidence
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Факторы:</p>
                  {deadline.factors?.map((factor: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">• {factor}</p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="flex-1 space-y-4 overflow-auto">
            <Button 
              onClick={handleAllocateResources} 
              disabled={loading || !input}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Распределить ресурсы
                </>
              )}
            </Button>

            {resources && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Людей требуется</p>
                  <p className="text-2xl font-bold">{resources.people_needed}</p>
                </div>

                {resources.budget_estimate && (
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Примерный бюджет</p>
                    <p className="text-2xl font-bold">{resources.budget_estimate.toLocaleString('ru-RU')} ₽</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="font-medium">Материалы:</p>
                  {resources.materials?.map((material: string, i: number) => (
                    <Badge key={i} variant="outline">{material}</Badge>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="font-medium">Рекомендации:</p>
                  {resources.recommendations?.map((rec: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">• {rec}</p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}