import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  projectId?: string;
  projectName?: string;
}

export function QRCodeGenerator({ projectId, projectName }: QRCodeGeneratorProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Generate QR code URL using a public API
  const projectUrl = projectId 
    ? `${window.location.origin}/projects/${projectId}`
    : window.location.href;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(projectUrl)}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${projectName || 'project'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'QR-код скачан',
      description: `QR-код для ${projectName || 'проекта'} сохранен`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-2" />
          QR-код
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR-код проекта</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 bg-white rounded-lg">
            <img 
              src={qrCodeUrl} 
              alt="QR Code"
              className="w-64 h-64"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {projectName || 'Отсканируйте для быстрого доступа'}
          </p>
          <div className="flex gap-2">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Скачать
            </Button>
            <Button variant="outline" onClick={() => {
              navigator.clipboard.writeText(projectUrl);
              toast({
                title: 'Ссылка скопирована',
                description: 'URL проекта скопирован в буфер обмена',
              });
            }}>
              Копировать ссылку
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
