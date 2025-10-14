import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { WallComposer } from '@/components/wall/WallComposer';
import { WallFeed } from '@/components/wall/WallFeed';
import { useWallRealtime } from '@/hooks/use-wall';

export default function Wall() {
  const [scope, setScope] = useState<'project' | 'task'>('project');
  const [scopeId, setScopeId] = useState<string>('');

  useWallRealtime(scope, scopeId);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-semibold">Стена</h1>
          <p className="text-xs text-gray-500">Обсуждения с вложениями, граффити и комментариями</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={(v) => setScope(v as 'project' | 'task')}>
            <SelectTrigger className="w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="project">Проект</SelectItem>
              <SelectItem value="task">Задача</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scopeId} onValueChange={setScopeId}>
            <SelectTrigger className="w-48 text-xs"><SelectValue placeholder={scope === 'project' ? 'Выберите проект' : 'Выберите задачу'} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="demo">Demo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { setScopeId(''); }}>Сброс</Button>
        </div>
      </div>

      <WallComposer scope={scope} scopeId={scopeId} />

      <WallFeed scope={scope} scopeId={scopeId} />
    </div>
  );
}
