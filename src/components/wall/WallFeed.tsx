import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallFeed } from '@/hooks/use-wall';
import { WallPost } from './WallPost';

export function WallFeed({ scope, scopeId }: { scope: 'project' | 'task'; scopeId?: string }) {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const { data: posts, isLoading } = useWallFeed(scope, scopeId, offset, limit);
  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (posts) {
      if (offset === 0) {
        setAllPosts(posts);
      } else {
        setAllPosts(prev => [...prev, ...posts]);
      }
      if (posts.length < limit) setHasMore(false);
    }
  }, [posts, offset]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setOffset(prev => prev + limit);
    }
  }, [inView, hasMore, isLoading]);

  useEffect(() => {
    setAllPosts([]);
    setOffset(0);
    setHasMore(true);
  }, [scope, scopeId]);

  if (isLoading && offset === 0) {
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
      {allPosts.length === 0 ? (
        <div className="bg-white border rounded shadow-sm p-4 text-sm text-gray-500">Постов пока нет. Создайте первый пост.</div>
      ) : (
        <>
          {allPosts.map((p) => <WallPost key={p.id} post={p} />)}
          {hasMore && (
            <div ref={ref} className="flex justify-center py-4">
              {isLoading && <Skeleton className="h-20 w-full" />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
