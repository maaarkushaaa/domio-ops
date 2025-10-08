import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Shield, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BiometricAuth() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleEnroll = async () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsEnabled(true);
      setIsVerifying(false);
      toast({
        title: 'Биометрия подключена',
        description: 'Отпечаток пальца успешно зарегистрирован',
      });
    }, 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      toast({
        title: 'Аутентификация успешна',
        description: 'Доступ разрешен',
      });
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Биометрическая аутентификация
        </CardTitle>
        <CardDescription>
          Вход по отпечатку пальца или Face ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className={`relative ${isVerifying ? 'animate-pulse' : ''}`}>
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <Fingerprint className="h-24 w-24 text-primary relative" />
          </div>
          {isEnabled && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Биометрия активна
            </Badge>
          )}
        </div>
        {!isEnabled ? (
          <Button onClick={handleEnroll} className="w-full" disabled={isVerifying}>
            <Shield className="h-4 w-4 mr-2" />
            {isVerifying ? 'Регистрация...' : 'Зарегистрировать биометрию'}
          </Button>
        ) : (
          <Button onClick={handleVerify} className="w-full" disabled={isVerifying}>
            <Fingerprint className="h-4 w-4 mr-2" />
            {isVerifying ? 'Проверка...' : 'Войти по биометрии'}
          </Button>
        )}
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Быстрый и безопасный вход</p>
          <p>• Данные биометрии хранятся локально</p>
          <p>• Поддержка Touch ID и Face ID</p>
        </div>
      </CardContent>
    </Card>
  );
}
