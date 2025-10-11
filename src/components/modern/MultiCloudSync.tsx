import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Check } from "lucide-react";

export function MultiCloudSync() {
  const cloudServices = [
    { name: "Google Drive", status: "synced", files: 1234 },
    { name: "Dropbox", status: "synced", files: 567 },
    { name: "OneDrive", status: "synced", files: 890 },
    { name: "AWS S3", status: "synced", files: 2341 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Multi-Cloud синхронизация
        </CardTitle>
        <CardDescription>
          Единая точка доступа ко всем облачным хранилищам
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {cloudServices.map((service, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Cloud className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.files} файлов</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Check className="h-3 w-3" />
              Синхронизировано
            </Badge>
          </div>
        ))}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Автоматическая синхронизация • Версионирование • Резервное копирование
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
