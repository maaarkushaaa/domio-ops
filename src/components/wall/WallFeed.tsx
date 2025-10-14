import { Skeleton } from '@/components/ui/skeleton';
import { useWallFeed } from '@/hooks/use-wall';
import { WallPost } from './WallPost';

export function WallFeed({ scope, scopeId }: { scope: 'project' | 'task'; scopeId?: string }) {
  const { data: posts, isLoading } = useWallFeed(scope, scopeId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0,1,2].map(i => (
          <div key={i} className="bg-white border rounded shadow-sm p-4 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!posts || posts.length === 0 ? (
        <div className="bg-white border rounded shadow-sm p-4 text-sm text-gray-500">Постов пока нет. Создайте первый пост.</div>
      ) : (
        posts.map((p) => <WallPost key={p.id} post={p} />)
      )}
    </div>
  );
}
