import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Phone, Mail, DollarSign, TrendingUp } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'won' | 'lost';
  value: number;
  probability: number;
}

export function CRMSystem() {
  const [leads] = useState<Lead[]>([
    {
      id: '1',
      name: 'Анна Петрова',
      company: 'ООО "Дизайн Интерьер"',
      email: 'anna@design.ru',
      phone: '+7 (999) 123-45-67',
      status: 'qualified',
      value: 450000,
      probability: 70,
    },
    {
      id: '2',
      name: 'Михаил Сидоров',
      company: 'Строй Холдинг',
      email: 'm.sidorov@stroi.ru',
      phone: '+7 (999) 234-56-78',
      status: 'negotiation',
      value: 850000,
      probability: 85,
    },
    {
      id: '3',
      name: 'Елена Иванова',
      company: 'Мебель Люкс',
      email: 'elena@mebel.ru',
      phone: '+7 (999) 345-67-89',
      status: 'new',
      value: 320000,
      probability: 30,
    },
  ]);

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-purple-500';
      case 'qualified': return 'bg-yellow-500';
      case 'negotiation': return 'bg-orange-500';
      case 'won': return 'bg-green-500';
      case 'lost': return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'contacted': return 'Контакт';
      case 'qualified': return 'Квалифицирован';
      case 'negotiation': return 'Переговоры';
      case 'won': return 'Закрыт';
      case 'lost': return 'Отказ';
    }
  };

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const expectedValue = leads.reduce((sum, lead) => sum + (lead.value * lead.probability / 100), 0);

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          CRM - Воронка продаж
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Всего лидов</p>
            <p className="text-xl font-bold text-primary">{leads.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">Потенциал</p>
            <p className="text-xl font-bold text-success">
              {(totalValue / 1000).toFixed(0)}к
            </p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-muted-foreground">Ожидаемо</p>
            <p className="text-xl font-bold text-warning">
              {(expectedValue / 1000).toFixed(0)}к
            </p>
          </div>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-2">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.company}</p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {getStatusText(lead.status)}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{lead.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span>{lead.value.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">{lead.probability}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button className="w-full hover-lift">
          <Users className="h-4 w-4 mr-2" />
          Добавить лида
        </Button>
      </CardContent>
    </Card>
  );
}
