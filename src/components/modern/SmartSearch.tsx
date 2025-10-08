import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, FileText, Users, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SmartSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = () => {
    if (!query.trim()) return;

    // Симуляция AI-поиска
    const mockResults = [
      {
        type: 'task',
        title: 'Закупка фурнитуры для проекта Шкаф Версаль',
        relevance: 95,
        icon: FileText,
      },
      {
        type: 'project',
        title: 'Проект: Шкаф Версаль',
        relevance: 87,
        icon: Package,
      },
      {
        type: 'client',
        title: 'Клиент: Марина Васильева',
        relevance: 72,
        icon: Users,
      },
    ];

    setResults(mockResults);
    toast({
      title: 'Поиск завершен',
      description: `Найдено ${mockResults.length} результатов`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Умный поиск с AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Поиск по всей системе..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => {
              const Icon = result.icon;
              return (
                <div
                  key={index}
                  className="p-3 bg-muted rounded-lg flex items-center justify-between hover:bg-muted/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{result.title}</p>
                      <p className="text-xs text-muted-foreground">{result.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {result.relevance}% релевантность
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
