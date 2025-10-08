import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, TrendingUp } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";

export default function Clients() {
  const { clients, deals, isLoading } = useClients();

  const getClientDealCount = (clientId: string) => {
    return deals.filter(d => d.client_id === clientId).length;
  };

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Клиенты и сделки</h1>
          <p className="text-muted-foreground">Управление отношениями с клиентами</p>
        </div>
        <ClientDialog trigger={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Новый клиент
          </Button>
        } />
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

      {/* Список клиентов */}
      <Card>
        <CardHeader>
          <CardTitle>Клиенты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{client.name}</h3>
                        <Badge variant="outline">Активен</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {client.contact_person && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Контакт:</span>
                            <span>{client.contact_person}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{client.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Сделки</p>
                        <p className="text-2xl font-bold flex items-center gap-1">
                          {getClientDealCount(client.id)}
                          <TrendingUp className="h-4 w-4 text-success" />
                        </p>
                      </div>
                      <ClientDetailsDialog 
                        client={client}
                        trigger={<Button>Открыть</Button>}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
