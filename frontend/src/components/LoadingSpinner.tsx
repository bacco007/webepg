import React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProperties {
  size?: number;
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProperties> = ({
  size = 48,
  className = '',
  text = 'Loading...',
}) => {
  return (
    <div
      className={cn(
        'fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
        className,
      )}
    >
      <div
        className="flex flex-col items-center space-y-4"
        role="status"
        aria-live="polite"
      >
        <Loader2
          className="animate-spin text-primary"
          size={size}
          aria-hidden="true"
        />
        <p className="text-xl font-semibold text-primary">{text}</p>
        <span className="sr-only">Loading, please wait...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
