import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download, Printer } from 'lucide-react';

interface ProductQRCodeProps {
  product: {
    id: string;
    name: string;
    sku?: string;
  };
}

export function ProductQRCode({ product }: ProductQRCodeProps) {
  const [open, setOpen] = useState(false);

  // Генерируем данные для QR-кода
  const qrData = JSON.stringify({
    id: product.id,
    name: product.name,
    sku: product.sku || '',
    url: `${window.location.origin}/production?product=${product.id}`,
    timestamp: new Date().toISOString(),
  });

  // Скачать QR-код как изображение
  const downloadQR = () => {
    const svg = document.getElementById(`qr-${product.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${product.sku || product.name}_${product.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Печать QR-кода
  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = document.getElementById(`qr-${product.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-код: ${product.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .info {
              font-size: 14px;
              color: #666;
              margin-top: 10px;
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${product.name}</h1>
            ${product.sku ? `<p class="info">Артикул: ${product.sku}</p>` : ''}
            <div class="qr-code">
              ${svgData}
            </div>
            <p class="info">ID: ${product.id}</p>
            <p class="info">Дата создания: ${new Date().toLocaleDateString('ru-RU')}</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-2" />
          QR-код
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR-код изделия</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
            <QRCodeSVG
              id={`qr-${product.id}`}
              value={qrData}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm">
              <p className="font-medium">{product.name}</p>
              {product.sku && (
                <p className="text-muted-foreground">Артикул: {product.sku}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                ID: {product.id}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadQR} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Скачать
            </Button>
            <Button onClick={printQR} variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Печать
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 QR-код содержит:</p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>ID изделия</li>
              <li>Название</li>
              <li>Артикул (SKU)</li>
              <li>Прямую ссылку на изделие</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
