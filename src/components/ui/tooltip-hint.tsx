import { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface TooltipHintProps {
  content: string;
  children?: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showIcon?: boolean;
}

export function TooltipHint({ 
  content, 
  children, 
  side = 'top',
  showIcon = true 
}: TooltipHintProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button 
              type="button"
              className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              {showIcon && <HelpCircle className="h-4 w-4" />}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          className="max-w-xs text-sm"
          sideOffset={5}
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
