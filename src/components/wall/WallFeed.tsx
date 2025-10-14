import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WallFeed({ scope, scopeId }: { scope: 'project' | 'task'; scopeId?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    setIsLoading(true);
    // TODO: fetch from supabase (wall_posts + comments + attachments) with filters
    const t = setTimeout(() => { setPosts([]); setIsLoading(false); }, 400);
    return () => clearTimeout(t);
  }, [scope, scopeId]);

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
        {posts.length === 0 ? (
          <div className="text-sm text-muted-foreground">Постов пока нет. Создайте первый пост.</div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <div key={p.id} className="border rounded p-3">Post</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
