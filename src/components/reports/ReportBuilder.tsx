import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Trash2, Download, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'status';
  source: string;
}

interface ReportConfig {
  name: string;
  fields: ReportField[];
  filters: Array<{ field: string; operator: string; value: string }>;
}

export function ReportBuilder() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>({
    name: 'Новый отчет',
    fields: [],
    filters: [],
  });

  const [availableFields] = useState<ReportField[]>([
    { id: '1', name: 'Название задачи', type: 'text', source: 'tasks' },
    { id: '2', name: 'Статус', type: 'status', source: 'tasks' },
    { id: '3', name: 'Приоритет', type: 'status', source: 'tasks' },
    { id: '4', name: 'Дата создания', type: 'date', source: 'tasks' },
    { id: '5', name: 'Сумма операции', type: 'number', source: 'finance' },
    { id: '6', name: 'Тип операции', type: 'status', source: 'finance' },
    { id: '7', name: 'Название проекта', type: 'text', source: 'projects' },
    { id: '8', name: 'Бюджет', type: 'number', source: 'projects' },
  ]);

  const [draggedField, setDraggedField] = useState<string | null>(null);

  const addField = (field: ReportField) => {
    if (!config.fields.find(f => f.id === field.id)) {
      setConfig({
        ...config,
        fields: [...config.fields, field],
      });
    }
  };

  const removeField = (fieldId: string) => {
    setConfig({
      ...config,
      fields: config.fields.filter(f => f.id !== fieldId),
    });
  };

  const addFilter = () => {
    setConfig({
      ...config,
      filters: [
        ...config.filters,
        { field: '', operator: 'equals', value: '' },
      ],
    });
  };

  const updateFilter = (index: number, key: string, value: string) => {
    const newFilters = [...config.filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setConfig({ ...config, filters: newFilters });
  };

  const removeFilter = (index: number) => {
    setConfig({
      ...config,
      filters: config.filters.filter((_, i) => i !== index),
    });
  };

  const generateReport = () => {
    toast({
      title: 'Отчет сгенерирован',
      description: `Отчет "${config.name}" успешно создан`,
    });
  };

  const exportReport = () => {
    toast({
      title: 'Экспорт отчета',
      description: 'Отчет экспортируется в Excel',
    });
  };

  const handleDragStart = (fieldId: string) => {
    setDraggedField(fieldId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedField) {
      const field = availableFields.find(f => f.id === draggedField);
      if (field) {
        addField(field);
      }
      setDraggedField(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Конструктор отчетов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Name */}
        <div className="space-y-2">
          <Label>Название отчета</Label>
          <Input
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Available Fields */}
          <div className="space-y-3">
            <Label>Доступные поля</Label>
            <div className="border rounded-lg p-3 space-y-2 min-h-[200px]">
              {availableFields.map((field) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(field.id)}
                  className="flex items-center justify-between p-2 border rounded cursor-move hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{field.name}</span>
                  </div>
                  <Badge variant="outline">{field.source}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Fields */}
          <div className="space-y-3">
            <Label>Выбранные поля</Label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border rounded-lg p-3 space-y-2 min-h-[200px] border-dashed"
            >
              {config.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Перетащите поля сюда
                </div>
              ) : (
                config.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-2 border rounded bg-background"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="text-sm">{field.name}</span>
                      <Badge variant="secondary">{field.type}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Фильтры</Label>
            <Button size="sm" variant="outline" onClick={addFilter}>
              <Plus className="h-4 w-4 mr-1" />
              Добавить фильтр
            </Button>
          </div>
          <div className="space-y-2">
            {config.filters.map((filter, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Select
                  value={filter.field}
                  onValueChange={(value) => updateFilter(index, 'field', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Поле" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.fields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filter.operator}
                  onValueChange={(value) => updateFilter(index, 'operator', value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Равно</SelectItem>
                    <SelectItem value="not_equals">Не равно</SelectItem>
                    <SelectItem value="contains">Содержит</SelectItem>
                    <SelectItem value="greater">Больше</SelectItem>
                    <SelectItem value="less">Меньше</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Значение"
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className="flex-1"
                />

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFilter(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={generateReport} disabled={config.fields.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            Сгенерировать
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт в Excel
          </Button>
        </div>

        {/* Preview */}
        {config.fields.length > 0 && (
          <div className="space-y-2">
            <Label>Предпросмотр</Label>
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${config.fields.length}, 1fr)` }}>
                {config.fields.map((field) => (
                  <div key={field.id} className="font-medium text-sm">
                    {field.name}
                  </div>
                ))}
                {/* Sample Data Row */}
                {config.fields.map((field) => (
                  <div key={`sample-${field.id}`} className="text-sm text-muted-foreground">
                    {field.type === 'number' ? '1,234' : field.type === 'date' ? '01.01.2025' : 'Пример'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
