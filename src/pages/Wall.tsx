import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { WallComposer } from '@/components/wall/WallComposer';
import { WallFeed } from '@/components/wall/WallFeed';

export default function Wall() {
  const [scope, setScope] = useState<'project' | 'task'>('project');
  const [scopeId, setScopeId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Стена</h1>
          <p className="text-muted-foreground">Обсуждения с вложениями, граффити и комментариями</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={(v) => setScope(v as 'project' | 'task')}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="project">Проект</SelectItem>
              <SelectItem value="task">Задача</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scopeId} onValueChange={setScopeId}>
            <SelectTrigger className="w-64"><SelectValue placeholder={scope === 'project' ? 'Выберите проект' : 'Выберите задачу'} /></SelectTrigger>
            <SelectContent>
              {/* Подключим реальные списки позже */}
              <SelectItem value="demo">Demo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setScopeId(''); }}>Сброс</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Создать пост</CardTitle>
        </CardHeader>
        <CardContent>
          <WallComposer scope={scope} scopeId={scopeId} />
        </CardContent>
      </Card>

      <WallFeed scope={scope} scopeId={scopeId} />
    </div>
  );
}
