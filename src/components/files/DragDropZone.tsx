import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DragDropZoneProps {
  onFilesAdded?: (files: File[]) => void;
}

export function DragDropZone({ onFilesAdded }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
    onFilesAdded?.(droppedFiles);
    
    toast({
      title: 'Файлы загружены',
      description: `Добавлено файлов: ${droppedFiles.length}`,
    });
  }, [onFilesAdded, toast]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-8 border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Upload className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-lg font-medium">
              {isDragging ? 'Отпустите файлы' : 'Перетащите файлы сюда'}
            </p>
            <p className="text-sm text-muted-foreground">
              или выберите файлы с компьютера
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              setFiles(prev => [...prev, ...files]);
              onFilesAdded?.(files);
              toast({
                title: 'Файлы выбраны',
                description: `Добавлено файлов: ${files.length}`,
              });
            };
            input.click();
          }}>
            Выбрать файлы
          </Button>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Загруженные файлы ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
