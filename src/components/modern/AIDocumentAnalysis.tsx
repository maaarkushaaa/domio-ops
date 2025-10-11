import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, TrendingUp } from "lucide-react";

export function AIDocumentAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-анализ документов
        </CardTitle>
        <CardDescription>
          Интеллектуальная обработка и извлечение данных
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <FileText className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Договор_2024_001.pdf</p>
              <p className="text-xs text-muted-foreground">Обработано AI • 95% точность</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>

          <div className="p-3 rounded-lg border">
            <p className="text-xs font-medium mb-2">Извлечено:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Сумма: 1 234 567 ₽</p>
              <p>• Срок: до 31.12.2024</p>
              <p>• Контрагент: ООО "Мебель+"</p>
              <p>• Условия оплаты: 30% аванс, 70% по завершению</p>
            </div>
          </div>
        </div>

        <Button size="sm" className="w-full gap-2">
          <Sparkles className="h-4 w-4" />
          Анализировать документ
        </Button>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Поддержка: PDF, DOC, XLS, JPG • OCR для сканов • Мультиязычность
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
