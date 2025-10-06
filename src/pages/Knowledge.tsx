import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, BookOpen, Search, FileText, Wrench, CheckSquare } from "lucide-react";

export default function Knowledge() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">База знаний</h1>
          <p className="text-muted-foreground">Процессы, инструкции и чек-листы</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Новая статья
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск в базе знаний..."
          className="pl-9"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-accent" />
              <CardTitle>Производственные процессы</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Workflow 3D-моделирования",
              "Создание UV-развертки",
              "Подготовка файлов для производства",
              "Генерация DXF и карт присадок",
              "Контроль качества моделей",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <CardTitle>Чек-листы</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Чек-лист качества 3D-модели",
              "Приемка материалов на склад",
              "Проверка перед отгрузкой",
              "Онбординг нового сотрудника",
              "Запуск производства партии",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-success" />
              <CardTitle>Стандарты и нормативы</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Стандарты именования файлов",
              "Технические требования к моделям",
              "Правила работы со складом",
              "Финансовые политики",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-warning" />
              <CardTitle>Шаблоны</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Шаблон проекта мебели",
              "Шаблон BOM",
              "Шаблон заказа поставщику",
              "Шаблон спринта",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
