import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Share2, ThumbsUp, MessageCircle, TrendingUp, Eye } from 'lucide-react';

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'vk' | 'telegram';
  content: string;
  likes: number;
  comments: number;
  views: number;
  engagement: number;
  status: 'scheduled' | 'published' | 'draft';
  publishedAt?: string;
}

export function SocialMediaIntegration() {
  const [posts] = useState<SocialPost[]>([
    {
      id: '1',
      platform: 'instagram',
      content: 'Новая коллекция премиум мебели! 🪑✨',
      likes: 234,
      comments: 45,
      views: 3200,
      engagement: 8.7,
      status: 'published',
      publishedAt: '2025-10-08',
    },
    {
      id: '2',
      platform: 'facebook',
      content: 'Скидка 20% на кухонные гарнитуры до конца месяца!',
      likes: 156,
      comments: 23,
      views: 2100,
      engagement: 8.5,
      status: 'published',
      publishedAt: '2025-10-07',
    },
    {
      id: '3',
      platform: 'vk',
      content: 'Как выбрать идеальный шкаф? Читайте в нашем блоге',
      likes: 89,
      comments: 12,
      views: 1500,
      engagement: 6.7,
      status: 'scheduled',
    },
    {
      id: '4',
      platform: 'telegram',
      content: 'Эксклюзивное предложение для подписчиков канала',
      likes: 178,
      comments: 34,
      views: 2800,
      engagement: 7.6,
      status: 'draft',
    },
  ]);

  const getPlatformColor = (platform: SocialPost['platform']) => {
    switch (platform) {
      case 'instagram': return 'bg-pink-500';
      case 'facebook': return 'bg-blue-500';
      case 'vk': return 'bg-blue-600';
      case 'telegram': return 'bg-sky-500';
    }
  };

  const getPlatformName = (platform: SocialPost['platform']) => {
    switch (platform) {
      case 'instagram': return 'Instagram';
      case 'facebook': return 'Facebook';
      case 'vk': return 'ВКонтакте';
      case 'telegram': return 'Telegram';
    }
  };

  const getStatusText = (status: SocialPost['status']) => {
    switch (status) {
      case 'scheduled': return 'Запланирован';
      case 'published': return 'Опубликован';
      case 'draft': return 'Черновик';
    }
  };

  const totalEngagement = posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length;
  const totalReach = posts.reduce((sum, p) => sum + p.views, 0);

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Соцсети - Автопостинг
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Охват</p>
            <p className="text-2xl font-bold text-primary">
              {(totalReach / 1000).toFixed(1)}к
            </p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">Вовлеченность</p>
            <p className="text-2xl font-bold text-success">
              {totalEngagement.toFixed(1)}%
            </p>
          </div>
        </div>

        <ScrollArea className="h-72">
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <Badge className={getPlatformColor(post.platform)}>
                    {getPlatformName(post.platform)}
                  </Badge>
                  <Badge variant="outline">
                    {getStatusText(post.status)}
                  </Badge>
                </div>

                <p className="text-sm line-clamp-2">{post.content}</p>

                {post.status === 'published' && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/50">
                      <Eye className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs font-medium">{post.views}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <ThumbsUp className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs font-medium">{post.likes}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <MessageCircle className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs font-medium">{post.comments}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <TrendingUp className="h-3 w-3 mx-auto mb-1 text-primary" />
                      <p className="text-xs font-medium">{post.engagement}%</p>
                    </div>
                  </div>
                )}

                {post.publishedAt && (
                  <p className="text-xs text-muted-foreground">
                    Опубликовано: {new Date(post.publishedAt).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button className="w-full hover-lift">
          <Share2 className="h-4 w-4 mr-2" />
          Создать пост
        </Button>
      </CardContent>
    </Card>
  );
}
