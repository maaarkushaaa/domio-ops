import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, DollarSign, Target, Users } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  marketShare: number;
  avgPrice: number;
  customerRating: number;
  strengths: string[];
  weaknesses: string[];
}

export function CompetitorAnalysis() {
  const competitors: Competitor[] = [
    {
      id: '1',
      name: 'МебельМастер',
      marketShare: 28,
      avgPrice: 450000,
      customerRating: 4.5,
      strengths: ['Быстрое производство', 'Низкие цены'],
      weaknesses: ['Ограниченный дизайн'],
    },
    {
      id: '2',
      name: 'Элит Мебель',
      marketShare: 35,
      avgPrice: 780000,
      customerRating: 4.8,
      strengths: ['Премиум качество', 'Уникальный дизайн'],
      weaknesses: ['Высокая цена', 'Долгие сроки'],
    },
    {
      id: '3',
      name: 'Ваша компания',
      marketShare: 22,
      avgPrice: 520000,
      customerRating: 4.6,
      strengths: ['Гибкость', 'Индивидуальный подход'],
      weaknesses: ['Маркетинг', 'Масштабируемость'],
    },
    {
      id: '4',
      name: 'Модерн Стайл',
      marketShare: 15,
      avgPrice: 380000,
      customerRating: 4.2,
      strengths: ['Современный дизайн'],
      weaknesses: ['Качество материалов'],
    },
  ];

  const totalMarketShare = competitors.reduce((sum, c) => sum + c.marketShare, 0);

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Анализ конкурентов
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-2">Ваша доля рынка</p>
          <p className="text-3xl font-bold text-primary">
            {competitors.find(c => c.name === 'Ваша компания')?.marketShare}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            #3 из {competitors.length} конкурентов
          </p>
        </div>

        <ScrollArea className="h-80">
          <div className="space-y-3">
            {competitors.sort((a, b) => b.marketShare - a.marketShare).map((competitor, index) => (
              <div
                key={competitor.id}
                className={`p-4 rounded-lg border space-y-3 animate-fade-in ${
                  competitor.name === 'Ваша компания'
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted/50 border-border/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{competitor.name}</p>
                        {competitor.name === 'Ваша компания' && (
                          <Badge variant="default" className="text-xs mt-1">Вы</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-muted/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-lg font-bold">{competitor.marketShare}%</p>
                    <p className="text-xs text-muted-foreground">Доля</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-success" />
                    </div>
                    <p className="text-lg font-bold">{(competitor.avgPrice / 1000).toFixed(0)}к</p>
                    <p className="text-xs text-muted-foreground">Цена</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-3 w-3 text-warning" />
                    </div>
                    <p className="text-lg font-bold">{competitor.customerRating}</p>
                    <p className="text-xs text-muted-foreground">Рейтинг</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">✅ Сильные стороны:</p>
                    <div className="flex flex-wrap gap-1">
                      {competitor.strengths.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">⚠️ Слабые стороны:</p>
                    <div className="flex flex-wrap gap-1">
                      {competitor.weaknesses.map((w, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Доля на рынке</span>
                    <span className="font-medium">{competitor.marketShare}%</span>
                  </div>
                  <Progress value={competitor.marketShare} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
