import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Package, FileText, MessageSquare, Star } from 'lucide-react';

interface CustomerOrder {
  id: string;
  product: string;
  status: 'pending' | 'production' | 'quality_check' | 'completed';
  progress: number;
  date: string;
}

export function CustomerPortal() {
  const [orders] = useState<CustomerOrder[]>([
    {
      id: '1',
      product: 'Шкаф "Версаль"',
      status: 'production',
      progress: 75,
      date: '2025-09-15',
    },
    {
      id: '2',
      product: 'Комод "Классик"',
      status: 'quality_check',
      progress: 95,
      date: '2025-09-20',
    },
  ]);

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Здравствуйте! Когда будет готов мой заказ?',
      from: 'client',
      timestamp: '2025-10-09 14:30',
    },
    {
      id: '2',
      text: 'Добрый день! Ваш заказ в производстве, готовность 75%',
      from: 'manager',
      timestamp: '2025-10-09 14:35',
    },
  ]);

  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        text: newMessage,
        from: 'client',
        timestamp: new Date().toLocaleString('ru-RU'),
      },
    ]);
    setNewMessage('');
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Портал клиента
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Сообщения
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Документы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3">
            <ScrollArea className="h-64">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 mb-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{order.product}</p>
                    <Badge>{order.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-medium">{order.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Заказ от {new Date(order.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages" className="space-y-3">
            <ScrollArea className="h-52">
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.from === 'client'
                        ? 'bg-primary/10 ml-8'
                        : 'bg-muted/50 mr-8'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {msg.timestamp}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button onClick={sendMessage}>Отправить</Button>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {['Договор.pdf', 'Спецификация.pdf', 'Счет.pdf'].map((doc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc}</span>
                    </div>
                    <Button size="sm" variant="ghost">
                      Скачать
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
