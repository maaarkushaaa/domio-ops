import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Plus, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Version {
  id: string;
  version_number: number;
  title: string;
  changes_description?: string;
  created_at: string;
}

export function DocumentVersioning() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [newVersion, setNewVersion] = useState({ title: '', changes: '', content: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const documentId = 'demo-doc-1';

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    const { data, error } = await (supabase as any)
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error loading versions:', error);
    } else {
      setVersions(data || []);
    }
  };

  const createVersion = async () => {
    if (!newVersion.title) {
      toast({
        title: 'Ошибка',
        description: 'Введите название версии',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) + 1 : 1;

    const { error } = await (supabase as any).from('document_versions').insert({
      document_id: documentId,
      version_number: nextVersion,
      title: newVersion.title,
      content: newVersion.content,
      changes_description: newVersion.changes,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Версия создана',
        description: `Версия ${nextVersion} успешно сохранена`,
      });
      setNewVersion({ title: '', changes: '', content: '' });
      loadVersions();
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Версионирование документов
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-hidden flex flex-col">
        <div className="space-y-2">
          <Input
            placeholder="Название версии"
            value={newVersion.title}
            onChange={(e) => setNewVersion({ ...newVersion, title: e.target.value })}
          />
          <Textarea
            placeholder="Описание изменений"
            value={newVersion.changes}
            onChange={(e) => setNewVersion({ ...newVersion, changes: e.target.value })}
            rows={2}
          />
          <Button onClick={createVersion} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Создать новую версию
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{version.version_number}</Badge>
                    <span className="font-medium">{version.title}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {version.changes_description && (
                  <p className="text-sm text-muted-foreground">{version.changes_description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(version.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}