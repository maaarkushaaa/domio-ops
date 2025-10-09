import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout, Zap, Star, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  description: string;
  tasks: number;
  popular: boolean;
  category: string;
}

export function ProjectTemplates() {
  const [templates] = useState<Template[]>([
    { id: '1', name: 'Производство мебели', description: 'От 3D до производства', tasks: 12, popular: true, category: 'Производство' },
    { id: '2', name: 'Запуск продукта', description: 'Полный цикл вывода на рынок', tasks: 18, popular: true, category: 'Маркетинг' },
    { id: '3', name: 'Разработка ПО', description: 'Agile спринт шаблон', tasks: 15, popular: false, category: 'IT' },
    { id: '4', name: 'Организация события', description: 'Планирование мероприятия', tasks: 20, popular: false, category: 'События' },
  ]);
  const { toast } = useToast();

  const useTemplate = (template: Template) => {
    toast({
      title: 'Шаблон применен',
      description: `Создан проект "${template.name}" с ${template.tasks} задачами`,
    });
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          Шаблоны проектов
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-all animate-fade-in group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  {template.popular && (
                    <Badge variant="default" className="h-5 px-1.5">
                      <Star className="h-3 w-3 fill-current" />
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{template.tasks} задач</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => useTemplate(template)}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full hover-lift">
          <Plus className="h-4 w-4 mr-2" />
          Создать свой шаблон
        </Button>
      </CardContent>
    </Card>
  );
}
