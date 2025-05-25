import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  text?: string;
  size?: number;
  className?: string;
  children?: React.ReactNode;
  fullscreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  text = 'Loading...',
  size = 48,
  className = '',
  children,
  fullscreen = true,
}) => {
  return (
    <div
      className={
        fullscreen
          ? `bg-background/80 fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xs ${className}`
          : `flex h-full w-full flex-col items-center justify-center ${className}`
      }
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner
        size={size}
        text={text}
        className="static bg-transparent"
      />
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default LoadingState;
