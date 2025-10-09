import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Send, Users, TrendingUp, Calendar, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  recipients: number;
  opened: number;
  clicked: number;
  scheduled?: string;
}

export function AutomatedMarketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Акция на кухни',
      subject: 'Скидка 20% на кухонную мебель',
      status: 'active',
      recipients: 350,
      opened: 187,
      clicked: 45,
      scheduled: '2025-10-15',
    },
    {
      id: '2',
      name: 'Новая коллекция',
      subject: 'Представляем новую коллекцию "Модерн"',
      status: 'completed',
      recipients: 420,
      opened: 298,
      clicked: 89,
    },
  ]);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
  });

  const { toast } = useToast();

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.subject) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и тему письма',
        variant: 'destructive',
      });
      return;
    }

    const campaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      subject: newCampaign.subject,
      status: 'draft',
      recipients: 0,
      opened: 0,
      clicked: 0,
    };

    setCampaigns([campaign, ...campaigns]);
    setNewCampaign({ name: '', subject: '', content: '' });
    toast({
      title: 'Кампания создана',
      description: 'Новая email-кампания добавлена',
    });
  };

  const toggleCampaign = (id: string) => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === 'active' ? 'paused' : 'active',
            }
          : c
      )
    );
  };

  const getOpenRate = (campaign: Campaign) => {
    if (campaign.recipients === 0) return 0;
    return Math.round((campaign.opened / campaign.recipients) * 100);
  };

  const getClickRate = (campaign: Campaign) => {
    if (campaign.opened === 0) return 0;
    return Math.round((campaign.clicked / campaign.opened) * 100);
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Email-маркетинг
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3">
          <Input
            placeholder="Название кампании"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
          />
          <Input
            placeholder="Тема письма"
            value={newCampaign.subject}
            onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
          />
          <Textarea
            placeholder="Текст письма"
            value={newCampaign.content}
            onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
            rows={3}
          />
          <Button onClick={createCampaign} className="w-full hover-lift">
            <Send className="h-4 w-4 mr-2" />
            Создать кампанию
          </Button>
        </div>

        <ScrollArea className="h-80">
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const openRate = getOpenRate(campaign);
              const clickRate = getClickRate(campaign);

              return (
                <div
                  key={campaign.id}
                  className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3 animate-fade-in"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.subject}</p>
                    </div>
                    <Badge
                      variant={
                        campaign.status === 'active'
                          ? 'default'
                          : campaign.status === 'completed'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {campaign.status === 'active'
                        ? 'Активна'
                        : campaign.status === 'completed'
                        ? 'Завершена'
                        : campaign.status === 'paused'
                        ? 'Пауза'
                        : 'Черновик'}
                    </Badge>
                  </div>

                  {campaign.scheduled && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Запланирована на{' '}
                      {new Date(campaign.scheduled).toLocaleDateString('ru-RU')}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Получатели
                      </p>
                      <p className="font-medium">{campaign.recipients}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Открытия</p>
                      <p className="font-medium">
                        {campaign.opened} ({openRate}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Клики</p>
                      <p className="font-medium">
                        {campaign.clicked} ({clickRate}%)
                      </p>
                    </div>
                  </div>

                  {campaign.status !== 'completed' && campaign.status !== 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => toggleCampaign(campaign.id)}
                    >
                      {campaign.status === 'active' ? (
                        <>
                          <Pause className="h-3 w-3 mr-2" />
                          Приостановить
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-2" />
                          Запустить
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
