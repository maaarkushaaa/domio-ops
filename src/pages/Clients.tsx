import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Mail } from "lucide-react";

export default function Clients() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Клиенты и сделки</h1>
          <p className="text-muted-foreground">Управление отношениями с клиентами</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Новый клиент
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активных сделок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего клиентов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125 000 ₽</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Клиенты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: "ООО Интерьер Плюс",
                contact: "Иванов Иван",
                phone: "+7 (999) 123-45-67",
                email: "ivan@interior.ru",
                deals: 3,
                status: "active",
              },
              {
                name: "ИП Петров А.С.",
                contact: "Петров Андрей",
                phone: "+7 (999) 234-56-78",
                email: "petrov@design.ru",
                deals: 2,
                status: "active",
              },
              {
                name: "ООО Дизайн Про",
                contact: "Сидорова Мария",
                phone: "+7 (999) 345-67-89",
                email: "maria@designpro.ru",
                deals: 5,
                status: "active",
              },
            ].map((client, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{client.name}</p>
                    <Badge variant="default">Активен</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{client.contact}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {client.email}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Сделок: {client.deals}</p>
                </div>
                <Button variant="outline" size="sm">
                  Открыть
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
