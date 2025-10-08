import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Download, Eye } from "lucide-react";
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";
import { useToast } from "@/hooks/use-toast";

export default function Documents() {
  const { toast } = useToast();

  const handleView = (docName: string) => {
    // Открываем документ в новой вкладке (демо)
    window.open('https://example.com/document', '_blank');
    toast({
      title: 'Просмотр документа',
      description: `Открыт: ${docName}`,
    });
  };

  const handleDownload = (docName: string) => {
    // Создаем фиктивную ссылку для скачивания
    const link = document.createElement('a');
    link.href = '#';
    link.download = docName + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Загрузка начата',
      description: `Скачивание: ${docName}`,
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Документы</h1>
          <p className="text-muted-foreground">Юридические документы и контракты</p>
        </div>
        <DocumentUploadDialog trigger={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Загрузить документ
          </Button>
        } />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего документов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">На подписи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Подписано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Документы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: "Договор с ООО Интерьер",
                type: "Договор",
                date: "15 Окт 2025",
                status: "signed",
                size: "1.2 MB",
              },
              {
                name: "НДА с подрядчиком",
                type: "НДА",
                date: "10 Окт 2025",
                status: "pending",
                size: "450 KB",
              },
              {
                name: "Акт приемки работ",
                type: "Акт",
                date: "8 Окт 2025",
                status: "signed",
                size: "850 KB",
              },
              {
                name: "Счет-фактура #123",
                type: "Счет",
                date: "5 Окт 2025",
                status: "signed",
                size: "320 KB",
              },
            ].map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{doc.name}</p>
                      <Badge
                        variant={doc.status === "signed" ? "default" : "outline"}
                      >
                        {doc.status === "signed" ? "Подписан" : "На подписи"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {doc.type}
                      </Badge>
                      <span>•</span>
                      <span>{doc.date}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(doc.name)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
