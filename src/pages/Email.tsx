import { useState } from 'react';
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
  RefreshCw,
  ChevronLeft
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
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: i + 5,
    from: 'domio@example.com',
    subject: `Отправленное письмо ${i + 1}`,
    preview: 'Это отправленное письмо из архива...',
    date: `${i + 1} дн. назад`,
    read: true,
    starred: false,
    folder: 'sent' as const
  }))
];

export default function Email() {
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'starred' | 'archive' | 'trash'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composing, setComposing] = useState(false);
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', body: '' });
  const [mobileView, setMobileView] = useState<'folders' | 'list' | 'content'>('list');

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
    setMobileView('list');
  };

  const folders = [
    { id: 'inbox', label: 'Входящие', icon: Inbox, count: 4 },
    { id: 'sent', label: 'Отправленные', icon: Send, count: 12 },
    { id: 'starred', label: 'Помеченные', icon: Star, count: 1 },
    { id: 'archive', label: 'Архив', icon: Archive, count: 23 },
    { id: 'trash', label: 'Корзина', icon: Trash2, count: 5 }
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Почта</h1>
          <p className="text-muted-foreground">Корпоративная почта DOMIO</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => { 
            setComposing(true); 
            setSelectedEmail(null);
            setMobileView('content'); 
          }}>
            <Mail className="h-4 w-4 mr-2" />
            Написать
          </Button>
        </div>
      </div>

      {/* Email Interface */}
      <div className="flex-1 flex gap-0 bg-card border rounded-lg overflow-hidden">
        {/* Folders Sidebar */}
        <div className={`w-64 flex-shrink-0 border-r bg-card ${mobileView !== 'folders' ? 'hidden lg:flex' : 'flex'} flex-col`}>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск..." className="pl-9 h-9" />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="p-2">
              {folders.map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder.id as any);
                      setSelectedEmail(null);
                      setMobileView('list');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-left ${
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
                      <Badge 
                        variant={selectedFolder === folder.id ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {folder.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Email List */}
        <div className={`w-96 flex-shrink-0 border-r bg-card ${mobileView !== 'list' ? 'hidden lg:flex' : 'flex'} flex-col`}>
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden h-8 w-8"
                onClick={() => setMobileView('folders')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {folders.find(f => f.id === selectedFolder)?.label}
                <Badge variant="secondary" className="rounded-full">
                  {filteredEmails.length}
                </Badge>
              </h2>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="divide-y">
              {filteredEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    setComposing(false);
                    setMobileView('content');
                  }}
                  className={`w-full p-4 text-left transition-colors relative ${
                    selectedEmail?.id === email.id
                      ? 'bg-muted'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {!email.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-sm ${!email.read ? 'font-bold' : 'font-medium'}`}>
                      {email.from}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{email.date}</span>
                      {email.starred && <Star className="h-3 w-3 fill-warning text-warning" />}
                    </div>
                  </div>
                  <p className={`text-sm mb-1 ${!email.read ? 'font-semibold' : 'font-normal'}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {email.preview}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Email Content or Compose */}
        <div className={`flex-1 bg-card ${mobileView !== 'content' ? 'hidden lg:flex' : 'flex'} flex-col min-w-0`}>
          {composing ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden h-8 w-8"
                    onClick={() => setMobileView('list')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">Новое письмо</h2>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <Input
                  placeholder="Кому"
                  value={newEmail.to}
                  onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                  className="h-10"
                />
                <Input
                  placeholder="Тема"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  className="h-10"
                />
                <Textarea
                  placeholder="Сообщение..."
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                  className="min-h-[400px] resize-none"
                />
              </div>
              <div className="p-4 border-t flex items-center justify-between">
                <Button variant="outline" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setComposing(false);
                    setMobileView('list');
                  }}>
                    Отмена
                  </Button>
                  <Button onClick={handleSendEmail}>
                    <Send className="h-4 w-4 mr-2" />
                    Отправить
                  </Button>
                </div>
              </div>
            </>
          ) : selectedEmail ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="lg:hidden h-8 w-8 flex-shrink-0"
                      onClick={() => setMobileView('list')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold mb-2 break-words">
                        {selectedEmail.subject}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">От: {selectedEmail.from}</span>
                        <span>•</span>
                        <span>{selectedEmail.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Star className={`h-4 w-4 ${selectedEmail.starred ? "fill-warning text-warning" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">
                    {selectedEmail.preview}
                    {'\n\n'}
                    Это демонстрационное письмо. Полный текст письма будет отображаться здесь.
                    {'\n\n'}
                    С уважением,{'\n'}
                    {selectedEmail.from}
                  </p>
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Ответить
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward className="h-4 w-4 mr-2" />
                    Переслать
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Архивировать
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedEmail(null);
                      setMobileView('list');
                      toast({
                        title: 'Письмо удалено',
                        description: 'Письмо перемещено в корзину'
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-3">
                <Mail className="h-16 w-16 mx-auto opacity-20" />
                <p className="text-lg">Выберите письмо для просмотра</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
