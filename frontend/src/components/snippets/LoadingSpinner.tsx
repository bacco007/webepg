import React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 48,
  className = '',
  text = 'Loading...',
}) => {
  return (
    <div
      className={cn(
        'bg-background/80 fixed inset-0 flex flex-col items-center justify-center backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4" role="status" aria-live="polite">
        <Loader2 className="text-primary animate-spin" size={size} aria-hidden="true" />
        <p className="text-primary text-xl font-semibold">{text}</p>
        <span className="sr-only">Loading, please wait...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
