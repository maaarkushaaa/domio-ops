import { useState } from 'react';
import { Upload, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectCardDragDropProps {
  projectId: string;
  onFilesUploaded?: (files: File[]) => void;
}

export function ProjectCardDragDrop({ projectId, onFilesUploaded }: ProjectCardDragDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      toast({
        title: 'Файлы загружены',
        description: `Загружено ${files.length} файлов для проекта`,
      });
      onFilesUploaded?.(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`absolute inset-0 pointer-events-auto transition-all ${
        isDragging 
          ? 'bg-primary/20 border-2 border-primary border-dashed rounded-lg z-10' 
          : 'pointer-events-none'
      }`}
    >
      {isDragging && (
        <div className="flex flex-col items-center justify-center h-full">
          <Upload className="h-12 w-12 text-primary animate-bounce" />
          <p className="text-sm font-medium text-primary mt-2">Отпустите для загрузки</p>
        </div>
      )}
    </div>
  );
}
