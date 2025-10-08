import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Archive, 
  Search,
  Paperclip,
  MoreVertical,
  Reply,
  Forward,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Email {
  id: number;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'starred' | 'archive' | 'trash';
}

const mockEmails: Email[] = [
  {
    id: 1,
    from: 'client@domio.ru',
    subject: 'Запрос по проекту кухни',
    preview: 'Здравствуйте! Хотел бы уточнить сроки выполнения проекта...',
    date: '10:30',
    read: false,
    starred: true,
    folder: 'inbox'
  },
  {
    id: 2,
    from: 'supplier@wood.com',
    subject: 'Поставка материалов',
    preview: 'Подтверждаем отправку материалов согласно заказу #12345...',
    date: '09:15',
    read: true,
    starred: false,
    folder: 'inbox'
  },
  {
    id: 3,
    from: 'team@domio.ru',
    subject: 'Совещание в 14:00',
    preview: 'Напоминаем о совещании по проекту в 14:00 в конференц-зале...',
    date: 'Вчера',
    read: true,
    starred: false,
    folder: 'inbox'
  },
  {
    id: 4,
    from: 'info@domio.ru',
    subject: 'Новая задача назначена',
    preview: 'Вам назначена новая задача: Проверка 3D моделей гостиной...',
    date: '2 дня назад',
    read: false,
    starred: false,
    folder: 'inbox'
  }
];

export default function Email() {
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'starred' | 'archive' | 'trash'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composing, setComposing] = useState(false);
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', body: '' });

  const filteredEmails = mockEmails.filter(email => {
    if (selectedFolder === 'starred') return email.starred;
    return email.folder === selectedFolder;
  });

  const handleSendEmail = () => {
    if (!newEmail.to || !newEmail.subject || !newEmail.body) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Письмо отправлено',
      description: `Письмо отправлено на ${newEmail.to}`
    });

    setNewEmail({ to: '', subject: '', body: '' });
    setComposing(false);
  };

  const folders = [
    { id: 'inbox', label: 'Входящие', icon: Inbox, count: 4 },
    { id: 'sent', label: 'Отправленные', icon: Send, count: 12 },
    { id: 'starred', label: 'Помеченные', icon: Star, count: 1 },
    { id: 'archive', label: 'Архив', icon: Archive, count: 23 },
    { id: 'trash', label: 'Корзина', icon: Trash2, count: 5 }
  ];

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Почта</h1>
          <p className="text-muted-foreground">Корпоративная почта DOMIO</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setComposing(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Написать
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Folders Sidebar */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-1 p-4">
                {folders.map((folder) => {
                  const Icon = folder.icon;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id as any)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedFolder === folder.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{folder.label}</span>
                      </div>
                      {folder.count > 0 && (
                        <Badge variant={selectedFolder === folder.id ? "secondary" : "outline"}>
                          {folder.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Email List */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {folders.find(f => f.id === selectedFolder)?.label}
              <Badge variant="secondary">{filteredEmails.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-1 p-2">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedEmail?.id === email.id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    } ${!email.read ? 'border-l-4 border-primary' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-sm ${!email.read ? 'font-bold' : 'font-medium'}`}>
                        {email.from}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{email.date}</span>
                        {email.starred && <Star className="h-3 w-3 fill-warning text-warning" />}
                      </div>
                    </div>
                    <p className={`text-sm mb-1 ${!email.read ? 'font-semibold' : ''}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {email.preview}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Email Content or Compose */}
        <Card className="col-span-5">
          {composing ? (
            <>
              <CardHeader>
                <CardTitle>Новое письмо</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Кому"
                    value={newEmail.to}
                    onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Тема"
                    value={newEmail.subject}
                    onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Сообщение..."
                    rows={12}
                    value={newEmail.body}
                    onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setComposing(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleSendEmail}>
                      <Send className="h-4 w-4 mr-2" />
                      Отправить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : selectedEmail ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{selectedEmail.subject}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>От: {selectedEmail.from}</span>
                      <span>•</span>
                      <span>{selectedEmail.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Star className={selectedEmail.starred ? "fill-warning text-warning" : ""} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <ScrollArea className="h-[calc(100vh-28rem)]">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedEmail.preview}
                    {'\n\n'}
                    Это демонстрационное письмо. Полный текст письма будет отображаться здесь.
                    {'\n\n'}
                    С уважением,{'\n'}
                    {selectedEmail.from}
                  </p>
                </ScrollArea>
                <Separator className="my-4" />
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Reply className="h-4 w-4 mr-2" />
                    Ответить
                  </Button>
                  <Button variant="outline">
                    <Forward className="h-4 w-4 mr-2" />
                    Переслать
                  </Button>
                  <Button variant="outline">
                    <Archive className="h-4 w-4 mr-2" />
                    Архивировать
                  </Button>
                  <Button variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Mail className="h-12 w-12 mx-auto opacity-20" />
                <p>Выберите письмо для просмотра</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
