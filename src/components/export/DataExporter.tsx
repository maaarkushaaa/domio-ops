import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExportConfig {
  data: any[];
  filename: string;
  headers?: string[];
}

export function DataExporter({ data, filename, headers }: ExportConfig) {
  const exportToCSV = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: 'Нет данных',
          description: 'Нет данных для экспорта',
          variant: 'destructive',
        });
        return;
      }

      const keys = headers || Object.keys(data[0]);
      const csvContent = [
        keys.join(','),
        ...data.map((item) =>
          keys.map((key) => {
            const value = item[key];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'Успешно экспортировано',
        description: `Файл ${link.download} успешно загружен`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive',
      });
    }
  };

  const exportToJSON = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: 'Нет данных',
          description: 'Нет данных для экспорта',
          variant: 'destructive',
        });
        return;
      }

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast({
        title: 'Успешно экспортировано',
        description: `Файл ${link.download} успешно загружен`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive',
      });
    }
  };

  const exportToExcel = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: 'Нет данных',
          description: 'Нет данных для экспорта',
          variant: 'destructive',
        });
        return;
      }

      const keys = headers || Object.keys(data[0]);
      
      // Simple Excel-compatible format (tab-separated)
      const excelContent = [
        keys.join('\t'),
        ...data.map((item) =>
          keys.map((key) => {
            const value = item[key];
            if (value === null || value === undefined) return '';
            return value;
          }).join('\t')
        ),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + excelContent], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
      link.click();

      toast({
        title: 'Успешно экспортировано',
        description: `Файл ${link.download} успешно загружен`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Экспорт в CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Экспорт в Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Экспорт в JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
