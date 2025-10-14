import { useState } from 'react';
import { WallPoll as WallPollType, votePoll } from '@/hooks/use-wall';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';

export function WallPoll({ poll }: { poll: WallPollType }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const hasVoted = poll.options.some(opt => opt.user_voted);

  const handleVote = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    await votePoll(poll.id, selected);
    qc.invalidateQueries({ queryKey: ['wall_feed'] });
    setSubmitting(false);
  };

  const toggleOption = (optionId: string) => {
    if (poll.is_multiple) {
      setSelected(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
    } else {
      setSelected([optionId]);
    }
  };

  return (
    <div className="border border-gray-200 rounded p-3 bg-gray-50 space-y-2">
      <div className="text-sm font-medium">{poll.question}</div>
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const percent = poll.total_votes > 0 ? Math.round((opt.votes_count / poll.total_votes) * 100) : 0;
          return (
            <div key={opt.id} className="space-y-1">
              {hasVoted ? (
                <div className="relative">
                  <div className="flex items-center justify-between text-xs">
                    <span className={opt.user_voted ? 'font-medium' : ''}>{opt.text}</span>
                    <span className="text-gray-500">{opt.votes_count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded overflow-hidden mt-1">
                    <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {poll.is_multiple ? (
                    <>
                      <Checkbox id={opt.id} checked={selected.includes(opt.id)} onCheckedChange={() => toggleOption(opt.id)} />
                      <Label htmlFor={opt.id} className="text-xs cursor-pointer">{opt.text}</Label>
                    </>
                  ) : (
                    <RadioGroup value={selected[0] || ''} onValueChange={(v) => setSelected([v])}>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <Label htmlFor={opt.id} className="text-xs cursor-pointer">{opt.text}</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!hasVoted && (
        <Button size="sm" onClick={handleVote} disabled={submitting || selected.length === 0}>
          {submitting ? 'Голосую...' : 'Проголосовать'}
        </Button>
      )}
      <div className="text-xs text-gray-500">Всего голосов: {poll.total_votes}</div>
    </div>
  );
}
