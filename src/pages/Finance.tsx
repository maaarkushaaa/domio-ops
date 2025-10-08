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
import { useFinance } from "@/hooks/use-finance";
import { useAccounts } from "@/hooks/use-accounts";
import { OperationDialog } from "@/components/finance/OperationDialog";
import { BudgetEditDialog } from "@/components/finance/BudgetEditDialog";
import { SubscriptionDialog } from "@/components/finance/SubscriptionDialog";

export default function Finance() {
  const { operations, invoices } = useFinance();
  const { defaultAccount } = useAccounts();

  const totalBalance = 1234567; // Placeholder - should be calculated from accounts
  const monthIncome = operations
    .filter(op => op.type === 'income')
    .reduce((sum, op) => sum + op.amount, 0);
  const monthExpense = operations
    .filter(op => op.type === 'expense')
    .reduce((sum, op) => sum + op.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Финансы</h1>
          <p className="text-muted-foreground">Управленческий учет и планирование</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Экспорт</Button>
          {defaultAccount && (
            <OperationDialog 
              accountId={defaultAccount.id}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Новая операция
                </Button>
              }
            />
          )}
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
            <div className="text-2xl font-bold">{totalBalance.toLocaleString('ru-RU')} ₽</div>
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
            <div className="text-2xl font-bold">{monthIncome.toLocaleString('ru-RU')} ₽</div>
            <p className="text-xs text-muted-foreground">+18% к прошлому</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Расходы (месяц)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthExpense.toLocaleString('ru-RU')} ₽</div>
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
                {operations.slice(0, 10).map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-xs text-muted-foreground">
                          {new Date(op.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{op.description}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {op.category}
                        </Badge>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${op.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                      {op.type === 'income' ? '+' : '-'}{op.amount.toLocaleString('ru-RU')} ₽
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
                {invoices.map((invoice) => {
                  const getStatusLabel = (status: string) => {
                    switch (status) {
                      case 'paid': return 'Оплачен';
                      case 'sent': return 'Отправлен';
                      case 'overdue': return 'Просрочен';
                      case 'draft': return 'Черновик';
                      case 'cancelled': return 'Отменен';
                      default: return status;
                    }
                  };

                  return (
                    <div
                      key={invoice.id}
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
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.client?.name || 'Клиент не указан'}</p>
                        <p className="text-xs text-muted-foreground">
                          Создан: {new Date(invoice.issue_date).toLocaleDateString('ru-RU')} • 
                          Оплатить до: {new Date(invoice.due_date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{invoice.amount.toLocaleString('ru-RU')} ₽</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Просмотр
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Активные подписки</CardTitle>
              <SubscriptionDialog />
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.category}</p>
                        <BudgetEditDialog 
                          category={item.category}
                          planned={item.planned}
                          onSave={(newPlanned) => {
                            // In real app, this would update state
                            console.log('Updated budget:', item.category, newPlanned);
                          }}
                        />
                      </div>
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
