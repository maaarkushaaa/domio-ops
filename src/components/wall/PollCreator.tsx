import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

export type PollData = {
  question: string;
  options: string[];
  is_anonymous: boolean;
  is_multiple: boolean;
};

export function PollCreator({ onSave, onCancel }: { onSave: (poll: PollData) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMultiple, setIsMultiple] = useState(false);

  const addOption = () => setOptions([...options, '']);
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
  const updateOption = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      alert('Введите вопрос и минимум 2 варианта ответа');
      return;
    }
    onSave({ question, options: validOptions, is_anonymous: isAnonymous, is_multiple: isMultiple });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Вопрос</Label>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Введите вопрос..." className="text-sm" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Варианты ответов</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input value={opt} onChange={(e) => updateOption(idx, e.target.value)} placeholder={`Вариант ${idx + 1}`} className="text-sm flex-1" />
            {options.length > 2 && (
              <Button variant="ghost" size="sm" onClick={() => removeOption(idx)}><X className="h-4 w-4" /></Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addOption}>Добавить вариант</Button>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(v) => setIsAnonymous(!!v)} />
          <Label htmlFor="anonymous" className="cursor-pointer">Анонимное голосование</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="multiple" checked={isMultiple} onCheckedChange={(v) => setIsMultiple(!!v)} />
          <Label htmlFor="multiple" className="cursor-pointer">Множественный выбор</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Отмена</Button>
        <Button onClick={handleSave}>Создать опрос</Button>
      </div>
    </div>
  );
}
