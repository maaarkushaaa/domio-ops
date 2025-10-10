import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, Target, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  companyName: string;
  industry: string;
  teamSize: string;
  goals: string;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    industry: '',
    teamSize: '',
    goals: '',
  });
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data);
      toast({
        title: 'Настройка завершена!',
        description: 'Добро пожаловать в DOMIO Ops',
      });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData({ ...data, [field]: value });
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.companyName.length > 0;
      case 2:
        return data.industry.length > 0;
      case 3:
        return data.teamSize.length > 0;
      case 4:
        return data.goals.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">{step}</span>
              </div>
              <div>
                <CardTitle>Настройка DOMIO Ops</CardTitle>
                <CardDescription>Шаг {step} из {totalSteps}</CardDescription>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">О вашей компании</h3>
                  <p className="text-sm text-muted-foreground">Расскажите нам о вашем бизнесе</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Название компании</Label>
                <Input
                  id="companyName"
                  placeholder="ООО «Мебельная фабрика»"
                  value={data.companyName}
                  onChange={(e) => updateData('companyName', e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ваша отрасль</h3>
                  <p className="text-sm text-muted-foreground">Какой тип производства у вас?</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Отрасль</Label>
                <Select value={data.industry} onValueChange={(value) => updateData('industry', value)}>
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Выберите отрасль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furniture">Мебельное производство</SelectItem>
                    <SelectItem value="construction">Строительство</SelectItem>
                    <SelectItem value="manufacturing">Производство</SelectItem>
                    <SelectItem value="design">Дизайн интерьеров</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Размер команды</h3>
                  <p className="text-sm text-muted-foreground">Сколько человек работает в компании?</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Количество сотрудников</Label>
                <Select value={data.teamSize} onValueChange={(value) => updateData('teamSize', value)}>
                  <SelectTrigger id="teamSize">
                    <SelectValue placeholder="Выберите размер команды" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 человек</SelectItem>
                    <SelectItem value="11-50">11-50 человек</SelectItem>
                    <SelectItem value="51-200">51-200 человек</SelectItem>
                    <SelectItem value="201-500">201-500 человек</SelectItem>
                    <SelectItem value="500+">Более 500 человек</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ваши цели</h3>
                  <p className="text-sm text-muted-foreground">Что вы хотите улучшить?</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goals">Основные цели</Label>
                <Textarea
                  id="goals"
                  placeholder="Например: автоматизация производства, улучшение контроля качества, оптимизация склада..."
                  value={data.goals}
                  onChange={(e) => updateData('goals', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
          >
            Назад
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            {step === totalSteps ? 'Завершить' : 'Далее'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
