import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, TrendingUp, DollarSign, Package, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { DataExporter } from "@/components/export/DataExporter";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useFinance } from "@/hooks/use-finance";

const reports = [
  {
    id: 1,
    name: "Финансовый отчет за октябрь",
    type: "financial",
    date: "2025-10-08",
    status: "ready",
    size: "2.4 MB",
  },
  {
    id: 2,
    name: "Отчет по проектам Q3 2025",
    type: "projects",
    date: "2025-09-30",
    status: "ready",
    size: "1.8 MB",
  },
  {
    id: 3,
    name: "Инвентаризация склада",
    type: "inventory",
    date: "2025-10-05",
    status: "ready",
    size: "980 KB",
  },
  {
    id: 4,
    name: "Отчет по клиентам",
    type: "clients",
    date: "2025-10-01",
    status: "processing",
    size: "-",
  },
];

export default function Reports() {
  const [reportType, setReportType] = useState("all");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'projects': return <TrendingUp className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'clients': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'financial': return 'Финансовый';
      case 'projects': return 'Проекты';
      case 'inventory': return 'Склад';
      case 'clients': return 'Клиенты';
      default: return 'Другое';
    }
  };

  const filteredReports = reportType === 'all' 
    ? reports 
    : reports.filter(r => r.type === reportType);

  const handleDownloadReport = (report: typeof reports[0]) => {
    // Generate CSV data
    const csvData = `DOMIO Ops - ${report.name}\nДата: ${report.date}\nТип: ${getTypeName(report.type)}\n\nДанные отчета...`;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${report.name}.csv`;
    link.click();
    
    toast({
      title: 'Отчет загружен',
      description: `Файл ${report.name}.csv сохранен`
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: 'Генерация отчета',
      description: 'Отчет будет готов через несколько минут'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Отчеты</h1>
          <p className="text-muted-foreground">Генерация и загрузка отчетов</p>
        </div>
        <Button onClick={handleGenerateReport}>
          <FileText className="mr-2 h-4 w-4" />
          Создать отчет
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Всего отчетов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground mt-1">
              За последний месяц
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Готовы к загрузке</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              Доступны сейчас
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">В обработке</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              Будут готовы скоро
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Запланировано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Автоматическая генерация
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Доступные отчеты</CardTitle>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Тип отчета" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все отчеты</SelectItem>
                <SelectItem value="financial">Финансовые</SelectItem>
                <SelectItem value="projects">Проекты</SelectItem>
                <SelectItem value="inventory">Склад</SelectItem>
                <SelectItem value="clients">Клиенты</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredReports.map(report => (
              <div 
                key={report.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getTypeIcon(report.type)}
                  </div>
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.date).toLocaleDateString('ru-RU')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeName(report.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {report.size}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
                    {report.status === 'ready' ? 'Готов' : 'Обработка'}
                  </Badge>
                  {report.status === 'ready' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadReport(report)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Популярные отчеты</CardTitle>
            <CardDescription>Быстрый доступ к часто используемым отчетам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              Финансовый отчет за месяц
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Package className="mr-2 h-4 w-4" />
              Складские остатки
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Прогресс по проектам
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Автоматические отчеты</CardTitle>
            <CardDescription>Настройте регулярную генерацию отчетов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm">Финансовый отчет</span>
              </div>
              <span className="text-xs text-muted-foreground">Еженедельно</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm">Инвентаризация</span>
              </div>
              <span className="text-xs text-muted-foreground">Ежемесячно</span>
            </div>
            <Button variant="outline" className="w-full">
              Настроить автоотчеты
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
