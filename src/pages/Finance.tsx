import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function Finance() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Финансы</h1>
          <p className="text-muted-foreground">Управленческий учет и планирование</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Экспорт</Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Новая операция
          </Button>
        </div>
      </div>

      {/* Балансы */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Общий баланс</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 234 567 ₽</div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.3% за месяц
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Доходы (месяц)</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">845 200 ₽</div>
            <p className="text-xs text-muted-foreground">+18% к прошлому</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Расходы (месяц)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">523 450 ₽</div>
            <p className="text-xs text-muted-foreground">-5% к прошлому</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Runway</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 мес</div>
            <p className="text-xs text-muted-foreground">при текущем burn-rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Операции</TabsTrigger>
          <TabsTrigger value="invoices">Инвойсы</TabsTrigger>
          <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
          <TabsTrigger value="budget">Бюджет</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Последние операции</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "10 Окт", description: "Оплата от клиента А123", category: "Продажи", amount: 125000, type: "income" },
                  { date: "9 Окт", description: "Закупка материалов Мебель+", category: "Производство", amount: -45000, type: "expense" },
                  { date: "8 Окт", description: "Подписка Adobe Creative Cloud", category: "Маркетинг", amount: -3500, type: "expense" },
                  { date: "7 Окт", description: "Оплата от клиента B456", category: "Продажи", amount: 85000, type: "income" },
                  { date: "6 Окт", description: "Аренда офиса", category: "Общее", amount: -35000, type: "expense" },
                  { date: "5 Окт", description: "Закупка фурнитуры", category: "Производство", amount: -15500, type: "expense" },
                ].map((op, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-xs text-muted-foreground">{op.date}</p>
                      </div>
                      <div>
                        <p className="font-medium">{op.description}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {op.category}
                        </Badge>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${op.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                      {op.amount > 0 ? '+' : ''}{op.amount.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Инвойсы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { number: "INV-1234", client: "ООО Интерьер", amount: 125000, status: "paid", date: "10 Окт", dueDate: "5 Окт" },
                  { number: "INV-1235", client: "ИП Петров", amount: 85000, status: "paid", date: "7 Окт", dueDate: "2 Окт" },
                  { number: "INV-1236", client: "ООО Дизайн Про", amount: 156000, status: "overdue", date: "28 Сен", dueDate: "5 Окт" },
                  { number: "INV-1237", client: "ИП Сидоров", amount: 92000, status: "sent", date: "12 Окт", dueDate: "17 Окт" },
                ].map((invoice, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invoice.number}</p>
                        <Badge
                          variant={
                            invoice.status === "paid"
                              ? "default"
                              : invoice.status === "overdue"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {invoice.status === "paid" ? "Оплачен" : invoice.status === "overdue" ? "Просрочен" : "Отправлен"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.client}</p>
                      <p className="text-xs text-muted-foreground">
                        Создан: {invoice.date} • Оплатить до: {invoice.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{invoice.amount.toLocaleString('ru-RU')} ₽</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Просмотр
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Активные подписки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Adobe Creative Cloud", amount: 3500, period: "Ежемесячно", nextPayment: "1 Ноя", status: "active" },
                  { name: "GitHub Team", amount: 4200, period: "Ежемесячно", nextPayment: "5 Ноя", status: "active" },
                  { name: "AWS", amount: 12000, period: "Ежемесячно", nextPayment: "15 Окт", status: "active" },
                  { name: "Figma Professional", amount: 2800, period: "Ежемесячно", nextPayment: "20 Окт", status: "expiring" },
                  { name: "Notion Team", amount: 1800, period: "Ежемесячно", nextPayment: "25 Окт", status: "active" },
                ].map((sub, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{sub.name}</p>
                        {sub.status === "expiring" && (
                          <Badge variant="outline" className="text-warning border-warning">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Истекает
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{sub.period}</p>
                      <p className="text-xs text-muted-foreground">Следующий платеж: {sub.nextPayment}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{sub.amount.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Итого в месяц</p>
                  <p className="text-xl font-bold">24 300 ₽</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Бюджет: Октябрь 2025</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: "Производство", planned: 200000, actual: 145000, color: "bg-accent" },
                  { category: "Маркетинг", planned: 80000, actual: 65000, color: "bg-primary" },
                  { category: "Разработка", planned: 120000, actual: 98000, color: "bg-success" },
                  { category: "Закупки", planned: 150000, actual: 125000, color: "bg-warning" },
                  { category: "Общее", planned: 100000, actual: 90000, color: "bg-muted-foreground" },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.category}</p>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {item.actual.toLocaleString('ru-RU')} ₽ / {item.planned.toLocaleString('ru-RU')} ₽
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((item.actual / item.planned) * 100)}% использовано
                        </p>
                      </div>
                    </div>
                    <Progress value={(item.actual / item.planned) * 100} className={item.color} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
