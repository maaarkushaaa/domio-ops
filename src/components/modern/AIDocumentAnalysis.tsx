import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Sparkles, TrendingUp, Loader2, CheckCircle2, XCircle, Clock, Upload } from "lucide-react";
import { useAIDocumentAnalysis } from "@/hooks/use-ai-document-analysis";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function AIDocumentAnalysis() {
  const { analyses, entities, stats, loading, createAnalysis, loadAnalysis, loadEntities, formatFileSize, getEntityIcon, getStatusColor } = useAIDocumentAnalysis();
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  const handleAnalyze = async () => {
    // Демо: создание анализа
    const result = await createAnalysis(
      'Договор_2024_001.pdf',
      'https://example.com/document.pdf',
      'application/pdf',
      1024000
    );

    if (result.success) {
      toast({
        title: "Анализ запущен",
        description: "Документ обрабатывается AI",
      });
      setShowUpload(false);
    } else {
      toast({
        title: "Ошибка",
        description: result.error || "Не удалось запустить анализ",
        variant: "destructive"
      });
    }
  };

  const handleViewAnalysis = async (analysisId: string) => {
    setSelectedAnalysis(analysisId);
    await loadAnalysis(analysisId);
    await loadEntities(analysisId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-анализ документов
            </CardTitle>
            <CardDescription>
              Интеллектуальная обработка и извлечение данных
            </CardDescription>
          </div>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Загрузить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Анализ документа</DialogTitle>
                <DialogDescription>
                  Загрузите документ для AI-анализа
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Перетащите файл сюда или нажмите для выбора
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (макс. 10 МБ)
                  </p>
                </div>
                <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Начать анализ
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">Последние</TabsTrigger>
            <TabsTrigger value="entities">Сущности</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-3">
            {analyses.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Нет проанализированных документов</p>
              </div>
            ) : (
              analyses.slice(0, 5).map((analysis) => (
                <div
                  key={analysis.id}
                  className="p-3 rounded-lg border space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewAnalysis(analysis.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(analysis.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{analysis.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(analysis.file_size)} • {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: ru })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {analysis.status}
                    </Badge>
                  </div>

                  {analysis.status === 'processing' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Прогресс</span>
                        <span className="font-medium">{analysis.progress}%</span>
                      </div>
                      <Progress value={analysis.progress} className="h-1" />
                    </div>
                  )}

                  {analysis.status === 'completed' && (
                    <div className="flex items-center gap-4 text-xs">
                      {analysis.accuracy_score && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">Точность: {analysis.accuracy_score}%</span>
                        </div>
                      )}
                      {analysis.word_count && (
                        <span className="text-muted-foreground">{analysis.word_count} слов</span>
                      )}
                      {analysis.language_detected && (
                        <Badge variant="outline" className="text-xs">{analysis.language_detected}</Badge>
                      )}
                    </div>
                  )}

                  {analysis.error_message && (
                    <p className="text-xs text-destructive">{analysis.error_message}</p>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="entities" className="space-y-2">
            {entities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>Выберите документ для просмотра извлечённых данных</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  entities.reduce((acc, entity) => {
                    if (!acc[entity.entity_type]) acc[entity.entity_type] = [];
                    acc[entity.entity_type].push(entity);
                    return acc;
                  }, {} as Record<string, typeof entities>)
                ).map(([type, items]) => (
                  <div key={type} className="space-y-2">
                    <h4 className="text-xs font-medium flex items-center gap-2">
                      <span>{getEntityIcon(type)}</span>
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <Badge variant="outline" className="text-xs">{items.length}</Badge>
                    </h4>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((entity) => (
                        <div key={entity.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs">
                          <span className="font-medium">{entity.entity_value}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(entity.confidence)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-3">
            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Всего анализов</p>
                    <p className="text-2xl font-bold">{stats.total_analyses}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Завершено</p>
                    <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Средняя точность</p>
                    <p className="text-2xl font-bold">{stats.avg_accuracy || 0}%</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Слов извлечено</p>
                    <p className="text-2xl font-bold">{stats.total_words_extracted || 0}</p>
                  </div>
                </div>

                {stats.top_entities && stats.top_entities.length > 0 && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs font-medium mb-2">Топ извлечённых сущностей</p>
                    <div className="space-y-1">
                      {stats.top_entities.slice(0, 5).map((entity, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground capitalize">
                            {getEntityIcon(entity.type)} {entity.type.replace('_', ' ')}
                          </span>
                          <span className="font-medium">{entity.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>Загрузка статистики...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-3 mt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Поддержка: PDF, DOC, XLS, JPG • OCR для сканов • Мультиязычность
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
