import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { getProgressAnalysis, ProductProgressData, getProgressColor, getProgressDescription } from '@/utils/progressCalculator';
import { useProductProgress } from '@/hooks/use-product-progress';

interface ProductProgressAnalysisProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductProgressAnalysis({
  productId,
  productName,
  open,
  onOpenChange,
}: ProductProgressAnalysisProps) {
  const { getProductProgressData, updateProductProgress } = useProductProgress();
  const [progressData, setProgressData] = useState<ProductProgressData | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadProgressData = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const data = await getProductProgressData(productId);
      const analysisResult = getProgressAnalysis(data);
      
      setProgressData(data);
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadProgressData();
    await updateProductProgress(productId);
    // Перезагружаем данные после обновления
    setTimeout(loadProgressData, 500);
  };

  useEffect(() => {
    if (open && productId) {
      loadProgressData();
    }
  }, [open, productId]);

  if (!open || !analysis) return null;

  const getProgressIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.includes('материалы') || recommendation.includes('закупить')) {
      return <Package className="h-4 w-4 text-blue-500" />;
    }
    if (recommendation.includes('проверк') || recommendation.includes('качеств')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (recommendation.includes('просроч') || recommendation.includes('ускорить')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой обновления */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Анализ прогресса</h2>
          <p className="text-muted-foreground">{productName}</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Общий прогресс */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Общий прогресс готовности
            <Badge variant={getProgressColor(analysis.total)}>
              {analysis.total}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{getProgressDescription(analysis.total)}</span>
              <span className="font-medium">{analysis.total}%</span>
            </div>
            <Progress value={analysis.total} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Детализация прогресса */}
      <Card>
        <CardHeader>
          <CardTitle>Детализация прогресса</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Базовый прогресс */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Статус производства</span>
                <Badge variant="outline">{analysis.breakdown.base}%</Badge>
              </div>
              <Progress value={Math.max(0, analysis.breakdown.base)} className="h-2" />
            </div>

            {/* Прогресс проверок качества */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Проверки качества</span>
                <div className="flex items-center gap-1">
                  {getProgressIcon(analysis.breakdown.quality)}
                  <Badge variant="outline">{analysis.breakdown.quality > 0 ? '+' : ''}{analysis.breakdown.quality}%</Badge>
                </div>
              </div>
              <Progress value={Math.max(0, Math.min(100, analysis.breakdown.quality + 50))} className="h-2" />
            </div>

            {/* Прогресс материалов */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">Готовность материалов</span>
                <div className="flex items-center gap-1">
                  {getProgressIcon(analysis.breakdown.materials)}
                  <Badge variant="outline">{analysis.breakdown.materials > 0 ? '+' : ''}{analysis.breakdown.materials}%</Badge>
                </div>
              </div>
              <Progress value={Math.max(0, Math.min(100, analysis.breakdown.materials + 50))} className="h-2" />
            </div>

            {/* Бонусы и штрафы */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {analysis.breakdown.bonuses > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Бонусы/Штрафы</span>
                <div className="flex items-center gap-1">
                  {getProgressIcon(analysis.breakdown.bonuses)}
                  <Badge variant={analysis.breakdown.bonuses >= 0 ? "default" : "destructive"}>
                    {analysis.breakdown.bonuses > 0 ? '+' : ''}{analysis.breakdown.bonuses}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, analysis.breakdown.bonuses + 50))} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рекомендации */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Рекомендации для улучшения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    {getRecommendationIcon(recommendation)}
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Дополнительная информация */}
      {progressData && (
        <Card>
          <CardHeader>
            <CardTitle>Дополнительная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Проверки качества */}
              {progressData.qualityInspections && progressData.qualityInspections.total > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Проверки качества</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Всего проверок:</span>
                      <span>{progressData.qualityInspections.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Пройдено:</span>
                      <span className="text-green-600">{progressData.qualityInspections.passed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Провалено:</span>
                      <span className="text-red-600">{progressData.qualityInspections.failed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>В процессе:</span>
                      <span className="text-blue-600">{progressData.qualityInspections.inProgress}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Материалы */}
              {progressData.materials && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Материалы</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Требуется:</span>
                      <span>{progressData.materials.totalRequired}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Доступно:</span>
                      <span className="text-green-600">{progressData.materials.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Недостает:</span>
                      <span className="text-red-600">{progressData.materials.missing}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Сроки */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Сроки</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Есть срок:</span>
                    <span>{progressData.hasDeadline ? 'Да' : 'Нет'}</span>
                  </div>
                  {progressData.isOverdue && (
                    <div className="flex justify-between">
                      <span>Статус:</span>
                      <span className="text-red-600">Просрочено</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
