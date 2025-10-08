import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('ru');
  const { toast } = useToast();

  const switchLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    const lang = languages.find(l => l.code === langCode);
    toast({
      title: 'Язык изменен',
      description: `Выбран язык: ${lang?.name}`,
    });
    // Here you would implement actual i18n switching
    // For example: i18n.changeLanguage(langCode);
  };

  const currentLanguage = languages.find(l => l.code === currentLang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className="hidden sm:inline">{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`gap-2 ${currentLang === lang.code ? 'bg-muted' : ''}`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
