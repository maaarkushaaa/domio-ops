import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Sparkles, Clock, FileText, Users, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  title: string;
  type: 'task' | 'project' | 'client' | 'document';
  description: string;
  relevance: number;
  timestamp: string;
}

export function AdvancedSearch() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    status: 'all',
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [useAI, setUseAI] = useState(true);

  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Разработка API для клиентского портала',
      type: 'task',
      description: 'Создание RESTful API с документацией OpenAPI',
      relevance: 95,
      timestamp: '2 часа назад',
    },
    {
      id: '2',
      title: 'Проект модернизации инфраструктуры',
      type: 'project',
      description: 'Обновление серверного оборудования и переход на облако',
      relevance: 88,
      timestamp: '5 часов назад',
    },
    {
      id: '3',
      title: 'ООО "Интерьер Плюс"',
      type: 'client',
      description: 'Клиент из сферы дизайна интерьеров, 5 активных проектов',
      relevance: 82,
      timestamp: '1 день назад',
    },
    {
      id: '4',
      title: 'Договор на оказание услуг №123',
      type: 'document',
      description: 'Подписанный договор с ООО "Техносервис"',
      relevance: 76,
      timestamp: '3 дня назад',
    },
  ];

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Введите запрос',
        description: 'Пожалуйста, введите текст для поиска',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);

    // Simulate AI search
    setTimeout(() => {
      const filtered = mockResults.filter(result => {
        const matchesQuery = result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase());
        
        const matchesType = filters.type === 'all' || result.type === filters.type;
        
        return matchesQuery && matchesType;
      });

      setResults(filtered);
      setIsSearching(false);

      if (useAI) {
        toast({
          title: 'AI-поиск завершен',
          description: `Найдено ${filtered.length} релевантных результатов`,
        });
      }
    }, 1000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Briefcase className="h-4 w-4" />;
      case 'project':
        return <FileText className="h-4 w-4" />;
      case 'client':
        return <Users className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'default';
      case 'project':
        return 'secondary';
      case 'client':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Расширенный поиск
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по всей системе..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Поиск...' : 'Найти'}
          </Button>
        </div>

        {/* AI Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <div className="font-medium text-sm">AI-поиск</div>
              <div className="text-xs text-muted-foreground">
                Интеллектуальный поиск с пониманием контекста
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant={useAI ? 'default' : 'outline'}
            onClick={() => setUseAI(!useAI)}
          >
            {useAI ? 'Включен' : 'Выключен'}
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Фильтры</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="task">Задачи</SelectItem>
                <SelectItem value="project">Проекты</SelectItem>
                <SelectItem value="client">Клиенты</SelectItem>
                <SelectItem value="document">Документы</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все время</SelectItem>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="completed">Завершенные</SelectItem>
                <SelectItem value="archived">Архивные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="task">Задачи</TabsTrigger>
            <TabsTrigger value="project">Проекты</TabsTrigger>
            <TabsTrigger value="client">Клиенты</TabsTrigger>
            <TabsTrigger value="document">Документы</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Введите запрос для начала поиска</p>
                  {useAI && (
                    <p className="text-sm mt-2">
                      AI-поиск поможет найти релевантные результаты
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{result.title}</h4>
                              <Badge variant={getTypeColor(result.type)}>
                                {result.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {result.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {result.timestamp}
                              </span>
                              {useAI && (
                                <Badge variant="outline" className="text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {result.relevance}% релевантность
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {['task', 'project', 'client', 'document'].map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {results
                    .filter((r) => r.type === type)
                    .map((result) => (
                      <div
                        key={result.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <h4 className="font-medium mb-1">{result.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.description}
                        </p>
                      </div>
                    ))}
                  {results.filter((r) => r.type === type).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Нет результатов
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
