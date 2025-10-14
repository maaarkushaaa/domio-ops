import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallFeed } from '@/hooks/use-wall';

export function WallFeed({ scope, scopeId }: { scope: 'project' | 'task'; scopeId?: string }) {
  const { data: posts, isLoading } = useWallFeed(scope, scopeId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Лента</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[0,1,2].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Лента</CardTitle>
      </CardHeader>
      <CardContent>
        {!posts || posts.length === 0 ? (
          <div className="text-sm text-muted-foreground">Постов пока нет. Создайте первый пост.</div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <div key={p.id} className="border rounded p-3 space-y-2">
                <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString('ru-RU')}</div>
                <div className="whitespace-pre-wrap text-sm">{p.content}</div>
                {p.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.attachments.map((a) => (
                      <div key={a.id} className="rounded border overflow-hidden">
                        {a.type === 'image' ? (
                          <img src={a.url} alt="att" className="max-h-56" />
                        ) : a.type === 'video' ? (
                          <video src={a.url} controls className="max-h-56" />
                        ) : (
                          <a href={a.url} target="_blank" rel="noreferrer" className="text-xs p-2 inline-block">Вложение</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">Комментариев: {p.comments_count}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
